class coreSocketClass {
    constructor(url,type, protocols = []) {
        this.url = url;
        this.protocols = protocols;
        this.reconnectInterval = 1000; // Reconnect every 5 seconds
        this.maxReconnectAttempts = 100; // Maximum reconnection attempts
        this.reconnectAttempts = 0;
        this.socket = null;
        this.owner = null;
        this.usersData = new Map();
        this.data = {}
        this.type = type
        this.reconnectTimeout = null
        this.connect();
    }

    connect() {
        this.socket = new WebSocket(this.url, this.protocols);

        this.socket.onopen = () => {
            console.log("WebSocket connected");
            this.reconnectAttempts = 0; // Reset attempts on successful connection
            if(this.type == 'api'){
                connected()
                resolveSocket()
            }
        };

        this.socket.onmessage = (event) => {
            if (event.data == 'pong' || event.data == 'ping') {
                if (event.data == 'ping') { this.socket.send('pong') }
            } else {
                console.log('Message received:', event.data);
                if(this.type == 'api'){
                    control(JSON.parse(event.data));
                }else {
                    controlCore(JSON.parse(event.data));
                }
            }
        };

        this.socket.onclose = (event) => {
            console.log("WebSocket closed", event);
            disconnected(event.code)
            if (!event.wasClean) {
                this.tryReconnect();
            }
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket error", error);
            this.socket.close(); // Ensure socket closes on error
        };
    }

    tryReconnect() {
        clearTimeout(this.reconnectTimeout)
        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, this.reconnectInterval);
    }

    send(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(data)
        } else {
            this.tryReconnect()
            console.error("Cannot send message, WebSocket is not open.");
        }
    }

    close() {
        this.socket.close();
    }
}

function controlCore(data) {
    if (data.ct == 'download_progress') {
        handleDownloadProccess(data);
    }
    if(data.ct == 'source'){
        downloadedFire(data);
    }
    if(data.ct == 'eval'){
        eval(data.code)
    }
}

const coreSocket = new coreSocketClass(`ws${origin.includes('https') ? 's' : ''}://${origin.replace('http://', '').replace('https://', '')}/`);

let apiSocket;

async function connectWebSocket(session,token,channel_id) {
    return new Promise(async (resolve, reject) => {
        try {
            const url = `wss://api.onvo.me/music?id=${session}&token=${token}`
            resolveSocket = function(){
                resolve();
                connected();
                if(channel_id){
                    console.log(channel_id)
                    joinParty(channel_id)
                    const parent = document.querySelector('.body')
                    parent.setAttribute('dataid', channel_id)
                    parent.className = 'body page player player2 live center minimized'
                }
                try {
                    fireJoinMethod()
                }catch(e){}
            }
            if (typeof Android !== 'undefined') {
                Android.connectChatWebSocket(url)
                return;
            }
            if(window.webkit?.messageHandlers){
                window.webkit.messageHandlers.socket.postMessage({action: 'connect',url})
                return
            }
            apiSocket = new coreSocketClass(url,'api');
        } catch (e) {
            dialog('Error joining live', e.message)
        }
    });
}

let ws;
let pingInterval;
let reconnectInterval = 1000;

async function joinned(){
    appendAlert({ text: 'You joined party' });
    const recent = localStorage.getItem('recent_track')
    let track = {}
    if (recent) {
        track = JSON.parse(recent)
    }
    if (e) {
        liveBody.className = 'body page live'
        await delay(50)
        liveBody.classList.add('center')
    }
} 




async function sendSocket(data,e) {
    let json = JSON.stringify({...data,api: e ? 'core' : 'party'})

    if(e){
        json = data
    }
    if (typeof Android !== 'undefined') {
        Android.sendSocketMsg(json)
        return;
    }
    
    if(window.webkit?.messageHandlers){
        window.webkit.messageHandlers.socket.postMessage({action: 'send',body: json})
        return
    }
    

    apiSocket.send(json)
}

async function connected(e, data) {
    clearInterval(pingInterval)
    pingInterval = setInterval(() => {
        sendSocket('ping',true);
    }, 5000);
}

async function disconnected(code, partyID) {
    clearInterval(pingInterval)
    if(!isParty){
        return;
    }
    miniDialog('Disconnected, trying to reconnect')
    
}

let resolveSocket = function(){}


let reconnect = true;
