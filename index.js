const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const unzipper = require('unzipper');
const bodyParser = require('body-parser');

const soundcloud = require(path.join(__dirname, 'soundcloud.js'));
const lyrics = require(path.join(__dirname, 'lyrics.js'));
const core = require(path.join(__dirname, 'handler.js'));
const spotify = require(path.join(__dirname, 'spotify.js'));
const ytdlp = require(path.join(__dirname, 'ytdlp', 'youtube.js'));
const { cloneRepo, createWebSocket, proxyImages, downloadHandler, removeImages } = require(path.join(__dirname, 'proxy.js'));

const remotePathDir = path.join(process.argv[2], 'remote');
const remotePath = path.join(remotePathDir, 'airwave-remote', 'main.js');


const cors = require('cors');
const version = '1.0';
const url = require('url');

const http = require('http');
const mime = require('mime-types');

let fetch;

(async () => {
    fetch = (await import('node-fetch')).default;
})();

const app = express();
const PORT = 2220;


// remote update in case of apple removed app from app store
if (fs.existsSync(remotePath)) {
    const router = require(remotePath)
    app.use('/', router);
}


// const accessControl = (req) => {
//     const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
//     const requestedUrl = req.originalUrl;

//     console.log(clientIp)
//     if (allowedIPs.includes(clientIp)) {
//         return true;
//     } else {
//         return false;
//     }
// };

// const accessControlMiddleware = (req, res, next) => {
//     console.log(req.headers['x-forwarded-for'])
//     if (accessControl(req)) {
//         next();
//     } else {
//         res.status(403).send('Access denied');
//     }
// };
// Parse incoming request bodies in a middleware before your handlers
// Allowed IPs and Cookies

app.set('trust proxy', true);

let allowed = {}
const isWeb = true

const accessControlBlock = (req, res, next) => {
    if (req.query.token == 'sjaiidlklqa' || Object.keys(allowed).includes(req.headers['x-real-ip'])) {
        allowed[req.headers['x-real-ip']] = true
        next(); // Allow the request to proceed
    } else {
        res.status(403).send('Access denied.'); // Deny access with a 403 Forbidden status
    }
};

const blockWeb = (req,res,next) => {
    if(isWeb){
        return res.json({error: 'access_denied'})
    }
    next()
}

//app.use(accessControlBlock)

// app.use(accessControlBlock)
// Use middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', [
    path.join(__dirname, 'public'),
    path.join(__dirname, 'static'),
    path.join(__dirname, 'ejs'),
]);

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));


app.get('/append',blockWeb, async (req, res) => {
    try {
        await cloneRepo(decodeURIComponent(req.query.url), remotePathDir, (percent) => {
            console.log(percent)
        });
        res.json({ status: 'success' })
    } catch (e) {
        res.json({ error: e.message })
    }
})
app.get('/spotify/:method',cors(),  async (req, res) => {
    try {
        let json = {}
        if (req.params.method == 'playlist') {
            console.log('scraping')
            json = await spotify.getPlaylist(req)
        }
        res.json(json)
    } catch (e) {
        console.log(e)
        res.json({ error: e.message })
    }
})

app.get('/clear',blockWeb, removeImages);

app.get('/proxy',blockWeb, proxyImages);

app.get('/get-id', async (req, res) => {
    const { q } = req.query
    const videoId = await core.getVideoId(decodeURIComponent(q));
    res.json({ id: videoId })
});

app.get('/music',blockWeb, (req, res) => {
    res.render('musicBody', { req: req })
});
app.get('/profile', (req, res) => {
    res.render('profile', { req: req })
});
app.get('/radio/:id', (req, res) => {
    res.render('index', { req: req })
});
app.get('/soundcloud/playlist', async (req, res) => {
    try {
        const list = await soundcloud.getSoundcloudList(req);
        res.json(list)
    } catch (e) {
        console.log(e)
        res.json({ error: e.toString() })
    }
});

