
const WebSocket = require('ws');
const http = require('http');

// WebSocket server
const wss = new WebSocket.Server({ port: 6500 });

// HTTP clients
let clients = [];

console.log('thread wojs')

// Buffer audio chunks
let audioBuffer = [];

// WebSocket connection
wss.on('connection', (ws) => {
    console.log('Soket connected')
    ws.on('message', (data, isBinary) => {
        console.log('reciving',data)
        if (isBinary) {
            audioBuffer.push(data);
            clients.forEach((client) => {
                client.write(data);
            });
        }
    });
});

// Serve the HTTP stream
http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'audio/webm',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    audioBuffer.forEach(chunk => {
        res.write(chunk);
    });

    clients.push(res);

    res.on('close', () => {
        clients = clients.filter(client => client !== res);
    });
}).listen(3200, () => {
    console.log('Streaming at http://localhost:3200');
});
