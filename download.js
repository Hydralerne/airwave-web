const WebSocket = require('ws');
// Connect to WebSocket server
let ws;
let wssGlobal;

const sendCallback = async (body, type = 'socket') => {
    if (type == 'socket') {
        ws.send(JSON.stringify({ ct: 'data', body }))
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

function proxyConnect(id) {
    return new Promise((resolve, reject) => {
        ws = new WebSocket(`wss://st.onv.nu/proxy?id=${id}&dir=yt`);
        // Connection open
        ws.on('open', () => {
            resolve(ws)
        });
        // Handle incoming messages from the WebSocket server
        ws.on('message', async (data) => {
            const message = JSON.parse(data);

            // Extract details from the server message
            const { requestId, method, url, headers, body, ct } = message;

            // Construct full URL
            try {
                if (ct == 'request') {
                    console.log(message)
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
                    console.log(message)
                }
            } catch (err) {
                // Send error back to WebSocket if the fetch request fails
                ws.send(JSON.stringify({
                    requestId: requestId,
                    error: err.message,
                    complete: true
                }));
            }
        });

        // Handle WebSocket errors
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });

        // Handle WebSocket close
        ws.on('close', () => {
            clearTimeout(ssx)
            ssx = setTimeout(() => {
                connect();
            }, 2000)
            console.log('WebSocket connection closed.');
        });
    })
}
let ssx;

module.exports = { proxyConnect,ws: wssGlobal }