app.get('/soundcloud/home', async (req, res) => {
    try {
        const home = await soundcloud.soundcloudDiscovery(req);
        res.json(home)
    } catch (e) {
        console.log(e)
        res.json({ error: e.toString() })
    }
});

app.get('/soundcloud/track', async (req, res) => {
    try {
        const list = await soundcloud.getSoundcloudSingleTrack(req.query.id, req.query.method);
        res.json(list)
    } catch (e) {
        console.log(e)
        res.json({ error: e.toString() })
    }
});

app.get('/soundcloud/tracks', async (req, res) => {
    try {
        const tracks = req.query.tracks?.split(',')
        const list = await soundcloud.getSoundcloudTracks(tracks);
        res.json(list)
    } catch (e) {
        console.log(e)
        res.json({ error: e.toString() })
    }
});

app.get('/soundcloud/trending', async (req, res) => {
    try {
        const tracks = await soundcloud.getSoundcloudTrendingTracks(req.query.genre, req.query.offset, req.query.limit, req.query.client_id);
        let data = tracks;
        if (req.query.list) {
            data = {
                api: 'soundcloud',
                id: req.query.genre,
                type: 'trending',
                name: req.query.name || req.query.genre,
                tracks_count: '+500',
                genre: req.query.genre,
                with_tracks: true,
                owner: {
                    name: 'Soundcloud',
                    image: 'https://a-v2.sndcdn.com/assets/images/sc-icons/ios-a62dfc8fe7.png',
                    verified: true,
                },
                tracks: tracks,
            }
        }
        res.json(data)
    } catch (e) {
        console.log(e)
    }
})

app.get('/soundcloud/:dir', async (req, res) => {
    const api = req.query.api;
    const dir = req.params.dir
    if ((dir !== 'search' && dir !== 'trending' && dir !== 'related') || (dir == 'search' && (!req.query.q || req.query.q == ''))) {
        return res.json({ error: 'error_paramater' });
    }

    let data = await soundcloud.getSoundcloudTracks(dir, req);


    res.json(data ?? { error: 'check_payloads' });
});

app.get('/youtube/search', async (req, res) => {
    try {
        if (!req.query.q || req.query.q == '') {
            return res.json({ error: 'empty_query' })
        }
        const json = await core.scrapYoutube(`https://www.youtube.com/results?search_query=${(req.query.q)}`)
        const data = core.filterYoutube(json)
        res.json(data)
    } catch (e) {
        res.status(400).send('Error ' + e)
    }
});

app.get('/youtube/playlist', async (req, res) => {
    try {
        const data = await getYoutubeList(req)
        res.json(data)
    } catch (e) {
        console.log(e)
        res.json({ error: e.message })
    }
});

app.get('/youtube/lyrics', async (req, res) => {
    try {
        if (!req.query.id) {
            return res.json({ error: 'empty_query' })
        }
        const data = await lyrics.getNativeSubtitles(req.query.id)
        res.json(data)
    } catch (e) {
        console.log(e)
        res.status(400).json({ error: e.message })
    }
});

app.get('/anghami/:endpoint/:id?', async (req, res) => {
    try {
        const data = await core.anghamiHandler(req)
        res.json(data)
    } catch (e) {
        console.log(e)
        res.json({ error: e.message })
    }
})

app.get('/apple/related', core.getAppleRelated);

app.get('/apple/home', core.getAppleHome);

app.get('/get-source', async (req, res) => {
    try {
        if (!req.query.id) {
            return res.json({ error: 'missing_paramater' })
        }
        const data = await ytdlp.getSourceURL(req.query.id)
        res.json(data)
    } catch (e) {
        res.json({ error: e.message })
    }
})

app.get('/', (req, res) => {
    res.render('index', { req: req })
});
app.get('/lyrics', (req, res) => {
    res.render('lyrics', { req: req })
});
app.get('/raw/:body', (req, res) => {
    try {
        res.render(req.params.body, { req: req })
    } catch (e) {
        res.send('')
    }
});

