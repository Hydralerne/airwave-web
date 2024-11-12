const WebSocket = require('ws');
const https = require('https');
const http = require('http');
const mime = require('mime-types');
const path = require('path');
const fs = require('fs');
// Connect to WebSocket server
let { WebSocketServer } = WebSocket

let fetch;
let socket = {};

(async () => {
    fetch = (await import('node-fetch')).default;
})();

process.argv[2] = (process.argv[3] == "ios" || process.argv[3] == "android") ? process.argv[2] : path.join(__dirname,'../')

const createDownload = (id) => {
    const downloadsDir = path.join(process.argv[2], 'downloads', `${id}`);
    if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
    }
};

const IMAGES_DIR = path.join(process.argv[2], 'images');

// Ensure that the image directory exists
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR);
}

const downloadFile = (url, outputPath) => {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download file: ${response.statusCode}`));
                return;
            }

            const file = fs.createWriteStream(outputPath);
            response.pipe(file);

            file.on('finish', () => {
                file.close(resolve);
            });

            response.on('error', (err) => {
                fs.unlink(outputPath, () => reject(err));
            });
        });
    });
};

const parseM3U8 = async (m3u8Url) => {
    return new Promise((resolve, reject) => {

        https.get(m3u8Url, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                const lines = data.split('\n').filter(line => line && !line.startsWith('#'));
                resolve(lines);
            });

            response.on('error', (err) => {
                reject(err);
            });
        });
    });
};

const downloadHLS = async (m3u8Url, trackid, outputPath) => {
    try {
        const segments = await parseM3U8(m3u8Url);
        console.log(`Found ${segments.length} segments in playlist`);

        const outputFileName = `audio.mp3`;
        const fileStream = fs.createWriteStream(path.join(outputPath, outputFileName));

        for (let i = 0; i < segments.length; i++) {
            const segmentUrl = segments[i];
            console.log(`Downloading segment ${i + 1}/${segments.length}`);

            const progressPercentage = (((i + 1) / segments.length) * 100).toFixed(0);
            console.log(`Downloaded: ${progressPercentage}%`);
            try {
                socket.send(JSON.stringify({ ct: 'download_progress', percent: progressPercentage, trackid: trackid }))
            } catch (e) {
                console.log(e)
            }
            const tempSegmentPath = path.join(process.argv[2], `segment-${i}.ts`);
            await downloadFile(segmentUrl, tempSegmentPath);
            const segmentData = fs.readFileSync(tempSegmentPath);
            fileStream.write(segmentData);
            fs.unlinkSync(tempSegmentPath);
        }

        fileStream.end();
        socket.send(JSON.stringify({ ct: 'download_progress', status: 'finished', trackid: trackid, path: outputPath }))
        console.log(`HLS stream successfully downloaded and saved to ${outputPath}`);
    } catch (err) {
        console.error('Error downloading HLS stream:', err);
    }
};

const isHLSStream = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            const contentType = response.headers['content-type'];
            if (contentType && (contentType.includes('application/vnd.apple.mpegurl') || contentType.includes('audio/mpegurl'))) {
                resolve(true);
            } else {
                resolve(false);
            }
        }).on('error', (err) => {
            reject(err);
        });
    });
};



const getFileNameFromHeaders = (headers, url) => {
    let fileName;

    // Try to get filename from 'content-disposition' header
    const contentDisposition = headers['content-disposition'];
    if (contentDisposition && contentDisposition.includes('filename')) {
        fileName = contentDisposition
            .split('filename=')[1]
            .replace(/['"]/g, ''); // Remove any quotes around the filename
    } else {
        // Fallback to getting filename from URL
        const parsedUrl = new URL(url);
        fileName = path.basename(parsedUrl.pathname);
    }

    // Fallback if no extension is present, use Content-Type
    const contentType = headers['content-type'];
    if (!path.extname(fileName) && contentType) {
        const extension = contentType.split('/')[1]; // e.g., "audio/webm" -> "webm"
        fileName += `.${extension}`;
    }

    return fileName;
};
const downloadChunk = (url, start, end, index) => {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'Range': `bytes=${start}-${end}`,
            },
        };

        https.get(url, options, (response) => {
            let data = [];

            response.on('data', (chunk) => {
                data.push(chunk);
            });

            response.on('end', () => {
                resolve(Buffer.concat(data));
            });

            response.on('error', reject);
        }).on('error', reject);
    });
};

const downloadParallel = async (url, trackid, outputPath, numChunks = 10) => {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            const totalSize = parseInt(response.headers['content-length'], 10);
            const chunkSize = Math.ceil(totalSize / numChunks);
            const contentType = response.headers['content-type'];
            console.log(response.headers)
            const extension = mime.extension(contentType) || 'mp3';  // Default to 'mp3' if unknow
            // Get the file name from headers or URL, and append the correct extension
            const fileName = `audio.${extension}`;

            let downloadedTotal = 0;

            // Progress callback to update the total downloaded size and show the percentage
            const progressCallback = (chunkDownloaded) => {
                downloadedTotal += chunkDownloaded;
                const progressPercentage = ((downloadedTotal / totalSize) * 100).toFixed(0);
                console.log(`Downloaded: ${progressPercentage}%`);
                try {
                    socket.send(JSON.stringify({ ct: 'download_progress', trackid: trackid, total: totalSize, downloaded: downloadedTotal, percent: progressPercentage }))
                } catch (e) {
                    console.log(e)
                }
            };

            const downloadPromises = [];

            for (let i = 0; i < numChunks; i++) {
                const start = i * chunkSize;
                const end = (i + 1) * chunkSize - 1;

                downloadPromises.push(
                    downloadChunk(url, start, end, i)
                        .then((chunk) => {
                            progressCallback(chunk.length); // Pass the size of the downloaded chunk
                            return chunk;
                        })
                );
            }

            Promise.all(downloadPromises)
                .then((chunks) => {
                    const fileBuffer = Buffer.concat(chunks);
                    const file = path.join(outputPath, fileName)
                    fs.writeFileSync(file, fileBuffer);
                    resolve(file)
                    socket.send(JSON.stringify({ ct: 'download_progress', status: 'finished', trackid: trackid, path: file }))
                })
                .catch((err) => {
                    console.error('Error downloading file:', err.message);
                });
        });
    });
};

const downloadHandler = async (id, url, trackid, isTmp) => {
    createDownload(id);
    console.log('recived Dwonload')
    let outputPath = path.join(process.argv[2], 'downloads', String(id));
    const dirFiles = fs.readdirSync(outputPath);
    if (dirFiles.length > 0) {
        //        return dirFiles[0]
    }
    try {
        const isHLS = await isHLSStream(url);
        if (isHLS) {
            outputPath = await downloadHLS(url, trackid, outputPath);
        } else {
            outputPath = await downloadParallel(url, trackid, outputPath);
        }
    } catch (e) {
        console.log(e)
    }
    return outputPath;
}


const removeImages = (req, res, next) => {
    try {
        fs.rmSync(IMAGES_DIR, { recursive: true })
        fs.mkdirSync(IMAGES_DIR);
    } catch (e) {
        console.log(e)
    }
    res.json({ status: 'success' })
}

const urlToFilename = (urlString) => {
    try {
        const url = new URL(urlString);
        return `${url.hostname}${url.pathname.replace(/\//g, '_')}${url.search.replace(/\?/, '_') || ''}`;
    } catch (e) {
        return encodeURIComponent(urlString)
    }
};

const proxyImages = (req, res, next) => {
    const imageUrl = req.query.url;
    const noCache = req.query.nocache
    if (!imageUrl) {
        return res.status(400).send('URL query parameter is required');
    }

    const filename = urlToFilename(imageUrl);
    const filePath = path.join(IMAGES_DIR, filename);

    if (fs.existsSync(filePath)) {
        return res.sendFile(filePath, (err) => {
            if (err) {
                return res.status(500).send('Error retrieving the cached image');
            }
        });
    }

    const requestOptions = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36',
        }
    };

    https.get(imageUrl, requestOptions, (proxyRes) => {
        if (proxyRes.statusCode !== 200) {
            return res.status(proxyRes.statusCode).send('Error fetching the image');
        }
        proxyRes.pipe(res);
        if (!noCache) {
            const fileStream = fs.createWriteStream(filePath);
            proxyRes.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close(() => {
                    // console.log(`Image saved locally as: ${filename}`);
                });
            });

            fileStream.on('error', (err) => {
                fs.unlink(filePath, () => { });
                // console.error('Error saving the image:', err);
            });
        }
    }).on('error', (err) => {
        // console.error('Error proxying the image:', err);
        // return res.send('Error proxying the image');
    });
};


