
if (window.trustedTypes) {
    const policy = window.trustedTypes.createPolicy('default', {
        createHTML: (input) => input,
        createScriptURL: (input) => input,  // Allow setting script URLs
    });
}


document.body.innerHTML = '<div id="player"></div>';  // Append 'player' div to the body

// Dynamically create the script for the YouTube Iframe API
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);  // Append the script to the head

let player
// Create the YouTube player once the API is loaded
window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('player', {
        height: '360',
        width: '640',
        videoId: 'M7lc1UVf-VE',  // Replace with your YouTube video ID
        events: {
            'onReady': onPlayerReady
        }
    });
};

function onPlayerReady(event) {
    const frameWindow = frames[0].window
    if (frameWindow.trustedTypes) {
        const policy = frameWindow.trustedTypes.createPolicy('default', {
            createHTML: (input) => input,
            createScriptURL: (input) => input,  // Allow setting script URLs
        });
    }

    for (event_name of ["visibilitychange", "webkitvisibilitychange", "blur"]) {
        frameWindow.addEventListener(event_name, function (event) {
            event.stopImmediatePropagation();
        }, true);
    }

    const audioContext = new AudioContext();
    const videoElement = frameWindow.document.querySelector('.html5-main-video'); // Or 'audio' element
    const source = audioContext.createMediaElementSource(videoElement);

    // Create a destination node (to capture audio output)
    const destination = audioContext.createMediaStreamDestination();

    // Connect the source to the destination
    source.connect(destination);

    // Now we have an audio stream that we can send to the Node.js server
    const mediaStream = destination.stream;

    // Sending the audio stream to the server using WebSockets
    const socket = new WebSocket('ws://localhost:6500'); // Your Node.js WebSocket server
    socket.onopen = () => {
        try {
            const audioTrack = mediaStream.getAudioTracks()[0];
            const mediaRecorder = new MediaRecorder(mediaStream);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    socket.send(e.data); // Send audio data chunks to the server
                }
            };

            mediaRecorder.start(100); // Capture data every 100 ms (smaller chunks for low latency)
        } catch (e) {
            window.webkit.messageHandlers.codeMain.postMessage('dialog("' + e.message + '")');
        }
        player.playVideo()
        console.log('Player is ready');
    }
}