app.post('/download',blockWeb, async (req, res) => {
    const { id, path } = req.body;
    try {
        let outputPath = path.join(process.argv[2], 'downloads', String(id));
        fs.rmSync(outputPath)
    } catch (e) {
        console.log(e)
        res.json({ error: e.message })
    }
});

app.post('/download',blockWeb, async (req, res) => {
    const { id, url, trackid } = req.body;
    try {
        if (!id || !url) {
            return res.status(400).send('Missing required parameters');
        }
        const outputPath = await downloadHandler(id, url, trackid, true);
        res.json({ status: 'success', file: outputPath });
    } catch (error) {
        console.error('Error during download:', error);
        res.status(500).send('Error downloading file');
    }
});

app.get('/retrieve',blockWeb, (req, res) => {
    try {
        const { id, raw } = req.query;

        const file = decodeURIComponent(raw)

        if (!id && !file) {
            return res.status(400).send('Missing required parameters');
        }

        const downloadsDir = file ? file : path.join(process.argv[2], 'downloads', id);

        if (!fs.existsSync(downloadsDir)) {
            return res.status(404).send('Directory not found');
        }
        const stats = fs.statSync(downloadsDir);
        if (stats.isFile()) {
            return res.sendFile(downloadsDir)
        }
        const files = fs.readdirSync(downloadsDir)

        if (files.length === 0) {
            return res.status(404).send('No audio files found for this ID');
        }

        const filePath = path.join(downloadsDir, files[0]);
        res.sendFile(filePath);
    } catch (e) {
        res.json({ error: e.message })
    }
});
app.post('/test',blockWeb, async (req, res) => {
    try {
        const response = await fetch(req.body.url, {
            method: 'HEAD', // Change this to GET instead of HEAD
            headers: {
                'Range': 'bytes=0-1'  // Request only the first byte of the stream
            }
        });
        if (response.ok) {
            res.json({ isValid: true })
        } else {
            res.json({ isValid: false })
        }
    } catch (error) {
        res.json({ isValid: false, error })
    }
})
app.get('/check', (req, res) => {
    res.json({ status: 'success' })
});
app.post('/log-error',blockWeb, (req, res) => {
    console.log(req.body)
    res.json({ status: 'success' })
});
app.get('/check_audio',blockWeb, (req, res) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).send('Missing required parameters');
        }

        const downloadsDir = path.join(process.argv[2], 'downloads', id);

        if (!fs.existsSync(downloadsDir)) {
            return res.status(404).json({ error: 'not_found' });
        }

        const files = fs.readdirSync(downloadsDir).filter(file => {
            const mimeType = mime.lookup(file);
            return mimeType && mimeType.startsWith('audio');
        });

        if (files.length === 0) {
            return res.status(404).json({ error: 'not_found' });
        }

        const filePath = path.join(downloadsDir, files[0]);
        return res.status(404).json({ status: 'success', path: filePath });
    } catch (e) {
        res.json({ error: e.message })
    }
});

app.get('/sound_api', soundcloud.soundcloudThread)

app.get('/:endpoint', async (req, res) => {
    try {
        const { endpoint } = req.params
        if (!endpoint) {
            throw new Error('ass')
            return
        }
        const clientIP = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
        const response = await fetch(`https://api.onvo.me/music/user/${req.params.endpoint}?method=username`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer SDAXCX213XADS1222XZAWEXXZDFAAS09182EWAS`,
                'X-Client-IP': clientIP
            }
        });
        const data = await response.json()
        res.render('profileIndex', { req: req, data });
    } catch (e) {
        console.log(e)
        res.render('index', { req: req })
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke! ');
});



const server = http.createServer(app);
server.setTimeout(0);
createWebSocket(server);

server.listen(PORT, () => {
    console.log(`HTTP server running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
    console.error('Server error:', error);
});