let proxyWS;
let wssGlobal = {};

const sendCallback = async (body, type = 'socket') => {
    if (type == 'socket') {
        proxyWS.send(JSON.stringify({ ct: 'data', body }))
        return
    }
    const boadcast = await fetch('https://st.onv.nu/airwave/youtube', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...body })
    })

    const boadcastData = await boadcast.json()
}

let globalId
let timeInterval

function proxyConnect(id) {
    if (!id) {
        return
    }
    globalId = id
    return new Promise((resolve, reject) => {
        proxyWS = new WebSocket(`wss://st.onv.nu/proxy?id=${id}&dir=yt`);
        // Connection open
        proxyWS.on('open', () => {
            timeInterval = setInterval(() => {
                proxyWS.send('ping')
            }, 5000)
            resolve(proxyWS)
        });
        // Handle incoming messages from the WebSocket server
        proxyWS.on('message', async (data) => {
            let message = data.toString('utf8')
            if (message == 'pong' || message == 'ping') {
                if (data == 'ping') {
                    proxyWS.send('pong')
                }
                return
            }

            try {
                message = JSON.parse(data);
            } catch (e) {
                console.log('not valid message', message, globalId)
                return
            }
            // Extract details from the server message
            const { requestId, method, url, headers, body, ct } = message;

            // Construct full URL
            try {
                if (ct == 'request') {
                    console.log('requesting', requestId)
                    // Make the HTTP request using axios with the constructed full URL
                    const response = await fetch(url, {
                        method: method,
                        headers: headers,
                        body: method === 'POST' ? body : undefined,
                    });

                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    // Create a response object to send back to WebSocket
                    const responseData = {
                        requestId,
                        statusCode: response.status,
                        headers: response.headers,
                        data: buffer.toString('utf8'), // or whatever encoding you need
                    };

                    try {
                        sendCallback(responseData)
                    } catch (e) {
                        console.error(e)
                    }
                } else if (ct == 'source') {
                    socket.send(JSON.stringify(message))
                }
            } catch (err) {
                // Send error back to WebSocket if the fetch request fails
                console.log(err)
            }
        });

        // Handle WebSocket errors
        proxyWS.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        // Handle WebSocket close
        proxyWS.on('close', () => {
            clearTimeout(ssx)
            ssx = setTimeout(() => {
                proxyConnect(globalId);
            }, 2000)
            console.log('WebSocket connection closed.');
        });
    })
}

let ssx;

function createWebSocket(server) {
    return new Promise((resolve, reject) => {
        wssGlobal = new WebSocketServer({ server });
        let heartBeat;
        resolve(wssGlobal)
        wssGlobal.on('connection', function connection(ws, request) {
            socket = ws
            heartBeat = setInterval(() => {
                ws.send('ping');
            }, 4000)

            ws.on('message', async function incoming(message) {
                if (message.toString('utf-8') == 'ping' || message.toString('utf-8') == 'pong') {
                    if (message.toString('utf-8') == 'ping') {
                        ws.send('pong')
                    }
                    return;
                }
                handleIncomming(ws, message.toString('utf-8'));
            });

            ws.on('close', function close() {
                clearInterval(heartBeat);
            });

            ws.on('error', function error(err) {
                console.error('WebSocket error:', err.message);
            });

        });
    });
}

const handleIncomming = async (ws, message) => {
    try {
        const json = JSON.parse(message)
        if (json.ct == 'download') {
            ws.send(JSON.stringify({ ct: 'download_progress', status: 'started', trackid: json.trackid }))
            const outputPath = await downloadHandler(json.id, json.url, json.trackid);
            return
        }
        if (json.ct == 'yt') {
            if (!proxyWS) {
                proxyWS = await proxyConnect(json.id)
            }
            proxyWS.send(JSON.stringify({ ct: 'download', YTcode: json.YTcode }))
        }
    } catch (e) {
        console.log(e);
    }
}

const StreamZip = require('node-stream-zip');

async function cloneRepo(repoUrl, targetDir, onProgress) {
    try {
        // Extract the repository owner and name from the URL
        const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)\.git/);
        if (!match) throw new Error('Invalid GitHub repository URL');
        const [_, owner, repoName] = match;

        // Get repository metadata to find the default branch
        const apiUrl = `https://api.github.com/repos/${owner}/${repoName}`;
        const apiResponse = await fetch(apiUrl);
        if (!apiResponse.ok) throw new Error(`Failed to fetch repository metadata: ${apiResponse.statusText}`);
        const repoMetadata = await apiResponse.json();
        const defaultBranch = repoMetadata.default_branch;

        // Create the archive URL for the default branch
        const archiveUrl = `${repoUrl.replace('.git', '')}/archive/refs/heads/${defaultBranch}.zip`;
        const archivePath = path.join(targetDir, `${repoName}.zip`);

        // Ensure the target directory exists
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        const repoDir = path.join(targetDir, repoName);
        if (fs.existsSync(repoDir)) {
            fs.rmSync(repoDir, { recursive: true });
        }

        // Download the repository archive
        const response = await fetch(archiveUrl);
        if (!response.ok) throw new Error(`Failed to download archive: ${response.statusText}`);

        const totalBytes = parseInt(response.headers.get('content-length'), 10) || 0;
        let downloadedBytes = 0;

        // Save the downloaded archive to a file with progress reporting
        const fileStream = fs.createWriteStream(archivePath);
        let lastReportedPercent = 0;

        await new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(archivePath);
            response.body.on('data', chunk => {
                downloadedBytes += chunk.length;
                const percent = Math.floor((downloadedBytes / totalBytes) * 100);

                // Only report progress if it has increased by at least 1%
                if (percent > lastReportedPercent) {
                    lastReportedPercent = percent;
                    onProgress(percent);
                }
            });

            response.body.pipe(fileStream);
            response.body.on('error', reject);
            fileStream.on('finish', resolve);
        });
        // Extract the downloaded archive
        const zip = new StreamZip.async({ file: archivePath });
        const tempDir = path.join(targetDir, `${repoName}-temp`);

        // Extract to a temporary directory
        if (onProgress) onProgress(70);
        await zip.extract(null, tempDir);
        await zip.close();

        // Move files from the temporary directory to the final repository directory
        const tempRepoDir = path.join(tempDir, `${repoName}-${defaultBranch}`);
        const files = fs.readdirSync(tempRepoDir);
        fs.mkdirSync(repoDir);
        files.forEach(file => {
            try {
                const srcPath = path.join(tempRepoDir, file);
                const destPath = path.join(repoDir, file);
                fs.renameSync(srcPath, destPath);
            } catch (e) {
                console.log(e);
            }
        });

        // Clean up the temporary directory and the archive file
        fs.rmdirSync(tempDir, { recursive: true });
        fs.unlinkSync(archivePath);

        if (onProgress) onProgress(100);

        return { status: 'success', path: repoDir, name: repoName };
    } catch (error) {
        console.error(error);
        return { error: 'clone_failed', type: 'Clone failed', message: `Failed to clone repository: ${error.message}` };
    }
}

const proxyRequest = (req, res) => {
    try {
        const downloadUrl = req.query.url
        const protocol = downloadUrl.startsWith('https') ? https : http;
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
            }
        };
        if (req.headers['range']) {
            options.headers['Range'] = req.headers['range'];
        }
        protocol.get(downloadUrl, options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        }).on('error', (err) => {
            console.log(err)
            res.status(500).send(`Error proxying the request: ${err.message}`);
        });
    } catch (e) {
        res.json({ error: e.message })
    }
};

module.exports = {
    proxyConnect,
    createWebSocket,
    proxyImages,
    removeImages,
    downloadHandler,
    cloneRepo,
    proxyRequest
}
