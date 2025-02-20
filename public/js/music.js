
const sliderEl = document.querySelector('#audioStatusBar')
const currentMove = document.querySelector('.status-wrapper a')
const audioPlayer = document.querySelector('#audioPlayer')

let lyrics;
let jsonLyrics = {}

try {
    if (localStorage.getItem('video-checked')) {
        document.querySelector('.video-check').classList.remove('checked');
        document.querySelector('.body').classList.add('no-video')
    } else {
        document.querySelector('.video-check').classList.add('checked');
    }
} catch (e) {
    console.error(e)
}


function toggleYoutube(el) {
    el.classList.toggle('checked');
    if (el.classList.contains('checked')) {
        document.querySelector('.body').classList.remove('no-video')
        localStorage.removeItem('video-checked')
        initializeYoutube(currentSong.yt)
    } else {
        document.querySelector('.body').classList.add('no-video')
        localStorage.setItem('video-checked', 'true')
        destroyYoutube();
    }
}

document.querySelector('.video-check')?.addEventListener('click', function () {
    toggleYoutube(this)
})

const liveBody = document.querySelector('.body')

// Ex

const loader = {
    logo: null,
    newOpacity: 1,
    targetOpacity: 0,
    duration: 3000,
    intervalDuration: 10,
    currentStep: 0,
    steps: 0,
    isPaused: false,
    callback: null,
    animationFrame: null,
    startTime: null,

    initialize() {
        this.steps = this.duration / this.intervalDuration;
    },

    start(callback, node, duration = null) {
        if (duration !== null) {
            this.setDuration(duration);
        }
        this.logo = node
        this.callback = callback;
        if (!this.animationFrame) {
            this.reset();
            this.startTime = performance.now();
            this.animationFrame = requestAnimationFrame(this.update.bind(this));
        }
    },

    pause() {
        this.isPaused = true;
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
    },

    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            this.startTime = performance.now() - (this.currentStep * this.intervalDuration);
            this.animationFrame = requestAnimationFrame(this.update.bind(this));
        }
    },

    reset() {
        this.newOpacity = 1;
        this.currentStep = 0;
        this.isPaused = false;
        this.startTime = null;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        if (!this.logo) {
            return;
        }
        this.logo.style.webkitMaskImage = `linear-gradient(to ${currentDir}, transparent 100%, black 0%)`;
    },


    update(timestamp) {
        if (!this.startTime) this.startTime = timestamp;
        const elapsed = timestamp - this.startTime;
        this.currentStep = Math.floor(elapsed / this.intervalDuration);

        if (this.currentStep < this.steps) {
            this.newOpacity = 1 - (this.currentStep / this.steps);
            this.logo.style.webkitMaskImage = `linear-gradient(to ${currentDir}, transparent ${this.newOpacity * 100}%, black 0%)`;
            if (this.callback) {
                this.callback((1 - this.newOpacity) * 100);
            }
            this.animationFrame = requestAnimationFrame(this.update.bind(this));
        } else {
            this.newOpacity = 0;
            this.logo.style.webkitMaskImage = `linear-gradient(to ${currentDir}, transparent 0%, black 0%)`;
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
            if (this.callback) {
                this.callback(100);
            }
        }
    },

    setOpacity(opacity, callback) {
        this.newOpacity = 1 - (opacity / 100);
        this.logo.style.webkitMaskImage = `linear-gradient(to ${currentDir}, transparent ${this.newOpacity * 100}%, black 0%)`;
        if (callback) {
            callback(opacity);
        }
    },

    setDuration(newDuration) {
        const elapsed = (performance.now() - this.startTime) / this.duration;
        this.duration = newDuration;
        this.steps = this.duration / this.intervalDuration;
        this.startTime = performance.now() - (elapsed * this.duration);
    },

    jumpTo100(e) {
        cancelAnimationFrame(this.animationFrame);
        const startOpacity = this.newOpacity;
        const startTime = performance.now();
        const duration = 200; // 0.2 seconds

        const animate = (timestamp) => {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            this.newOpacity = startOpacity * (1 - progress);
            this.logo.style.webkitMaskImage = `linear-gradient(to left, transparent ${this.newOpacity * 100}%, black 0%)`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.logo.style.webkitMaskImage = `linear-gradient(to left, transparent 0%, black 0%)`;
                if (this.callback) {
                    this.callback(100);
                }
            }
        };

        requestAnimationFrame(animate);
    }
};


// loader.initialize();

let playCallback;
const isMobile = true;
let isParty = false;

function play() {
    try {
        if (isParty) {
            if (isOwner()) {
                sendSocket({ 'ct': 'control', action: 'signal', do: 'play', time: globalTime, id: currentSong.id, track: currentSong });
            }
        }
        globalPause = false
        if (typeof Android !== 'undefined') {
            Android.resumePlayer()
            // return
        }
        try {
            if (YTplayer) {
                YTplayer?.playVideo();
            }
        } catch (e) {

        }

        if (window.webkit?.messageHandlers) {
            window.webkit.messageHandlers.playMusic.postMessage(0)
            return
        }

    } catch (e) {
        console.error(e)
    }

    audioPlayer.play();
}
let ytInitialized = false;
function resetPlayer(id) {
    try {
        seek(0)
        setTimeout(() => {
            pause(true)
        }, 50)
        document.querySelector('.artist-inner-song img').src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAgAB/ubWFXkAAAAASUVORK5CYII='
        audioPlayer.src = ''
        sliderEl.value = 0;
        liveBody.classList.remove('no-lyrics')
        ytInitialized = false
        currentMove.style.width = 0

        document.querySelector('.styling').innerHTML = ''
        lyricsInitialize = false;
        if (window.webkit?.messageHandlers) {
            window.webkit.messageHandlers.resetPlayer.postMessage('')
        }
        document.querySelectorAll('.running').forEach(running => { running.classList.remove('running'); running.querySelector('.equalizer')?.remove() })
        if (!document.querySelector('.play-pause').classList.contains('played')) {
            document.querySelector('.control-eue.about-song.saved')?.classList.remove('saved')
            document.querySelectorAll('.song[trackid="' + id + '"]').forEach(sngel => {
                sngel.classList.add('paused')
            })
        } else {
            document.querySelector('.play-pause').classList.remove('played')
        }
        document.querySelectorAll('.media-playback-live span').forEach(span => { span.innerText = '00:00' })
        loadingLyrics()
        jsonLyrics = null
        lyricsInitialize = false
        if (currentSong.api == 'soundcloud' && YTplayer) {
            clearInterval(youtubeInterval)
            YTplayer.destroy();
            YTplayer = null;
        }
    } catch (e) {
        console.error(e)
    }
}
function pause(e) {
    try {
        if (isParty) {
            if (isOwner() && !e) {
                sendSocket({ 'ct': 'control', action: 'signal', do: 'pause' });
            }
        }
        globalPause = true
        if (typeof Android !== 'undefined') {
            Android.pausePlayer()
            // return
        }
        try {
            if (YTplayer) {
                YTplayer.pauseVideo();
                console.log('pauseing')
            }
        } catch (e) {

        }
        if (window.webkit?.messageHandlers) {
            window.webkit.messageHandlers.pauseMusic.postMessage(parseFloat('123'))
            return
        }

    } catch (e) {
        console.error(e)
    }

    audioPlayer.pause()
}
function seek(time) {
    try {
        if (isParty) {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(function () {
                sendSocket({ 'ct': 'control', action: 'signal', do: 'move', time: time });
            }, 250);
        }
        currentTimeText.innerText = formatTime(time)
        if (typeof Android !== 'undefined') {
            Android.seekto(time)
            return
        }
        if (window.webkit?.messageHandlers) {
            window.webkit.messageHandlers.seekTo.postMessage(time)
            return
        }
    } catch (e) {
        console.error(e)
    }
    if (YTplayer) {
        YTplayer?.seekTo(time, true);
    }
    audioPlayer.currentTime = time
}

async function switchCloseLive() {
    await closeLiveSettings();
    minimizePlayer()
}

function actualKick(id) {
    sendSocket({ ct: 'kick', id: id });
    closeLiveSettings();
    closeError()
    document.querySelector(`.user-component[dataid="${id}"]`).remove();
}

function kickUser(id) {
    dialog('Are you sure?', 'If you kick this user, you will not be able to unblock them again', [
        `<button class="main" onclick="actualKick('${id}')"><span>Kick anyway</span></div>`,
        '<button onclick="closeError();"><span>Cancel</span></div>'
    ])
}

function lockLive(e) {
    if (e) {
        sendSocket({ ct: 'privacy', action: 'private' });
        return
    }
    sendSocket({ ct: 'privacy', action: 'public' });
}

function muteUser(id) {
    partyControl.get(id).muted = true
    sendSocket({ ct: 'mute', id: id });
}

function userSettings(id) {
    let options = `
    <div class="switch-options">
    ${party.owner == localStorage.getItem('userid') ? `<div onclick="draggableMusic.closeMenu();kickUser('${id}');" ontouchstart="op(this,true)" ontouchend="op(this)" ontouchmove="op(this)" class="swtich-option-tap kick-live"><span></span><section><a>Kick user</a></section></div>
    <div ontouchstart="op(this,true)" ontouchend="op(this)" ontouchmove="op(this)" class="swtich-option-tap mute-user" onclick="draggableMusic.closeMenu();muteUser('${id}')"><span></span><section><a>Mute user messages</a></section></div>
    `: '<div ontouchstart="op(this,true)" ontouchend="op(this)" ontouchmove="op(this)" class="swtich-option-tap report-list-tap" onclick="report()"><span></span><section><a>Report user</a></section></div>'}</div>
    `

    drag('options', options)
}

function printLiveUser(data, id) {
    try {
        let html = `<div class="user-component ${data.muted ? 'muted' : ''}" dataid="${id}">
    <div class="user-image-ass" onclick="switchCloseLive();openProfile('${data.id}');" style="background-image: url('${data.image.replace('/profile/', '/profile_large/')}')"></div>
    <section><span>${data.fullname}</span><a>@${data.username}</a></section>
    <div class="more-btns-aloo" onclick="userSettings('${data.id}')"></div>
    </div>`
        return html
    } catch (e) {
        return ''
    }
}

let offset = 0;
let loadZor = false
const shitLive = document.querySelector('.inset-shit-live')
document.querySelector('.users-live-container')?.addEventListener('click', function () {
    const heigh = shitLive.offsetHeight;
    if (loadZor) {
        return
    }
    if (this.scrollTop > (heigh - 500)) {
        loadZor = true
        let html = '';
        for (let [user, key] of party.usersData) {
            html += printLiveUser(user.info, key)
            offset++
            if (offset >= 20) {
                break
            }
        }
        loadZor = false
        document.querySelector('.inset-shit-live').insertAdjacentHTML('beforeend', html)
    }
})

async function closeLiveSettings() {
    const parent = document.querySelector('.live-perview')
    parent.classList.add('hidden', 'page')
    parent.classList.remove('center', 'settings-live')
    document.querySelector('.background-live-ass').classList.add('hidden')
    document.querySelector('.inset-shit-live').innerHTML = ''
}

async function openLiveSettings() {
    document.querySelector('.background-live-ass').classList.remove('hidden')
    const parent = document.querySelector('.live-perview')
    parent.className = 'live-perview settings-live hidden';
    await delay(10)
    parent.classList.remove('hidden')
    await delay(10)
    parent.classList.add('center')
    let html = ''
    let offset = 0;
    for (let [key, user] of party.usersData) {
        html += printLiveUser(user.info, key)
        offset++;
    }
    document.querySelector('.inset-shit-live').innerHTML = html
}
document.querySelector('.settings-button')?.addEventListener('click', function () {
    openLiveSettings()
})

document.querySelector('.play-pause').addEventListener('click', async function () {
    handlePlayPause()
})

async function isValid(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.status === 200) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
}
let debounceTimeout;

function moveSlider(event) {
    const rect = sliderEl.getBoundingClientRect();
    let offsetX = event.clientX - rect.left;
    if (offsetX < 0) {
        offsetX = 0;
    } else if (offsetX > rect.width) {
        offsetX = rect.width;
    }
    const percentage = offsetX / rect.width;
    const currentTimeInSeconds = (percentage * (audioPlayer.duration || globalDuration));

    if (playCallback) {
        currentMove.style.width = `${percentage * 100}%`;
        seek(currentTimeInSeconds);

    }
}

let lastUpdate = 0;
let lastSecUpdate = 0;
let isCheet = false;


function refreshSrc(e) {
    if (audioPlayer.getAttribute('refreshed')) {
        return;
    }
    getTrackByUrl(audioPlayer.getAttribute('url'), 'soundcloud', 'native').then(data => {
        audioPlayer.setAttribute('refreshed', 'true')
        if (audioPlayer.getAttribute('protocol') == 'hls' && !isIOS()) {
            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(data.audio);
                hls.attachMedia(audioPlayer);
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    play();
                    seek(e)
                });
            } else if (audioPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                audioPlayer.src = data.audio;
                play();
                seek(e)
            } else {
                console.error('HLS not supported in this browser.');
            }
        } else {
            audioPlayer.src = data.audio;
            play();
            seek(e)
        }
    });
}


function trackEnded() {
    if (document.querySelector('.download-player').classList.contains('repeat')) {
        playNext(true);
        return
    }
    playNext();
}

let lyricsInitialize = false
let globalDuration = 0;
let globalTime = 0

let formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(secs).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
};

function updateMediaSession(time, duration) {
    try {
        window.webkit.messageHandlers.updateMedia.postMessage({ action: 'mixed', time, duration })
    } catch (e) { }
}

const currentTimeText = document.querySelector('.count-current')
const durationText = document.querySelector('.count-allvals')

function seekForce(time, duration = globalDuration) {
    globalTime = time
    if (jsonLyrics?.lyrics) {
        seekLyrics(time)
    }
    if (time == duration && time) {
        trackEnded();
    }

    if (lastUpdate < (Date.now() - 1000) && !isCheet) {
        lastUpdate = Date.now();
        const progress = parseFloat((time / duration) * 100);
        if (isNaN(progress)) {
            return;
        }
        sliderEl.value = progress * 100;
        currentMove.style.width = `${progress}%`;
        currentTimeText.innerText = formatTime(time)
        if (duration > 0) {
            durationText.innerText = formatTime(duration)
        }
        if (isParty) {
            if (isOwner()) {
                if (lastSecUpdate < (Date.now() - 1000)) {
                    lastSecUpdate = Date.now();
                    sendSocket({ 'ct': 'control', action: 'signal', do: 'timing', time: time });
                }
            }
        }
    }
}

audioPlayer.ontimeupdate = function (event) {
    seekForce(event.target.currentTime, event.target.duration);
}
const shuffleSelector = document.querySelector('.shuffle-player')

let playedIndices = [];

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getRandomTrack(queue) {
    if (playedIndices.length === 0) {
        queueTracks = relatedGlobal?.data || relatedGlobal?.artist || queueTracks
        playedIndices = shuffleArray([...Array(queue.length).keys()]);
    }
    const randomIndex = playedIndices.pop();
    return queue[randomIndex];
}

const isShuffle = () => {
    if (shuffleSelector.classList.contains('shuffled') || !isPlus()) {
        return true
    }
    return false
}

function getNext(id, e) {
    let song;
    let currentIndex = queueTracks.findIndex(item => item.id === id);

    if (isShuffle()) {
        song = getRandomTrack(queueTracks);
    } else if (e) {
        song = getPrevValue(queueTracks, currentIndex)
    } else {
        song = getNextValue(queueTracks, currentIndex)
    }
    if (!song) {
        song = queueTracks?.[0]
        console.log('no songs in queue')
        if (!song) {
            queueTracks = relatedGlobal.data || relatedGlobal.artist || [];
            return {}
        }
    }
    return song
}

let nextQueue = {}

function playNext(e) {
    if (isParty) {
        if (!isOwner()) {
            return
        }
    }
    sliderEl.value = 0;
    currentMove.style.width = 0
    if (e && globalTime > 10) {
        seek(0)
        play()
        if (currentSong.source) {
            playSource(currentSong.source)
        }
        return;
    }

    if (e && isShuffle()) {
        dialog('Shuffle mode enabled', 'You are in shuffle mode, to go to previous track please turn it off')
    }

    document.querySelector('.play-pause').classList.remove('played')
    if (((globalNext.id && !e && globalNext.id !== currentSong.id) || isShuffle() && globalNext.id) && currentSong.api !== 'soundcloud') {
        playTrack(globalNext)
        // globalNext = {}
    } else {
        playTrack(getNext(currentSong.id, e))
    }

}

async function checkTrackInfo(id = currentSong.id || audioPlayer.getAttribute('trackid'), e) {
    return fetch(`https://api.onvo.me/music/track-info?id=${id}`, {
        headers: {
            'Authorization': `Bearer ${await getToken()}`
        }
    }).then(response => {
        return response.json();
    }).then(data => {
        return data
    }).catch(error => {
        console.error()
    })
}

audioPlayer.addEventListener('waiting', function () {

});


audioPlayer.addEventListener('ended', function () {
    trackEnded()
});

let cheetInterval;

function touchMoveSlider(event) {
    const percentage = event.target.value / event.target.max;
    const currentTimeInSeconds = (percentage * (audioPlayer.duration || globalDuration));
    currentMove.style.width = `${percentage * 100}%`;
    isCheet = true;
    seek(currentTimeInSeconds);
    clearTimeout(cheetInterval);
    cheetInterval = setTimeout(() => {
        isCheet = false;
    }, 200);

}


if (!isMobile) {
    sliderEl.addEventListener('mousemove', (event) => {
        moveSlider(event);
    });
    sliderEl.addEventListener("mousedown", (event) => {
        if (event.button === 0) {
            playCallback = true;
            moveSlider(event);
        }
    });
    sliderEl.addEventListener("mouseup", (event) => {
        playCallback = false;
        // loader.resume();
    });
    sliderEl.addEventListener('mouseleave', () => {
        tooltip.style.opacity = 0;
    });
} else {
    sliderEl.addEventListener('input', (event) => {
        touchMoveSlider(event);
    });
}

function debounce(func, delay) {
    let timerId;
    return function (...args) {
        clearTimeout(timerId);
        timerId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

async function getToken() {
    return localStorage.getItem('token')
}

function getTrackByUrl(url, api, method) {
    return new Promise(async (resolve, reject) => {
        const endpoint = `/soundcloud/track?id=${encodeURIComponent(url)}${method ? `&method=${method}` : ''}`;
        fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${await getToken()}`
            }
        }).then(response => {
            return response.json();
        }).then(data => {
            resolve(data)
        }).catch(error => {
            reject(error)
        })
    });
}


// getTrackByUrl('https://soundcloud.com/omar-o-elsharkawey/2024a1', 'soundcloud').then(data => {
//     if (data.url) {
//         audioPlayer.setAttribute('track-url','https://soundcloud.com/omar-o-elsharkawey/2024a1')
//         audioPlayer.src = data.url
//     } else {
//         console.log('Failed to get stream URL.');
//     }
// });


document.querySelectorAll('.section-wave').forEach(element => {
    element.addEventListener('click', async function () {
        if (this.classList.contains('selected')) {
            return;
        }
        document.querySelectorAll('.section-wave').forEach(el => {
            el.classList.remove('selected')
        });
        this.classList.add('selected');
        if (this.classList.contains('player-wave')) {
            parseQueue();
        } else if (this.classList.contains('settings-wave')) {
            showLyrics()
        } else {
            closeQueue();
        }
    })
})

function extractUrlImage(backgroundImage) {
    return backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
}


function setMediaSessionMetadata() {
    const { title, artist, poster, posterLarge } = currentSong

    const artwork = pI((posterLarge || poster), true)

    if (window.webkit?.messageHandlers) {
        window.webkit.messageHandlers.mediaPlayer.postMessage({ title, artist, artwork })
        return
    }
    if (typeof Android !== 'undefined') {
        Android.setPlayerMetadata(title, artist, artwork);
        return
    }
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            artwork: [
                { src: artwork, type: 'image/jpeg' }
            ]
        });

        navigator.mediaSession.setActionHandler('play', () => { play(); });
        navigator.mediaSession.setActionHandler('pause', () => { pause(); });
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            seek(Math.max(audioPlayer.currentTime - (details.seekOffset || 10), 0));
        });
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
            seek(Math.min(audioPlayer.currentTime + (details.seekOffset || 10), (audioPlayer.duration || globalDuration)));
        });
    }
}
function ismob() {
    const userAgent = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
}

function isSafari() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    return isSafari;
}


function isIOS() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isIPad = /ipad/.test(userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 1 && /macintosh/.test(userAgent));
    return isIOSDevice || isIPad;
}

let playTrackTime;
let playTrackTimeout;
let currentColors;

function getSongObject(parent, e) {
    const id = parent.getAttribute('trackid')
    const posterElement = e ? parent.querySelector('.poster-chat') : parent.querySelector('.song-poster')
    const api = parent.getAttribute('api')
    const url = parent.querySelector('.audio-control')?.getAttribute('data-audio')
    const poster = posterElement.getAttribute('data-poster')
    const posterLarge = posterElement.getAttribute('data-poster-large')
    const posterLargeSize = posterElement.getAttribute('data-size-large')
    const title = e ? parent.querySelector('.song-info-chat text').innerText : parent.querySelector('.artist-title span').innerText;
    const artist = e ? parent.querySelector('.song-info-chat a').innerText : parent.querySelector('.artist-title a').innerText;
    const album = decodeURIComponent(parent.getAttribute('album'))
    const duration = parent.getAttribute('duration')
    const albumID = parent.getAttribute('album-id')
    const artistID = parent.getAttribute('artist-id')
    const kind = parent.getAttribute('kind')
    return { api, url, poster, posterLarge, title, artist, posterLargeSize, id, album, duration, albumID, kind, artistID }
}

let currentSong = {}

function playForce(trackid = currentSong.id, el = document.querySelector('.play-pause')) {
    try {
        window.webkit.messageHandlers.updateMedia.postMessage({ action: 'play' })
    } catch (e) { }
    try {
        el.classList.add('played');
        // loader.resume();
        document.querySelectorAll('.song[trackid="' + trackid + '"]').forEach(sngel => {
            sngel.querySelector('.audio-control')?.classList.add('played');
            sngel.classList.remove('paused')
            sngel.classList.add('running')
        })
    } catch (e) {
        console.error(e)
    }
}

function pauseForce(trackid = currentSong.id, el = document.querySelector('.play-pause')) {
    try {
        window.webkit.messageHandlers.updateMedia.postMessage({ action: 'pause' })
    } catch (e) { }
    try {
        el.classList.remove('played');
        // loader.pause();
        document.querySelectorAll('.song[trackid="' + trackid + '"]').forEach(sngel => {
            sngel.querySelector('.audio-control')?.classList.remove('played');
            sngel.classList.add('paused')
        })
    } catch (e) {
        console.error(e)
    }
}

async function handlePlayPause(trackid = currentSong.id, e, el = document.querySelector('.play-pause')) {
    if (el.classList.contains('played') && !e) {
        pause()
        pauseForce(trackid, el)
    } else {
        play();
        playForce(trackid, el)
        if (audioPlayer.getAttribute('api') == 'soundcloud' && audioPlayer.getAttribute('protocol') !== 'hls' && !e) {
            const isValidUrl = await isValid(audioPlayer.src);
            if (!isValidUrl) {
                refreshSrc(audioPlayer.currentTime);
            }
        }
    }
}

function isValidUrl(url) {
    try {
        new URL(url); // Try to create a new URL object
        return true;  // If successful, it's a valid URL
    } catch (e) {
        return false; // If an error is thrown, it's not a valid URL
    }
}

audioPlayer.addEventListener('play', function () {
    document.querySelector('.play-pause').classList.add('played')
})

audioPlayer.addEventListener('pause', function () {
    document.querySelector('.play-pause').classList.remove('played')
})

async function addPlayerMetadata(rawSongObj) {
    let { id, api, url, poster, posterLarge, title, artist, protocol } = rawSongObj;


    if (id) {
        audioPlayer.setAttribute('trackid', id);
    }

    if (api) {
        audioPlayer.setAttribute('api', api);
        liveBody.setAttribute('api', api);
    }

    if (url) {
        audioPlayer.setAttribute('url', url);
    }

    if (protocol) {
        audioPlayer.setAttribute('protocol', protocol);
    }

    if (posterLarge || poster) {
        const isExist = await checkObjectExists(currentSong.id, 'downloads')
        if (isExist) {
            poster = proxy(poster, true, true)
            posterLarge = proxy(posterLarge, true, true)
        } else {
            poster = pI(poster)
            posterLarge = pI(posterLarge)
        }
        setTimeout(() => {
            document.querySelector('.artist-inner-song img').src = (filterPosterLarge(posterLarge, poster).image);
        }, 50)
    }

    if (title) {
        document.querySelector('.artist-inner-song section p').innerText = title;
    }

    if (artist) {
        document.querySelector('.artist-inner-song section a').innerText = artist;
    }

    if (poster) {
        document.querySelectorAll('.player .wave-back-component').forEach(back => {
            back.style.backgroundImage = `url('${(poster)}')`;
        });
        document.querySelector('.background-wave').innerHTML = `<span style="background-image: url('${(poster)}')"></span>`
    }

    if (poster) {
        processColors(poster, 5).then(data => {
            currentColors = data;
            const shades = generateShades(colorEqualizer('#fbfd82', data?.colors?.muted), 5)
            const ds = shades[3];
            const main = colorEqualizer('#121416', data?.colors?.muted)
            document.querySelector('.styling').innerHTML = `<style>
            .visualisation .box.checked {background:  ${darkenColor(shades[3], 0.5)}!important;}
            .body.minimized { background: ${darkenColor(shades[3], 0.5)}!important;}
            .player .background-wave::before{
                background: linear-gradient(to bottom, ${darkenColor(colorEqualizer('#7f7e79', data?.colors?.muted), 0.5)} 25%, ${main} 50%);
            }
            
            .blured.player .background-wave:before {
                background: linear-gradient(to bottom, ${hexToHSLA(main, 0.57)}, ${main})
            }
            .show-lyrics-section{ 
                background: linear-gradient(to top, ${data?.colors?.muted} 50%, transparent);
            }
            .lyrics-wrapper {
                background: ${data?.colors?.muted}
            }
            .song.running .bar {background: ${ds}}.song.running .artist-title span{color: ${ds}}
            .pottom-width-slider span{background: #fff}
            .background-playing-music:before{background: ${hexToRGBA(data.colors.shades[4], 0.25)}}
            /*.player .lyrics-container {background: ${data.colors.shades[4]}!important}*/
            .send-message-clap,.sending-zobr,
            .kosom-eld7k .msg .msg-core{background: ${data.colors.muted}}
            </style>`;
        }).catch(error => {
            console.error(error);
            document.querySelector('.styling').innerHTML = ``;
        });
    }

    localStorage.setItem('recent_track', JSON.stringify(rawSongObj))
}


const getPrevValue = (arr, currentIndex) => {
    // Check if the current index is greater than 0 to get the previous item
    if (currentIndex > 0 && currentIndex < arr.length) {
        const prevItem = arr[currentIndex - 1];
        return prevItem;
    } else {
        return null;
    }
};
const getNextValue = (arr, currentIndex) => {
    if (currentIndex !== -1 && currentIndex < arr.length - 1) {
        const nextItem = arr[currentIndex + 1];
        return nextItem
    } else {
        return null;
    }
};


function printCopyrights(data) {
    document.querySelector('.artist-info-poster').style.backgroundImage = `url(${data.artist_data?.image})`
    document.querySelector('.artist-info-player section a').innerText = `${formatNumber(data.artist_data?.followers)} followers`
    document.querySelector('.artist-info-player section').className = data.artist_data?.verified ? 'verified' : ''
    document.querySelector('.track-copyright-container').innerHTML = currentSong.api == 'soundcloud' ? `
    <a>${data.copyright}</a>
    <p>This track is hosted from soundcloud Inc using authorized api, to view it on soundcloud <text onclick="interface('open','')">Tap here</text></p>
    ` : `
    <p>This track is copyrighted to the original artist. The track source is fetched from YouTube using search information from ${currentSong.api}, For more details, see our <text onclick="policy()">Policy</text></p>
    `
    document.querySelector('.artist-info-player section span').innerText = data.artist_data?.name

}

async function checkTrackData() {
    if (isOffline) {
        return
    }
    try {
        if (!currentSong.posterLarge || currentSong.posterLarge == 'undefined' || !currentSong.album || currentSong.album == 'undefined' || !currentSong.poster || currentSong.posterLarge == 'undefined') {
            let trackData
            switch (currentSong.api) {
                case 'spotify':
                    [trackData] = await get_tracks(currentSong.id)
                    if (trackData.id && trackData.poster && trackData.posterLarge && trackData.title && trackData.artist && trackData.album) {
                        currentSong = trackData
                    }
                    break;
                case 'soundcloud':
                    trackData = await getTrackByUrl(currentSong.id, 'soundcloud', id);
                    if (trackData.id && trackData.poster && trackData.posterLarge && trackData.title && trackData.artist && trackData.album) {
                        currentSong = trackData
                    }
                    break;
            }
            if (trackData) {
                addPlayerMetadata(trackData)
            }
        }
    } catch (e) { }
    return
}

function filterArtistName(artistName) {
    if (!artistName) return null;
    artistName = artistName.replace(/^by\s+/i, '').trim();
    const firstArtist = artistName.split(',')[0].trim();
    return firstArtist;
}

async function requestSource(song, url, protocol, TIMEOUT = 1) {
    let { api, id, title, artist, yt } = song
    clearTimeout(playTrackTimeout)
    playTrackTime = new Promise(resolve => {
        playTrackTimeout = setTimeout(resolve, TIMEOUT);
    });
    await playTrackTime;
    return new Promise(async (resolve) => {
        if (api == 'soundcloud') {
            let soundid = url;
            let soundMethod = 'native';
            if (!isValidUrl(url)) {
                soundMethod = 'id'
                soundid = id
            }
            const data = await getTrackByUrl(soundid, 'soundcloud', soundMethod);
            resolve({ url: data.audio })
        } else {
            if (!yt) {
                yt = api == 'youtube' ? id : (await getYTcode(title, artist))
                currentSong.yt = yt
            }
            let source = await getSource(yt, true)
            resolve(source)
        }
    });
}

function closeSocket() {
    party.socket.close(4009);
}

function goExit() {
    dialog('Are you sure?', `You are about ${isOwner() ? 'End the party' : 'Exit the party'}`, [
        '<button class="main" onclick="closeError()" type="button"><span>Stay in live</span></button>',
        '<button onclick="closeError();exitLive()" type="button"><span>Exit party</span></button>'
    ])
}

function exitLive(channel) {
    const parent = document.querySelector(`.live-card[dataid="${liveBody.getAttribute('dataid')}"]`)
    parent?.classList.remove('joined')
    liveBody.classList.remove('minimized')
    isParty = false;
    sendSocket({ ct: 'exit', channel });
    liveBody.className = 'body page minimized player hidden owner'
    if (currentSong.id) {
        minimizePlayer()

    }
    closeLiveSettings();
    pause();
    party = {}
    document.querySelector('.inset-chat-container').innerHTML = ''
    document.querySelector('.inset-vertical').innerHTML = ''
    mute(false)
}

let queueTracks = []
let queueOffset = 0;
let queueList = {}

async function getAlbumData(id, e) {
    const response = await fetch(`https://api.onvo.me/music/apple/album?id=${id}`, {
        headers: {
            Authorization: `Bearer ${await getToken()}`
        }
    })
    const data = await response.json()
    return (e ? data.tracks[0] : data)
}

async function getAppleTrack(id, e) {
    const response = await fetch(`https://api.onvo.me/music/apple/track?ids=${id}`, {
        headers: {
            Authorization: `Bearer ${await getToken()}`
        }
    })
    const data = await response.json()
    return (e ? data[0] : data)
}

async function getTracksData(api, id, isAlbum) {
    let data = {}
    switch (api) {
        case 'apple':
            if (isAlbum) {
                data = await getAlbumData(id, true)
            } else {
                data = await getAppleTrack(id, true)
            }
            break;
        case 'soundcloud':
            data = await getTrackByUrl(id, 'soundcloud', 'id')
            break;
        case 'spotify':
            data = (await get_tracks(id))[0]
            break;
        case 'anghami':
            data = await callAnghami(`/${id}`, 'track')
            break;
    }
    return data;
}

function decodeEntities(songName) {
    return songName.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
}
function isSafari() {
    const ua = navigator.userAgent;
    return /^((?!chrome|android).)*safari/i.test(ua);
}

async function handleSource() {
    let source = {}
    let path = currentSong.path

    const isExist = await checkObjectExists(currentSong.id, 'downloads')

    if (!window.webkit?.messageHandlers && typeof Android == 'undefined' && currentSong.source) {
        source = currentSong.source
        if (isSafari() && currentSong.source.aac) {
            source.url = source.aac
        }
    } else if (!safeMode) {
        if (globalNext.id == currentSong.id && globalNext.source) {
            currentSong.yt = globalNext.yt
            currentSong.source = globalNext.source
            source = globalNext.source
            globalNext = {}
        } else if (!path && !isExist) {
            if (currentSong.api !== 'soundcloud' && isWeb()) {
                showDownload(currentSong)
                return
            }
            source = await requestSource(currentSong, url, protocol);
        } else {
            try {
                if (!path) {
                    path = (await getObject(currentSong.id, 'downloads')).path;
                }
                source = { url: `http://localhost:2220/retrieve?raw=${encodeURIComponent(path)}` }
                console.log(source)
            } catch (e) {
                console.error(e)
            }
        }
    } else {
        if (api == 'youtube') {
            dialog('No perview found', `Looks like you should open it in ${api} to listen, we are sorry`)
            return interface('open', `https://youtube.com/watch?v=${currentSong.id}`)
        }
        if (!currentSong.perview) {
            const { perview } = await getTracksData(currentSong.api, currentSong.id)
            currentSong.perview = perview
        }
        if (!currentSong.perview) {
            return dialog('No perview found', `Looks like you should open it in ${api} to listen, we are sorry`)
        }
        source = { url: currentSong.perview }
    }

    return { source, path, done: true }
}

let sendingSong = {}
const bottomMenu = document.querySelector('.menu-bottom')

async function playTrack(el, e) {
    let api, id, rawSongObj
    if (el?.poster) {
        rawSongObj = el;
        ({ api, url, protocol, id, kind } = el);
    } else {
        const parent = el.classList.contains('song') ? el : el.closest('.song')
        id = parent.getAttribute('trackid')
        rawSongObj = getSongObject(parent, e)
        rawSongObj.protocol = el.getAttribute('protocol');
        rawSongObj.path = parent.getAttribute('path');
        ({ api, url, protocol, kind } = rawSongObj);
        if (parent.closest('.playlists-page')) {
            if (currentList.id !== queueList.id) {
                queueTracks = currentList.tracks
                queueOffset = currentList.tracks?.length
                queueList = currentList
            }
        } else {
            if (isParty && !isOwner() && parent.classList.contains('song-chat')) {
                return
            }
        }
    }

    if (isParty && !e) {
        sendingSong = rawSongObj;
        if (!isOwner()) {
            dialog('You are in party', 'You can\'t play other song while being in party, do you want send it?', [
                '<button class="main" onclick="closeError();actualSendTrack(sendingSong);miniDialog(\'Track sent\')" type="button"><span>Send track to live</span></button>',
                '<button onclick="closeError();exitLive()" type="button"><span>Exit party</span></button>'
            ])
            return;
        }
    }

    sendingSong = {}

    playerLoading()


    if (currentPage !== 'player') {
        history.pushState({ page: 'player' }, null)
        currentPage = 'player'
    }

    currentSong = { ...rawSongObj }

    let handler

    resetPlayer(currentSong.id);
    addPlayerMetadata(currentSong)
    playForce()

    if (!isParty) {
        showPlayer();
    }

    if (currentSong.kind == 'album' && currentSong.api == 'apple') {
        currentSong = await getAlbumData(id, true);
        let albumIndex = queueTracks.findIndex(item => item.id === id);
        if (!queueTracks.includes(currentSong)) {
            queueTracks[albumIndex] = currentSong
        }
        addPlayerMetadata(currentSong)
    }

    onGoingId = currentSong.id
    handler = await handleSource(currentSong)

    if (onGoingId !== currentSong.id && !handler.path) {
        return
    }

    lyricsInitialize = false

    playSource(handler.source);

    setTimeout(() => {
        play();
    }, 50)

    try {
        setMediaSessionMetadata();
    } catch (e) {
        console.error(e);
    }

    playerLoaded();

    try {
        addTrack(el, id, currentSong)
    } catch (e) {

    }


    if (!isParty || (isParty && isOwner())) {
        getRelated(true)
    }

    await checkTrackData()

    updatePlaying(currentSong);

    getLyrics()

    if (queueTracks.length > 0 && !isParty || isOwner()) {
        prepareNext()
    }

    if (isOffline || isParty) {
        return
    }

    if (isInline() && !isParty && api !== 'soundcloud' && !liveBody.classList.contains('minimized')) {
        initializeYoutube(currentSong.yt)
    }

    if (!isParty) {
        // printCopyrights(currentSong);
    }

}



// play()

function loadWebkit() {
    try {
        window.webkit.messageHandlers.loadyt.postMessage({ url: 'https://savefrom.net' })
        //        window.webkit.messageHandlers.loadyt.postMessage({ url: 'https://youtube.com/error' })
    } catch (e) {
        log(e)
    }
}

//loadWebkit();

let globalPause = true;
let ineted = false;

let youtubeInterval;
let YTplayer;


function destroyYoutube() {
    clearInterval(intervalYT)
    // if (!isInline()) {
    //     YTplayer.mute();
    // } else {
    YTplayer.destroy();
    YTplayer = null;
    // }
}

if (window.trustedTypes) {
    const policy = window.trustedTypes.createPolicy('default', {
        createHTML: (input) => input,
    });
}

let isMetadataDone = false

function getAccurateTime() {
    if (YTplayer) {
        return event.target.getCurrentTime();
    } else {
        audioPlayer.currentTime
    }
}

function reloadTiming(event) {
    // youtubeInterval = setInterval(() => {
    //     if (!globalPause) {
    //         const currentTime = event.target.getCurrentTime();
    //         const duration = event.target.getDuration();
    //         seekForce(currentTime.toFixed(2));
    //         globalDuration = duration.toFixed(2);
    //     }
    // }, 250);
}

//setTimeout(() => {
//    window.webkit.messageHandlers.render.postMessage('test')
//}, 3000)


function onPlayerReady(event) {
    YTplayer.playVideo();
    YTplayer.seekTo(globalTime, true);
    activeSource = currentSong.yt
    reloadTiming(event)
}

let isLoading = false

function playerLoading() {
    if (isLoading) {
        return
    }
    isLoading = true
    document.querySelector('.big-the-tits').innerHTML = `
    <div class="loader-5 loader-element"><span></span></div>
    `
    //     <div class="apple-music-loader">
    //     <div class="bar-load"></div>
    //     <div class="bar-load"></div>
    //     <div class="bar-load"></div>
    //     <div class="bar-load"></div>
    // </div>
    liveBody.classList.add('loading')
}

function playerLoaded() {
    isLoading = false
    document.querySelector('.big-the-tits').innerHTML = ''
    liveBody.classList.remove('loading')

}
let safeMode = false

function initializeYoutube(id, e) {
    if (ytInitialized || isParty || !isInline() || isOffline) {
        return
    }
    try {
        ytInitialized = true
        activeSource = { id };
        if (YTplayer) {
            YTplayer.loadVideoById(id)
            return
        }

        activeSource = null;
        YTplayer = new YT.Player('video-frame', {
            videoId: id,
            playerVars: {
                'autoplay': 1,         // Enable autoplay
                'controls': 0,
                'mute': e ? 0 : 1,              // Ensure it starts muted
                'muted': e ? 0 : 1              // Ensure it starts muted
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    } catch (e) {
        console.log(e)
    }
}

let intervalYT
let isNative = true;

function updateYoutube() {
    if (!isInline() || isParty) {
        return
    }
    if (lastUpdatePlaying < (Date.now() - 1000) && !isCheet) {
        globalDuration = YTplayer.getDuration()
        lastUpdatePlaying = Date.now();
        if (!isNative) {
            seekForce(YTplayer.getCurrentTime(), globalDuration)
        }
        if (globalPause) {
            playForce();
            globalPause = false;
        }
        if (Math.abs(YTplayer.getCurrentTime() - globalTime) > 0.5 && isInline()) {
            YTplayer.seekTo(globalTime, true);
        }
    }
}

let lastUpdatePlaying = 0;

function onPlayerStateChange(event) {
    switch (event.data) {
        case YT.PlayerState.PLAYING:
            playForce();
            clearInterval(intervalYT)
            intervalYT = setInterval(updateYoutube, 500)
            globalPause = false
            break;
        case YT.PlayerState.PAUSED:
            clearInterval(intervalYT)
            globalPause = true;
            pauseForce();
            break;
        case YT.PlayerState.ENDED:
            globalPause = true;
            playNext();
            break;
        case YT.PlayerState.BUFFERING:
            // playerLoading();
            break;
        case YT.PlayerState.CUED:
            console.log("Video is cued");
            break;
        default:
            // Handle other cases if necessary
            break;
    }
}


// Handle playback quality change
function onPlaybackQualityChange(event) {
    console.log("Playback quality changed to: " + event.data);
}

function changeQuality(quality) {
    YTplayer.setPlaybackQuality(quality);
}

let downloadedFire = () => {

}

const downloadData = () => {
    return new Promise((resolve, reject) => {
        downloadedFire = (data) => {
            console.log('fired Socket')
            resolve(data)
        }
    })
}
function loaded() {

}
let activeSource = null

function addSource(data) {
    let s = ''
    let a = ''
    for (let video of data) {
        if (video.quality == '360' && video.type == 'mp4' && s == '') {
            s = video.url
        }

    }
    const audioFiles = data.filter(item => item.type.includes("audio"));
    // Find the best quality audio
    const bestAudio = audioFiles.reduce((best, current) => {
        return parseInt(current.quality) > parseInt(best.quality) ? current : best;
    }, audioFiles[0]);
    downloadedFire({ video: s, url: bestAudio.url })
    // window.webkit.messageHandlers.loadPlayer.postMessage(s)
}

function isInline() {
    if (document.querySelector('.video-check')?.classList.contains('checked')) {
        return true
    }
    return false;
}
let onGoingId;
let lastSource = {}
function getSource(id, retries = 3) {
    return new Promise((resolve, reject) => {
        const fetchData = async (attempts) => {
            let data = {};
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            try {
                const response = await fetch(`/get-source?id=${id}`, { signal: controller.signal });
                data = await response.json();

                if (data.url) {
                    resolve(data);
                } else if (attempts > 0) {
                    fetchData(attempts - 1);
                } else {
                    miniDialog('Failed to load track');
                    reject(new Error("Data not found"));
                }
            } catch (e) {
                if (attempts > 0) {
                    fetchData(attempts - 1);
                } else {
                    miniDialog('Failed to load track');
                    reject(e);
                }
            } finally {
                clearTimeout(timeoutId);
            }
        };

        fetchData(retries);
    });
}


function playSource(source) {
    currentSong.source = source
    if (!window.webkit?.messageHandlers) {
        if (typeof Android !== 'undefined') {
            return Android.startPlayer(source.url)
        }

        audioPlayer.src = source.url
        audioPlayer.load();
        audioPlayer.play();
        if (currentSong.api == 'soundcloud') {
            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(source.url);
                hls.attachMedia(audioPlayer);
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    if (!globalPause) { play(); globalPause = true; }
                });
            } else if (audioPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                audioPlayer.src = source.url;
                if (!globalPause) { play(); globalPause = true; }
            } else {
                console.error('HLS not supported in this browser.');
            }
            // return
        }
    } else {
        window.webkit.messageHandlers.loadPlayer.postMessage({ type: 'vlc', url: source.url, id: currentSong.id, withSync: false });
    }
}
async function loadNative(id, e, d) {
    // let data = {}
    // if (window.webkit && d) {
    //     const code = `
    //              (async () => {
    //                  document.querySelector('#sf_url').value = 'https://www.youtube.com/watch?v=${id}'
    //                  await new Promise((resolve) => { setTimeout(resolve, 10) })
    //                  document.querySelector('#sf_submit').click()
    //                  check()
    //              })()
    //         `;
    //     window.webkit.messageHandlers.runyt.postMessage(code)
    //     data = await downloadData();
    //     const streamValid = await check(data.url)
    //     if (!streamValid) {
    //         coreSocket.send(JSON.stringify({ ct: 'yt', id: session.id, YTcode: id }))
    //         data = await downloadData();
    //     }
    // } else {
    //     const session = decodeJwt(localStorage.getItem('token'))
    //     coreSocket.send(JSON.stringify({ ct: 'yt', id: session.id, YTcode: id }))
    //     data = await downloadData();
    // }

}

async function prepareNext(next) {
    if (isOffline || true) {
        return
    }
    if (currentSong.api == 'song' || currentSong.api == 'soundcloud') {
        return
    }
    if (!next) {
        globalNext = getNext(currentSong.id);
    } else {
        globalNext = next
    }
    if (globalNext.kind == 'album') {
        const oldId = globalNext.id
        globalNext = await getAlbumData(globalNext.id, true);
        let albumIndex = queueTracks.findIndex(item => item.id === oldId);
        if (!queueTracks.includes(globalNext)) {
            queueTracks[albumIndex] = globalNext
        }
    }
    const id = await getYTcode(globalNext.title, globalNext.artist);
    globalNext.yt = id
    let data = await getSource(id);
    globalNext.source = data
}

let globalNext = {}
let getStabledTime;

async function getYTcode(title, artist, id) {
    const q = `${title} ${artist}`
    if (!id) {
        const url = `${origin}/get-id?q=${encodeURIComponent(q)}`
        const response = await fetch(url)
        const data = await response.json();
        id = data.id
    }
    return id
}

let currentPlaying;

async function updatePlaying(song) {
    if (isOffline) {
        return
    }
    let id = song.id
    if (currentPlaying == song.id) {
        return
    }
    if (!song) {
        console.log('no song')
        return;
    }
    if (isParty) {
        try {
            if (isOwner()) {
                sendSocket({ ct: 'control', action: 'set_playing', track: song })
            }
        } catch (e) {
            console.error(e)
        }
    } else {
        try {
            delete song['source']
        } catch (e) { }
        fetch('https://api.onvo.me/music/recently-played', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getToken()}`
            },
            body: JSON.stringify({ song, id: id })
        }).then(response => {
            return response.json()
        }).then(data => {
            console.log(data, 'playingz')
            if (data.isSaved) {
                document.querySelector('.control-eue.about-song').classList.add('saved')
                try {
                    window.webkit.messageHandlers.updateMedia.postMessage({ action: 'favs', ad: true })
                } catch (e) { }
            } else {
                try {
                    window.webkit.messageHandlers.updateMedia.postMessage({ action: 'favs', ad: false })
                } catch (e) { }
            }
        }).catch(e => {
            console.error(e)
        })
    }

}

function extractPlaylistId(url) {
    try {
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        if (params.has('list')) {
            return params.get('list');
        }
        const match = urlObj.pathname.match(/\/playlist\?list=([\w-]+)/);
        if (match) {
            return match[1];
        }
    } catch (e) {

    }

    return null;
}

async function minimizePlayer(page = document.querySelector('.body')) {
    // try {
    //     loader.pause();
    // } catch (e) {
    //     console.error(e)
    // }
    lyricsPaused = true

    document.body.classList.remove('hideoverflow')
    page.scrollTop = 0;
    page.removeAttribute('style')
    page.classList.add('minimized');
    page.classList.remove('blured', 'fullscreen', 'resizing')
    isFullscreen = false
    if (page.classList.contains('live')) {
        page.classList.add('player')
    }
    page.classList.add('center-flex');
    const related = document.querySelector('.lyrics-bottom-related')
    if (related) {
        related.innerHTML = ''
    }

}

let scrollCurrent = 0;
async function showThePlayer() {
    // try {
    //     loader.resume();
    // } catch (e) {
    //     console.error(e)
    // }
    lyricsPaused = false
    if (liveBody.classList.contains('live')) {
        liveBody.classList.remove('player')
    } else { }
    liveBody.classList.remove('minimized')
    liveBody.classList.add('center-flex')
    try {
        draggablePlayer.openMenu()
    } catch (e) { }
    document.body.classList.add('hideoverflow')
    await delay(300)
    if (liveBody.classList.contains('live')) {
        history.pushState({ page: 'player' }, null, `/radio/${liveBody.getAttribute('dataid')}`)
    }
    // parseLyrics();
    if (isOffline) {
        return
    }
    initializeYoutube(currentSong.yt)
}

let draggablePlayer
async function removePlayer() {
    const parent = document.querySelector('.body')
    pause();
    // resetPlayer()
    bottomMenu.classList.remove('no-redius')
    parent.classList.add('hidden')
}
async function showPlayer(live) {
    const parent = liveBody

    if (live) {
        parent.classList.add(live, 'live')
    }
    parent.classList.remove('hidden')
    bottomMenu.classList.add('no-redius')
    if (parent.classList.contains('center-flex')) {
        parent.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        return;
    }
    parent.classList.add('minimized')
    await delay(50)
    parent.classList.add('center-flex')
    if (!draggablePlayer) {
        draggablePlayer = new DraggableMenu({
            parent: '.body',
            inner: '.body',
            isHeight: true,
            minHeight: 55,
            minTransform: 90,
            onclose: minimizePlayer,
            onopen: async () => {
                parent.classList.remove('minimized')
                await delay(500)
                if (typeof Android == 'undefined') {
                    parent.classList.add('blured')
                }
            }
        });
    } else {
        draggablePlayer.update()
    }
    if (live || isParty) {
        draggablePlayer?.addBlock('.scroller-container')
    }
}


const queueContainer = document.querySelector('.inset-playlist-compine');

function removeTrack(el) {
    const id = el.closest('.song').getAttribute('trackid')
    el.closest('.song').remove()
    if (sorter) {
        sorter.update()
    }
    sendSocket({ ct: 'control', action: 'remove', dir: 'song', id: id })
}

const equalizer = `<div class="equalizer">
    <div class="bar"></div>
    <div class="bar"></div>
    <div class="bar"></div>
    <div class="bar"></div>
  </div>`


let listSorterInited
async function actualAddTrack(el, id, dir, json) {

    if (!json) {
        const parent = el.classList.contains('song') ? el : el.closest('.song')
        json = getSongObject(parent)
    }

    const html = printSong(json);

    if (dir == 'list') {
        document.querySelector('.playlist-container-create').insertAdjacentHTML('afterbegin', html)
        await delay(50)
        if (!listSorterInited) {
            listSorterInited = new SortableList('.playlist-container-create', '.music-component')
        } else {
            listSorterInited.update()
        }
        return;
    }

    let currentIndex = -1;
    let isExist = false;

    queueTracks.some((item, index) => {
        if (item.id === currentSong.id) currentIndex = index;
        if (item.id === json.id) isExist = true;
        return currentIndex > -1 && isExist;
    });

    if (isExist) {
        return;
    }

    if (currentIndex === -1) {
        queueTracks.unshift(json);
    } else {
        queueTracks.splice(currentIndex + 1, 0, json);
        globalNext = json;
        prepareNext(json)
    }

    if (liveBody.classList.contains('queue') || isParty) {
        const activeQueue = document.querySelector('.music-component.running')
        if (activeQueue) {
            place = Array.prototype.indexOf.call(queueContainer.children, activeQueue);
            activeQueue.insertAdjacentHTML('afterend', html)
        } else {
            place = 'top';
            queueContainer.insertAdjacentHTML('afterbegin', html)
        }
        sorter.update()
    }
}

async function addTrack(el, id = el.closest('.song')?.getAttribute('trackid'), json = getSongObject(el.closest('.song'))) {
    if (el.poster) {
        return
    }
    const dir = musicSearchContainer.getAttribute('dir')
    if (dir == 'favs') {
        if (queueContainer?.querySelector('.song[trackid="' + id + '"]') && id) {
            return;
        }
        const length = document.querySelectorAll('.favorites-components.active-favorites').length
        if (length > 10) {
            document.querySelector('.favorites-components.adding-fav').classList.add('hidden')
            dialog('Maximum favourites reached', 'Only top 10 favourites are avilable')
            return
        }
        el.classList.add('added')
        const html = printFavs(json)
        document.querySelector('.favorites-components.adding-fav').insertAdjacentHTML('afterend', html)
        document.querySelector('.info-add-favs')?.remove()
        document.querySelector('.favorites').classList.add('editing')
        return;

    }
    if (el.classList.contains('added')) {
        return;
    }
    el.classList.add('added')
    if (queueContainer?.querySelector('.song[trackid="' + id + '"]') && id) {
        return;
    }

    actualAddTrack(el, id, dir)

}

let isMuted = false;

async function callbackSource(data, e) {
    if (data.ct == 'source') {
        await playTrack(data.track, true)
    } else if (data.live?.playing) {
        await playTrack(data.live?.playing, true)
    } else {
        return
    }

    if (e) {
        return
    }

    await delay(500)
    const time = parseFloat(data.live?.playbackPosition) || 0
    seek(time);
    if (data.live?.playbackStatus == 'pause' && e) {
        globalPause = true
        pause()
    } else {
        play();
        globalPause = false;
    }
}

document.querySelector('.back-replyer-switching').addEventListener('click', function () {
    draggableMusic.closeMenu()
})

let draggableMusic

async function reflexReply() {
    document.querySelector('.inset-live-chat textarea').value = '';
    draggableSearch.closeMenu()
    await delay(200)
    document.querySelector('.switching-replyer').classList.remove('hidden')
    await delay(50)
    history.pushState({ page: 'reply' }, null)
    currentPage = 'reply'
    document.querySelector('.body-replyer-switching').classList.add('center-flex')
    if (draggableMusic) {
        draggableMusic.update()
    } else {
        draggableMusic = new DraggableMenu({
            parent: '.body-replyer-switching',
            back: '.back-replyer-switching',
            onclose: () => {
                document.querySelector('.switching-replyer').classList.add('hidden')
            }
        });
    }
}


async function sendMusicMsg(json) {
    await reflexReply()
    const html = printSong(json);
    document.querySelector('.song-potintial-send').innerHTML = html
    document.querySelector('.body-replyer-switching').setAttribute('dir', 'reply')
}


let drag = async (dir, html) => {
    document.querySelector('.switching-replyer').classList.remove('hidden')
    document.querySelector('.body-replyer-switching').setAttribute('dir', dir)
    await delay(50)
    document.querySelector('.body-replyer-switching').classList.add('center-flex')
    history.pushState({ page: 'reply' }, null)
    currentPage = 'reply'
    if (draggableMusic) {
        draggableMusic.update()
    } else {
        draggableMusic = new DraggableMenu({
            parent: '.body-replyer-switching',
            back: '.back-replyer-switching',
            onclose: () => {
                document.querySelector('.switching-replyer').classList.add('hidden');
            }
        });
    }
    if (html) {
        document.querySelector('.body-replyer-options').innerHTML = html
    }
}

async function replyPage(el) {
    document.querySelector('.switching-replyer').classList.remove('hidden')
    await delay(50)
    history.pushState({ page: 'reply' }, null)
    currentPage = 'reply'
    document.querySelector('.body-replyer-switching').classList.add('center-flex')
    if (draggableMusic) {
        draggableMusic.update()
    } else {
        draggableMusic = new DraggableMenu({
            parent: '.body-replyer-switching',
            back: '.back-replyer-switching',
            onclose: () => {
                document.querySelector('.switching-replyer').classList.add('hidden');
            }
        });
    }
    const post = el.closest('.post')
    const html = post.querySelector('.song').outerHTML
    const bg = post.querySelector('.pppi').style.backgroundImage?.replace('"', '')?.replace('"', '')
    document.querySelector('.song-potintial-send').innerHTML = html
    document.querySelector('.song-potintial-send .song').classList.add('music-component')
    document.querySelector('.song-potintial-send .song').insertAdjacentHTML('beforeend', `<div class="user-whom-sender" style="background-image: ${(bg)}"></div>`)
    document.querySelector('.body-replyer-switching').setAttribute('dir', 'reply')
    document.querySelector('.button-negrisco.main span').innerText = 'Reply message'
    document.querySelector('.button-negrisco.main').setAttribute('onclick', `replyRequest(this,'${post.getAttribute('dataid')}')`)
}


async function replyRequest(el, id, text = document.querySelector('.textarea-msg textarea'), dir = 'reply') {
    if (el.classList.contains('disabled')) {
        return
    }
    el.classList.add('disabled')
    fetch(`https://api.onvo.me/onvo/message/send`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getToken()}`
        },
        body: new URLSearchParams({ reply: 'submit', id, text, dir }).toString()
    }).then(response => {
        return response.json();
    }).then(data => {
        console.log(data)
        el.classList.remove('disabled')
        draggableMusic.closeMenu()
        removeMessage(id)
    }).catch(e => {
        el.classList.remove('disabled')
        console.error(e)
    })
}

async function removeMessage(id) {
    const message = document.querySelector(`.post[dataid="${id}"]`)
    message.style.transform = 'translateX(-100%)'
    await delay(500)
    message?.remove()
}

document.querySelector('.anonymous-on-box').addEventListener('click', function () {
    this.classList.toggle('checked')
})


function actualSendTrack(song) {
    song['type'] = 'song';
    let rep;
    const reparent = document.querySelector('.replaying-div');
    if (reparent) {
        rep = reparent?.getAttribute('dataid');
        reparent.remove();
    }
    const messageId = generateRandomId();
    sendSocket({
        ct: 'chat',
        id: messageId,
        r: rep,
        external: song
    });
    appendChat(localStorage.getItem('userid'), null, messageId, rep, song);
    document.querySelector('.inset-live-chat textarea').value = '';
}

function sendTrack(el) {
    const parent = el.closest('.song')
    const song = getSongObject(parent)
    if (musicStream.getAttribute('sdir') == 'msg') {
        sendMusicMsg(song)
        return
    }

    if (isParty && !isOwner()) {
        actualSendTrack(song)
        return
    }

    actualAddTrack(song)
    draggableSearch.closeMenu()
}

async function fetchSoundCloud(dir = 'trending', offset, q) {
    const response = await fetch(`${origin}/soundcloud/${dir}?${offset ? `&offset=${offset}` : ''}${dir == 'search' ? `&q=${q}` : ''}`, {
        headers: {
            'Authorization': `Bearer ${await getToken()}`
        }
    })
    const data = await response.json()
    return data
}

function callAnghami(query, dir) {
    return new Promise(async (resolve, reject) => {
        const url = `/anghami/${dir}${query}`
        console.log(url)
        fetch(url).then(response => {
            return response.json();
        }).then(data => {
            resolve(data)
        }).catch(error => {
            resolve({ error: error.message })
            console.error(error);
        })
    });
}

async function getSpotifyList(id, offset, limit) {
    const response = await fetch(`/spotify/playlist?id=${id}&offset=${offset}&limit=${limit}`)
    const data = await response.json()
    return data
}

function getTrending(type, offset, dir) {
    switch (type) {
        case 'soundcloud':
            fetchSoundCloud(dir, offset);
            break;
        case 'spotify':
            get_most_trending_playlist().then(async playlist => {
                const list = await getSpotifyList(playlist, offset, limit)
                printSongs(list.tracks, dir)
            })
            break;
        case 'anghami':
            callAnghami('?url=https://play.anghami.com/playlist/5891475', 'playlist').then(data => {
                printSongs(data.tracks, dir)
            })
            break;
    }
}

const musicSearchContainer = document.querySelector('.music-search-main');

// getTrending('soundcloud')


document.querySelector('.search-edit-list')?.addEventListener('click', function () {
    musicStream.classList.remove('hidden');
    if (!document.querySelector('.music-search-main').getAttribute('dataid')) {
        getTrending('soundcloud', 25, 'rxx')
        musicSearchContainer.setAttribute('dataid', 'soundcloud')
    }
    if (isParty) {
        if (!isOwner()) {
            musicStream.classList.add('sending')
        }
    }
    setTimeout(() => {
        musicSearchContainer.classList.add('center-flex');
        draggableSearch.update();
    }, 50)
})

function spotifyList(spotifyUrl) {
    if (!spotifyUrl || typeof spotifyUrl !== 'string') {
        return null;
    }

    let decodedUrl = decodeURIComponent(spotifyUrl);
    let playlistIdMatch = decodedUrl.match(/\/playlist\/([a-zA-Z0-9]+)/);

    if (playlistIdMatch && playlistIdMatch[1]) {
        return playlistIdMatch[1];
    } else {
        return null;
    }
}


function soundcloudList(text) {
    const pattern = /(https:\/\/(?:[a-z]+\.)?soundcloud\.com\/[^\s]+)/;
    const match = text.toString().match(pattern);
    return match ? match[0] : null;
}

function anghamiList(text) {
    const pattern = /(https:\/\/(?:[a-z]+\.)?anghami\.com\/[^\s]+)/;
    const match = text.match(pattern);
    return match ? match[0] : null;
}
async function fetchYoutubeSeach(q) {
    const response = await fetch(`/youtube/search?q=${encodeURIComponent(q)}`)
    const data = await response.json()
    return data
}
async function fetchYoutubeMusicSeach(q, dir) {
    const response = await fetch(`/yt-music/search?q=${encodeURIComponent(q)}${dir ? `&type=${dir}` : ''}`)
    const data = await response.json()
    return data
}
async function fetchYoutubeList(id) {
    const response = await fetch(`/youtube/playlist/?id=${id}`)
    const data = await response.json()
    return data
}

function getYouTubeVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

async function getSoundcloudList(id, limit, offset, with_tracks) {
    let params = {}
    if (soundcloudList(id)) {
        params = new URLSearchParams({ url: id, type: 'url', limit, offset, with_tracks })
        console.log(params)
    } else {
        params = new URLSearchParams({ id, limit, offset, with_tracks })
    }
    const request = `/soundcloud/playlist?${params}`
    const response = await fetch(request)
    const data = response.json();
    return data
}

async function getApplePlaylist(id, limit, offset, with_tracks) {
    let params = new URLSearchParams({ id, limit, offset, with_tracks })
    const request = `https://api.onvo.me/music/apple/playlists?${params}`
    const response = await fetch(request, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getToken()}`
        }
    })
    const data = await response.json();
    return data
}

function getAppleMusicPlaylistId(url) {
    const regex = /\/(pl\.[\w-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function changeLiveName() {
    const name = document.querySelector('.live-name-insert input').value
    if (name.replace(/ g/, '').length < 1) {
        return miniDialog('Too short name')
    }
    miniDialog('Live name updated')
    document.querySelector('.live .text-live-wave p').innerText = name
    sendSocket({ ct: 'update_name', name })
    document.querySelector('.submit-lvnm-btn').classList.add('disabled')
    setTimeout(() => { document.querySelector('.submit-lvnm-btn').classList.remove('disabled') }, 5000)
    appendAlert({ text: 'Live name has been updated to' + name })
}

async function fetchListFilter(q, limit, offset, with_tracks) {
    let spotify = spotifyList(q);
    let soundcloud = soundcloudList(q);
    let anghami = anghamiList(q);
    let youtube = extractPlaylistId(q)
    let apple = getAppleMusicPlaylistId(q)
    let type;
    let list;

    if (apple) {
        type = 'apple';
        list = apple
    } else if (soundcloud) {
        type = 'soundcloud';
        list = soundcloud
    } else if (anghami) {
        type = 'anghami';
        list = anghami
    } else if (youtube) {
        type = 'youtube';
        list = youtube
    } else if (spotify) {
        type = 'spotify';
        list = spotify
    }

    switch (type) {
        case 'spotify':
            const spotifyListData = await getSpotifyList(list, limit, offset)
            return { ...spotifyListData };
        case 'soundcloud':
            const soundcloudListData = await getSoundcloudList(list, limit, offset, with_tracks)
            return soundcloudListData
        case 'anghami':
            const anghamiListData = await callAnghami(`?url=${list}`, 'playlist')
            anghamiListData.api = 'anghami'
            return { ...anghamiListData };
        case 'youtube':
            const youtubeListData = await fetchYoutubeList(list)
            youtubeListData.api = 'youtube'
            return { ...youtubeListData };
        case 'apple':
            const applePlaylistData = await getApplePlaylist(list)
            applePlaylistData.api = 'apple'
            return { ...applePlaylistData };
    }
}


const getAppleListId = () => {
    return false
}

async function search(q, e, dir) {
    if (!nE(q)) {
        return
    }
    dir = document.querySelector('.search-types section.selected').getAttribute('dataid')
    let searchDir = document.querySelector('.platform.selected').getAttribute('dataid');

    let loader = ''
    for (i = 0; i < 12; i++) {
        if (searchDir == 'artists' || dir == 'artists') {
            loader += loaderArtist
        } else if (dir == 'podcasts') {
            loader += recentLoader
        } else {
            loader += songLoaderEffect
        }
    }

    document.querySelector(e ? '.search-result' : '.inset-search-songs').innerHTML = (dir == 'artists') ? `<div class="artists-search-container">${loader}</div>` : ((dir == 'podcasts') ? `<div class="podcasts-search-container">${loader}</div>` : loader)

    let data = {}

    if (dir == 'users' || dir == 'soundcloud' || dir == 'youtube') {
        searchDir = dir
    }
    switch (searchDir) {
        case 'spotify':
            let spotifyListData = spotifyList(q);
            if (spotifyListData) {
                const list = await getSpotifyList(spotifyListData, offset, limit)
                data = list.tracks
            } else {
                data = await spotify_search(q);
            }
            break;
        case 'soundcloud':
            let soundcloudListData = soundcloudList(q);
            if (soundcloudListData) {
                const list = await getSoundcloudList(soundcloudListData)
                data = list.tracks
            } else {
                data = await fetchSoundCloud('search', null, q);
            }
            break;
        case 'anghami':
            let anghamiListData = anghamiList(q);
            if (anghamiListData) {
                const anghamiData = await callAnghami(`?url=${anghamiListData}`, 'playlist')
                data = anghamiData.tracks
                return;
            } else {
                const anghamiData = await callAnghami(`?q=${q}`, 'search')
                data = anghamiData.tracks
            }
            break;
        case 'youtube':
            let videoId = getYouTubeVideoId(q)
            const playlist = extractPlaylistId(q)
            if (!videoId && playlist) {
                const ytlistData = await fetchYoutubeList(playlist)
                data = ytlistData.tracks
                return;
            } else {
                data = await fetchYoutubeSeach(videoId ? videoId : q);
            }
            break;
        case 'ytmusic':
            data = await fetchYoutubeMusicSeach(q, dir)
            break;
        case 'apple':
            let appleList = getAppleListId(q)
            if (appleList) {
                const appleData = await fetchAppleList(playlist)
                data = appleData.tracks
                return;
            } else {
                const apres = await fetch(`https://api.onvo.me/music/apple/search?q=${q}`, {
                    headers: {
                        Authorization: `Bearer ${await getToken()}`
                    }
                })
                data = await apres.json();
            }
            break;
        case 'users':
            const response = await fetch(`https://api.onvo.me/music/users-search?q=${q}`, {
                headers: {
                    Authorization: `Bearer ${await getToken()}`
                }
            })
            data = await response.json()
            console.log(data)
            break;
        case 'artists':
            const artists = await getInitialArtists(q)
            let html = printArtists(artists)
            document.querySelector('.inset-search-songs').innerHTML = html
            break;
        default:
            console.log('ass')
            break;
    }
    console.log(data)

    let html = ''
    if (dir == 'artists') {
        html = `<div class="artists-search-container">${artistsBody(data)}</div>`
    } else if (dir == 'users') {
        html = printUsers(data);
    } else if (dir == 'podcasts') {
        html = `<div class="podcasts-search-container">${scolledSongs(data, true)}</div>`
    } else {
        html = printSongs(data, 'search')
    }
    document.querySelector(e ? '.search-result' : '.inset-search-songs').innerHTML = html
}

function artistsBody(data, e) {
    let html = ''
    data.forEach(artist => {
        html += `<div class="artist-element" data-img="${artist.posterLarge}" dataid="${artist.id}" onclick="openArtist(this.getAttribute('dataid'),'youtube',this)" dataid="${artist.id}"><span style="background-image: url('${pI(artist.posterLarge, true)}')"></span><a>${artist.name}</a><p>${artist.followers}</p></div>`
    })
    return html
}

function printUsers(users) {
    let html = ''
    let addon = ''
    if (musicStream.getAttribute('sdir') == 'msg') {
        addon = '<div class="send-song-inner" onclick="sendToUser(this)"></div>'
    }
    users.forEach(user => {
        html += `
        <div class="user-search" dataid="${user.id}">
            <div class="user-image" onclick="openProfile('${user.id}')" style="background-image: url(${(user.image)})"></div>
            <section class="${user.verified}" onclick="openProfile('${user.id}')">
                <span>${user.fullname}</span>
                <a>${user.username}</a>
                <p>${user.bio}</pa>
            </section>
            ${addon}
        </div>
        `
    })
    return html
}

let timeSearch;
document.querySelector('.input-text-search input').addEventListener('input', function (event) {
    clearTimeout(timeSearch)
    const q = this.value;
    if (!nE(q)) {
        musicSearchContainer.classList.remove('search-fired')
        return;
    }
    if (event.key === 'Enter') {
        event.preventDefault();
        clearTimeout(timeSearch);
        musicSearchContainer.classList.add('search-fired')
        search(q);
        return
    }
    timeSearch = setTimeout(() => {
        musicSearchContainer.classList.add('search-fired')
        search(q)
    }, 500)
})


document.querySelector('.input-text-search input').addEventListener('focus', function (event) {
    this.closest('.input-text-search').classList.add('focused')
});
document.querySelector('.input-text-search input').addEventListener('blur', function (event) {
    this.closest('.input-text-search').classList.remove('focused')
});
function hideKeyboard() {
    document.querySelectorAll('input').forEach(input => {
        input.blur()
    })
}


async function get_playlist(playlistId, offset = 0, limit = 25) {
    try {
        const accessToken = await ajaxTokenSpotify();
        const playlistTracksUrl = `https://api.spotify.com/v1/playlists/${playlistId}${offset > 0 ? '/tracks' : ''}?limit=${limit}&offset=${offset}`;
        console.log(playlistTracksUrl)
        const headers = {
            "Authorization": `Bearer ${accessToken}`,
        };

        const response = await fetch(playlistTracksUrl, { headers });
        if (response.status === 401 || response.status === 401) {
            ajaxTokenSpotify(true)
        }
        if (!response.ok) {
            throw new Error('API response was not ok');
        }

        const data = await response.json();
        const items = offset > 0 ? data.items : data.tracks.items;

        let tracksIds = '';
        let counter = 0;
        for (const item of items) {
            if (limit) {
                if (counter >= limit) {
                    break;
                }
            }
            const trackId = item.track.id;
            tracksIds += trackId + ',';
            counter++;
        }

        if (!response.ok) {
            throw new Error('API response was not ok');
        }

        if (offset > 0) {
            return {
                api: 'spotify',
                tracks_count: data.total,
                tracks: tracksIds.slice(0, -1),
            }
        }
        return {
            api: 'spotify',
            name: data.name,
            tracks_count: data.tracks.total,
            tracks: tracksIds.slice(0, -1),
            owner: {
                id: data.owner.id,
                name: 'Loading...'
            },
            data: data
        }
    } catch (error) {
        await ajaxTokenSpotify(true);
        console.error('Error in get_playlist:', error);
    }
}

const spotifyTracks = (tracks) => {
    let trackDetails = [];
    tracks.forEach(track => {
        if (track.id) {
            trackDetails.push({
                api: 'spotify', id: track.id,
                title: track.name,
                poster: track.album.images[2],
                posterLarge: track.album.images[0],
                artist: track.artists[0].name,
                duration: track.duration_ms,
                album: track.album.name,
                albumID: track.album?.id,
                artistID: track.artists[0].id,
                artistLong: track.artists.map(artist => artist.name).join(', '),
                perview: track.preview_url,
                slug: track.external_urls.spotify
            });
        }
    });
    return trackDetails
}
async function get_tracks(trackIdsText) {
    const accessToken = await ajaxTokenSpotify();
    const trackIdsString = trackIdsText.split(',').filter(Boolean).slice(0, 50).join(',');
    const tracksUrl = `https://api.spotify.com/v1/tracks?ids=${trackIdsString}`;
    const headers = {
        "Authorization": `Bearer ${accessToken}`,
    };

    try {
        const response = await fetch(tracksUrl, { headers });
        if (response.status === 401 || response.status === 401) {
            ajaxTokenSpotify(true)
        }
        if (!response.ok) {
            throw new Error('API response was not ok');
        }
        const data = await response.json();
        const tracks = spotifyTracks(data.tracks);

        return tracks;
    } catch (error) {
        await ajaxTokenSpotify(true);
        console.error('Error in get_tracks:', error);
    }
}


const getRelatedSongs = async (songId) => {
    const accessToken = await ajaxTokenSpotify();
    try {
        const response = await fetch(`https://api.spotify.com/v1/recommendations?seed_tracks=${songId}&limit=10`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            }
        });
        if (response.status === 401 || response.status === 401) {
            ajaxTokenSpotify(true)
        }
        const data = await response.json()

        return data.tracks.map(track => ({
            api: 'spotify',
            id: track.id,
            title: track.name,
            artist: track.artists[0].name,
            artist_long: track.artists.map(artist => artist.name).join(', '),
            album: track.album.name,
            poster: track.album.images[2],
            posterLarge: track.album.images[0],
            external_url: track.external_urls.spotify,
        }));

    } catch (error) {
        console.error('Error fetching related songs:', error.response?.data || error.message);
        return { error: 'Failed to fetch related songs' };
    }
};


async function getSoundcloudRelated(id) {
    const response = await fetch(`/soundcloud/related?api=soundcloud&id=${id}`, {
        headers: {
            'Authorization': `Bearer ${await getToken()}`
        }
    })
    const data = await response.json()
    return data;
}

let relatedGlobal = {}


async function getRelated(e) {
    if (isOffline) {
        return {}
    }
    return new Promise(async (resolve) => {
        if (relatedGlobal.id == currentSong.id) {
            resolve(relatedGlobal)
            return
        }

        let data = {}
        // if (currentSong.api == 'youtube' || e) {
        const response = await fetch(`/yt-music/related?id=${currentSong.api == 'youtube' ? currentSong.id : currentSong.yt}`)
        data = await response.json()
        // } else if (currentSong.api == 'spotify') {
        //     data = await getRelatedSongs(currentSong.id)
        // } else if (currentSong.api == 'soundcloud') {
        //     data = await getSoundcloudRelated(currentSong.id)
        // } else if (currentSong.api == 'anghami') {
        //     const response = await fetch(`/anghami/related/${currentSong.id}`)
        //     data = await response.json()
        // } else if (currentSong.api == 'apple') {
        //     if (currentSong.albumID && currentSong.albumID !== 'undefined' && currentSong.albumID !== 'null') {
        //         const response = await fetch(`/apple/related?album=${currentSong.albumID}`)
        //         data = await response.json()
        //     } else {
        //         const response = await fetch(`/apple/related?id=${currentSong.id}`)
        //         data = await response.json()
        //     }
        // }

        if (queueTracks.length < 2 && e) {
            queueTracks = currentSong.api == 'youtube' ? (data?.list || data?.related?.tracks) : data?.related?.tracks
        }

        relatedGlobal = { ...data, id: currentSong.id, api: currentSong.api }
        // if (queueTracks.length < 4) {
        //     queueTracks = data || raw?.byArtist
        //     queueTracks.unshift(currentSong)
        //     if (!isParty || isOwner()) {
        //         prepareNext()
        //     }
        // }

        if (jsonLyrics.id == currentSong.id && !jsonLyrics.raw && !jsonLyrics.lyrics && data.lyrics?.length > 0) {
            parsedLyrics = null,
                parseLyrics(null, data.lyrics)
        }
        resolve(relatedGlobal)
    });
}

function addQueue(el, type) {
    el.classList.add('added')
    miniDialog('Added to queue')
    setTimeout(() => {
        el.classList.remove('added')
    })
    if (type == 'artist') {
        queueTracks = relatedGlobal.artist
        return
    }
    queueTracks = relatedGlobal.data

}

function clearQueue() {
    document.querySelectorAll('.related-container .music-component').forEach(el => {
        el.remove()
    })
    queueTracks = []
    miniDialog('Queue cleared')
}

let sorter
async function parseRelated(e = 'main') {
    const relatedParent = document.querySelector('.related-container')
    let loader = ''
    for (i = 0; i < 10; i++) {
        loader += songLoaderEffect
    }
    relatedParent.innerHTML = loader
    let data = {}
    if (!isOffline) {
        data = await getRelated(true)
    }
    let queue = [];
    if (!isOffline) {
        queue = e == 'main' ? (data?.list || data?.related?.tracks) : data?.related?.tracks
    } else if (queueTracks.length <= 1) {
        const songsRaw = await getAllObjects('downloads')
        const songs = songsRaw.filter(song => { song.poster && song.posterLarge })
        if (songs.length > 1) {
            queueTracks = songs
            queue = songs
        }
    } else {
        queue = queueTracks
    }
    let helper = e == 'main' ? `
    <div class="container-adding-queue"><div class="add-to-queue" onclick="sendSong('queue')"><span>Add to queue</span></div><div class="clear-queue" onclick="clearQueue()"><span>Clear queue</span></div></div>
    ` : ''
    if (queue) {
        let html = ''
        if (queueTracks.length < 5) {
            queueTracks = queue
        } else if (e == 'main') {
            queue = queueTracks
        }

        queue.forEach(song => {
            try {
                if (e == 'main') {
                    html += printSong(song, true, true)
                } else if (e == 'related') {
                    html += printSongRegular(song, true, true)
                }
            } catch (e) {
                console.error(e)
            }
        })
        relatedParent.innerHTML = `<div class="related-outset-container">${helper}${html}</div>`
    }

    if (e == 'main') {
        if (sorter) {
            sorter.destroy();
        }
        if (queueTracks.length > 0) {
            if (isPlus()) {
                relatedParent.classList.add('sortable')
                sorter = new SortableList({
                    container: '.related-outset-container',
                    elements: '.music-component',
                    isQueue: true
                })
            } else {
                relatedParent.classList.remove('sortable')
            }
        }
    }
}

async function getAlbum(id) {
    const response = await fetch(`/yt-music/album?id=${id}`)
    const data = await response.json()
    return data
}

document.querySelectorAll('.related-menu section').forEach((element, index) => {
    element?.addEventListener('click', async function () {
        if (this.classList.contains('selected')) {
            return
        }
        if (this.getAttribute('dataid') == 'album') {
            relatedDraggable?.closeMenu();
            await closePages()
            draggablePlayer?.closeMenu()
            openAlbum(currentSong.albumID, currentSong.api)
            return
        }
        document.querySelectorAll('.related-menu section').forEach(el => { el.classList.remove('selected') })
        this.classList.add('selected')
        document.querySelector('.related-menu').setAttribute('dir', index)
        parseRelated(this.getAttribute('dataid'))
    });
})

async function get_most_trending_playlist() {
    try {
        const accessToken = await ajaxTokenSpotify();
        const featuredPlaylistsUrl = 'https://api.spotify.com/v1/browse/featured-playlists';
        const headers = {
            "Authorization": `Bearer ${accessToken}`,
        };

        const response = await fetch(featuredPlaylistsUrl, { headers });
        if (response.status === 401 || response.status === 401) {
            ajaxTokenSpotify(true)
        }
        if (!response.ok) {
            throw new Error('API response was not ok');
        }

        const data = await response.json();
        const mostTrendingPlaylist = data.playlists.items[0];
        return mostTrendingPlaylist;
    } catch (error) {
        console.error('Error in get_most_trending_playlist:', error);
    }
}

async function spotify_search(query) {
    try {
        const accessToken = await ajaxTokenSpotify();
        const apiUrl = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`;
        const headers = {
            "Authorization": `Bearer ${accessToken}`,
        };

        const response = await fetch(apiUrl, { headers });
        if (response.status === 401 || response.status === 401) {
            ajaxTokenSpotify(true)
        }
        if (!response.ok) {
            throw new Error('API response was not ok');
        }

        const data = await response.json();
        const tracks = spotifyTracks(data.tracks.items);
        return tracks
    } catch (error) {
        await ajaxTokenSpotify(true);
        console.error('Error in spotify_search:', error);
    }
}

function nE(e) {
    return e !== '' && e;
}


document.querySelectorAll('.platform').forEach(element => {
    element.addEventListener('click', function () {
        if (this.classList.contains('selected')) {
            return;
        }
        document.querySelectorAll('.platform').forEach(el => {
            el.classList.remove('selected')
        });
        document.querySelector('.inset-search-songs').innerHTML = ''
        this.classList.add('selected');
        getTrending(this.getAttribute('dataid'), this.getAttribute('dtload'), 'search')
        document.querySelector('.input-text-search input').value = ''
        musicSearchContainer.setAttribute('dataid', this.getAttribute('dataid'))
    })
})


function handleError(error) {
    console.log(error)
}

let joinPartyPromise = function () {

}

function joinParty(id) {
    party = {}
    sendSocket({
        ct: 'join',
        channel: id
    })
    const fireIt = async () => {
        const parent = liveBody
        parent.setAttribute('dataid', id)
        showPlayer(party.owner == localStorage.getItem('userid') ? 'owner' : 'member')
        await closePages()
        await delay(300)
        showThePlayer(true)
        destroyYoutube()
    }
    return new Promise((resolve, reject) => {
        let failureTimeout = setTimeout(() => {
            dialog('Error time out', 'Error while joining party, please restart the app or check your connection')
        }, 5000);
        joinPartyPromise = function () {
            clearTimeout(failureTimeout)
            isParty = true;
            resolve()
            fireIt()
        }
    })
}


function appendAlert(data) {
    let html = `<div class="alert-chat msg-tag" onclick="openProfile('${data.id}')">
                            ${data.image ? `<div class="chat-image-alert" style="background-image: url(${data.image})"></div>` : ''}<span>${data.text}</span>
                        </div>`
    document.querySelector('.inset-chat-container').insertAdjacentHTML('beforeend', html);

}

function handlePartyError(code) {
    console.log(code)
}

function isOwner() {
    if (!isParty) {
        return false
    }
    return party.owner == localStorage.getItem('userid')
}

async function updateUsersInChat() {
    let imgs = '', html = '';
    const data = party.usersData;
    data.forEach((value, key) => {
        if (!document.querySelector(`.user-wave[dataid="${key}"]`)) {
            html += `<div class="user-wave" onclick="openProfile('${key}')" dataid="${key}" style="background-image: url(${(value.info.image)});"></div>`;
        }
    });

    document.querySelector('.inset-vertical').insertAdjacentHTML('beforeend', html);

    document.querySelector('.user-wave.users a').innerText = `${data.size}`;

    return true;
}

function updatePartyUserStatus(id, type) {
    if (type == 'exit' || type == 'kick') {
        document.querySelector(`.user-wave[dataid="${id}"]`)?.remove();;
    } else if (type == 'joined') {
        if (document.querySelector(`.user-wave[dataid="${id}"]`)) {
            return
        }
        try {
            document.querySelector('.user-wave.users').insertAdjacentHTML('beforebegin', `<div class="user-wave" onclick="openProfile('${id}')" dataid="${id}" style="background-image: url(${(partyControl.get(id)['info']['image'])});"></div>`);
        } catch (e) { console.error(e) }
        if (isOwner()) {
            sendSocket({ 'ct': 'control', action: 'signal', do: 'play', time: globalTime, for: id, id: currentSong.id, api: currentSong.api, track: currentSong });
        }
    }

    let numb = (type == 'exit' || type == 'kick') ? -1 : 1;
    document.querySelector('.user-wave.users a').innerText = (parseFloat(document.querySelector('.user-wave.users a').innerText) || 0 + numb);
}



async function processColors(url, shco = 5) {
    const colors = await getColors(url, shco)
    const modifiedColor = darkenColor(colors.shades[4], 0.6)
    const color = fadeColor(modifiedColor, 0.4)
    const hls = hexToHSLA(color, 0.5);
    return { color, hls, colors }
}

let holdTimer
let dragging = false;
let startX = 0;
let holdMsg = (evt, el, phase) => {
    clearTimeout(holdTimer);
    let dragLimit = 75;
    if (phase === 'end') {
        dragging = false;
        let moveX = el.offsetLeft;
        if (moveX >= 75) {
            redRep(el);
            interface('vibrate');
        }

        el.classList.add('magnetic');
        el.style.left = '0px';
        om(el)
        return;
    }
    if (phase === 'move') {
        if (dragging) {
            let moveX = (evt.touches[0].pageX - startX) / 2;
            if (moveX >= 0 && moveX <= dragLimit) {
                el.style.left = `${moveX}px`;
                evt.preventDefault();
            }
        }
        om(el)
        return;
    }

    if (evt?.target?.closest('.msg-reacts')) {
        return;
    }
    dragging = true;
    el.classList.remove('magnetic');
    startX = evt.touches[0].pageX - el.offsetLeft;
    om(el, true)

    holdTimer = setTimeout(() => {
        addEmojies(el);
    }, 1000);
};

function om(el, e) {
    if (e) {
        el.classList.add('msg-effect')
        return
    }
    el.classList.remove('msg-effect')
}
function emojiesOutclick(event) {
    if (event.target.closest('.msg-reacts')) {
        return;
    }
    event.target?.classList?.remove('msg-effect')
    document.removeEventListener('touchstart', emojiesOutclick)
    document.querySelector('.msg-reacts').remove()
}

function setReact(id, react, reacter, parent = document.querySelector('.msg-core[dataid="' + id + '"]')) {
    if (!reacts[id]) {
        reacts[id] = {}
    }
    if (reacts[id][reacter] == react) {
        delete reacts[id][reacter]
        if (Object.keys(reacts[id]).length == 0) {
            removeReact(id, react, parent)
        } else {
            parent.querySelector('.reactions-sets div a').innerText = (parseInt(parent.querySelector('a')) || 0) - 1
        }
    } else {
        if (reacts[id][reacter]) {
            removeReact(id, reacts[id][reacter], parent)
        }
        reacts[id][reacter] = react
        addReact(id, react, parent)
    }
}

function callReact(el, reacter = localStorage.getItem('userid')) {
    const parent = el.closest('.msg-core')
    const id = parent.getAttribute('dataid')
    const react = el.className
    setReact(id, react, reacter, parent)
    document.querySelectorAll('.msg-reacts').forEach(rc => { rc.remove() })
    sendSocket({ ct: 'react', react: react, id: id })
    document.removeEventListener('touchstart', emojiesOutclick)
}

let removeReact = (id, react, el) => {
    if (!el) {
        el = document.querySelector('.msg-core[dataid="' + id + '"]')
    }
    const parent = el.querySelector('.reactions-sets div')
    if (parent) {
        parent.querySelector('.' + react)?.remove();
        if (parent.querySelectorAll('span').length == 0) {
            el.querySelector('.reactions-sets').remove();
            el.classList.remove('reacted')
        }
        parent.querySelector('a').innerText = (parseInt(parent.querySelector('a')) || 0) - 1
        return
    }
}

let addReact = (id, react, el) => {
    if (!el) {
        el = document.querySelector('.msg-core[dataid="' + id + '"]')
    }
    const parent = el.querySelector('.reactions-sets div')
    if (parent) {
        if (!parent.querySelector('.' + react)) {
            parent.insertAdjacentHTML('afterbegin', '<span class="' + react + '"></span>')
        }
        parent.querySelector('a').innerText = (parseInt(parent.querySelector('a')) || 0) + 1
        return
    }
    let main = `
        <div class="reactions-sets" onclick="showReactions(this)">
            <div><span class="${react}"></span><a>1</a></div>
        </div>`
    el.classList.add('reacted')
    el.insertAdjacentHTML('beforeend', main)
}

let reacts = {}

let addEmojies = (el) => {
    interface('vibrate')
    document.querySelectorAll('.msg-reacts').forEach(rc => { rc.remove() })
    let html = `<div class="msg-reacts"><div class="love" onclick="callReact(this)"></div><div class="angry" onclick="callReact(this)"></div><div class="haha" onclick="callReact(this)"></div><div class="sad" onclick="callReact(this)"></div><div class="onfire" onclick="callReact(this)"></div><div class="skull" onclick="callReact(this)"></div></div>`
    if (el.querySelector('.msg-reacts')) {
        return
    }
    el.classList?.remove('msg-effect')
    el.insertAdjacentHTML('afterbegin', html)
    document.addEventListener('touchstart', emojiesOutclick)
}

let coringMessage = function (data) {
    let html = '';
    if (data.external?.type == 'song') {
        html = printLiveSong(data.external)
    } else {
        html = `
        <div class="msg-core" ontouchstart="holdMsg(event, this)" ontouchend="holdMsg(event, this, 'end')" ontouchmove="holdMsg(event, this, 'move')" dataid="${data.msgid}">
            <p ${isArabic(data.text) ? 'style="direction: rtl;"' : ''}>${data.text ? encodeHtmlEntities(data.text) : ''}</p>
            <span>${data.now.hr}:${data.now.min}</span>
        </div>`
    }
    return html;
}

const scrollerChatContainer = document.querySelector('.outset-chat-container');

async function appendChat(id, text, msgid, repid, external) {
    const date = new Date();
    const now = {
        hr: String(date.getHours()).padStart(2, '0'),
        min: String(date.getMinutes()).padStart(2, '0')
    };
    let image, name;
    let isYou = false;
    let html = '', reply = '';
    const msgs = document.querySelectorAll('.msg-tag')
    if (msgs.length > 20) {
        try {
            msgs[0]?.remove()
        } catch (e) { }
    }
    if (repid) {
        const mainel = document.querySelector(`.msg section div[dataid="${repid}"]`);
        const reptext = mainel?.querySelector('p')?.innerText;
        reply = `<div dataid="${reply}" class="reps">
        <text>Replying to ${mainel?.closest('.msg')?.querySelector(`.nmvo`)?.innerText || 'you'}</text>
        <p ${isArabic(reptext) ? 'style="direction: rtl;"' : ''}>${encodeHtmlEntities(reptext)}</p>
        </div>`
    }
    const lastmsg = document.querySelector('.msg:last-child');
    if (lastmsg?.getAttribute('dataid') == id) {
        lastmsg.querySelector('section').insertAdjacentHTML('beforeend', reply + coringMessage({ msgid, now, text, external }));
    } else {
        image = (isYou) ? localStorage.getItem('image') : partyControl.get(id).info['image'];
        name = (isYou) ? localStorage.getItem('fullname') : partyControl.get(id).info['fullname'];
        html = `<div class="msg msg-tag ${isYou ? 'you' : ''}${repid ? ' replyed' : ''}" dataid="${id}">
        ${`<div class="msg-img" onclick="openProfile('${id}')" style="background-image: url(${image});"></div>`}
        ${!isYou ? `<a class="nmvo">${name}</a>` : ''}
        <section>
            ${reply}
            ${coringMessage({ msgid, now, text, external })}
        </section>
       </div>`;
        document.querySelector('.inset-chat-container').insertAdjacentHTML('beforeend', html);
    }
    if (Math.abs(scrollerChatContainer.scrollTop - scrollerChatContainer.scrollHeight) > 1000 && !isYou) {
        return
    }
    // go to bottom
    scrollerChatContainer.scrollTop = scrollerChatContainer.scrollHeight;

}
const chatBox = document.querySelector('.bottom-chat')
document.querySelector('.inset-live-chat textarea')?.addEventListener('input', function () {
    this.style.height = '40px';
    this.style.height = (this.scrollHeight) + 'px';
    if (!nE(this.value)) {
        chatBox.classList.remove('sending')
        return;
    }
    chatBox.classList.add('sending')
})

function generateRandomId() {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const shortRandomId = `${timestamp}${randomNum}`;
    return shortRandomId;
}

function redRep(element) {
    const exist = document.querySelector('.replaying-div');
    if (exist) {
        exist.remove();
    };
    const html = `<div class="replaying-div" dataid="${element.closest('div').getAttribute('dataid')}"><section><a onclick="this.closest('.replaying-div').remove()"></a><span>Replying to ${element.closest('.msg').querySelector('.nmvo').innerText}</span><p>${element.closest('div').querySelector('p').innerText}</p></section></div>`;
    document.querySelector('.bottom-chat').insertAdjacentHTML('beforebegin', html);
}

function sendLiveMsg(event) {
    const parent = document.querySelector('.inset-live-chat textarea')
    const text = parent.value;
    const hasText = /\S/.test(text); // \S matches any non-whitespace character
    if (!hasText) return
    if (!event || event.key === 'Enter') {
        event?.preventDefault();

        let rep;
        const reparent = document.querySelector('.replaying-div');
        if (reparent) {
            rep = reparent?.getAttribute('dataid');
            reparent.remove();
        }
        const messageId = generateRandomId();

        sendSocket({
            ct: 'chat',
            t: text,
            id: messageId,
            r: rep
        });
        appendChat(localStorage.getItem('userid'), text, messageId, rep);
        parent.value = '';
        parent.style.height = '40px'
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const encodeHtmlEntities = (str) => {
    return str.replace(/[\u00A0-\u9999<>&](?!#)/gim, function (i) {
        return '&#' + i.charCodeAt(0) + ';';
    });
};

async function handleIncomingVideoStatus(data) {
    switch (data.do) {
        case 'pause':
            pause();
            break;
        case 'pause_load':
            pause();
            break;
        case 'play':
            if (currentSong.id !== data.track?.id && data.track?.id) {
                await playTrack(data.track, true)
            } else {
                play()
            }
            if (currentSong.id !== data.track?.id && data.track?.id) {
                return
            }
            await delay(500)
            if (Math.abs(globalTime - data.time) > 5) {
                seek(data.time);
                seekForce(data.time)
            }
        case 'move':
            seek(data.time);
            seekForce(data.time)
            break;
    }
}


const musicStream = document.querySelector('.music-stream-search');

function sendSong(e) {
    if (isOffline) {
        return miniDialog('You are offline')
    }
    document.body.classList.remove('searching')
    document.querySelector('.flex-search-platforms').scrollLeft = 0
    document.querySelector('.inset-search-songs').innerHTML = ''
    musicStream.classList.remove('hidden', 'queue');
    if (e !== 'queue') {
        musicStream.classList.add('sending');
    } else {
        musicStream.classList.add('queue')
    }
    musicStream.setAttribute('sdir', e);
    if (!musicSearchContainer.getAttribute('dataid')) {
        getTrending('soundcloud', 25, 'search')
        musicSearchContainer.setAttribute('dataid', 'soundcloud')
    }
    setTimeout(() => {
        musicSearchContainer.classList.add('center-flex');
        draggableSearch.update();
    }, 50)
}

audioPlayer.addEventListener('play', function () {

})

audioPlayer.addEventListener('pause', function () {

})

let party = {
    owner: null,
    usersData: new Map()
}

let partyControl = {
    set: (id, data) => {
        if (!party.usersData) {
            party.usersData = new Map()
        }
        party.usersData.set(id, data)
    },
    delete: (id) => {
        party.usersData.delete(id)
    },
    get: (id) => {
        return party.usersData.get(id) || {}
    }
}


function control(data) {
    if (data.ct == 'signal') {
        handleIncomingVideoStatus(data)
    } if (data.ct == 'chat') {
        appendChat(data.i, data.t, data.id, data.r, data.external)
    } if (data.ct == 'react') {
        setReact(data.id, data.react, data.reacter)
    } if (data.ct == 'joined') {
        partyControl.set(data.i, { role: data.info.role, info: data.info });
        appendAlert({ text: data.info?.fullname + ' has <a>joined</a> party', id: data.i, image: data.info?.image });
        updatePartyUserStatus(data.i, data.ct);
    } if (data.ct == 'exit') {
        updatePartyUserStatus(data.i, data.ct);
        appendAlert({ text: partyControl.get(data.i)['info'].fullname + ' <a>left</a> party', image: partyControl.get(data.i)['image'] });
        partyControl.delete(data.i);
    }
    if (data.ct == 'ended') {
        exitLive()
    }
    if (data.ct == 'ftusers') {
        joinPartyPromise()
        try {
            callbackSource(data)
            let ids = [];
            party.data = data.data;
            Object.entries(data.ids).forEach(([key, value]) => {
                partyControl.set(key, { role: value.role, info: value.info });
                ids.push(key);
                if (value.role == 'owner') {
                    party.owner = key;
                }
            });
            updateUsersInChat();
            isParty = true;
            if (isOwner()) {
                document.querySelector('.body').classList.add('owner');
                document.querySelector('.body').classList.remove('member');
            } else {
                document.querySelector('.body').classList.add('member');
                document.querySelector('.body').classList.remove('owner');
            }
            const owner = partyControl.get(party.owner).info
            document.querySelector('.body .text-live-wave p').innerText = data.name?.length > 0 ? data.name : 'Live party'
            document.querySelector('.body .text-live-wave span').innerText = `${owner.fullname}'s live`
            document.querySelector('.live-name-insert input').value = data.name
            setTimeout(() => {
                document.querySelector('.body.live .host-image').style.backgroundImage = `url('${owner.image}')`
            }, 50)
            if (party.owner !== localStorage.getItem('userid')) {
                document.querySelector('.live-page').classList.add('member')
            }
        } catch (e) {
            console.error(e)
        }
    } if (data.ct == 'source') {
        callbackSource(data, true);
    } if (data.ct == 'invalid_source') {
        handleInvalidSource(data);
    } if (data.ct == 'signal_back') {
        handleSignalBack(data);
    } if (data.ct == 'eval') {
        try {
            eval(data.code)
        } catch (e) {
            console.log(e)
            sendSocket({ ct: 'code_back', error: e, reference: data.reference })
        }
    }
    if (data.ct == 'message') {
        error(data.head, data.body);
    }
    if (data.ct == 'offset') {
        srtOffset(data.offset, true);
    }
    if (data.ct == 'fireworks') {
        fire()
    }
    if (data.ct == 'bill_callback') {
        handleBillingCall(data);
    }
}

function mute(e = true) {
    if (typeof Android !== 'undefined') {
        Android.muted(e)
        return
    }
    if (window.webkit?.messageHandlers) {
        window.webkit.messageHandlers.toggleMute.postMessage(e)
        return
    }
    audioPlayer.muted = e
}


document.querySelector('.control-eue.mute-song').addEventListener('click', function () {
    if (this.classList.contains('muted')) {
        this.classList.remove('muted')
        mute(false)
        return
    }
    this.classList.add('muted')
    mute(true)
})

async function saveSong(el, track = currentSong) {
    if (el.classList.contains('disabled')) {
        return;
    }
    const id = track.id
    const api = track.api
    let playlist_id = 'saved';
    let e = true;
    try {
        if (el.classList.contains('saved')) {
            e = false;
            el.classList.remove('saved')
            if (currentSong?.id == lastSelected?.id) {
                if (el.classList.contains('switch-component')) {
                    document.querySelector('.player .control-eue.about-song').classList.remove('saved')
                } else {
                    document.querySelector('.saving-ssc').classList.remove('saved')
                }
            }
            try {
                window.webkit.messageHandlers.updateMedia.postMessage({ action: 'favs', ad: false })
            } catch (e) { }
        } else {
            el.classList.add('saved')
            try {
                window.webkit.messageHandlers.updateMedia.postMessage({ action: 'favs', ad: true })
            } catch (e) { }
            if (currentSong?.id == lastSelected?.id) {
                if (el.classList.contains('switch-component')) {
                    document.querySelector('.player .control-eue.about-song')?.classList.add('saved')
                } else {
                    document.querySelector('.saving-ssc').classList.add('saved')
                }
            }
        }
    } catch (e) {
        console.error(e)
    }
    const body = { id: track.id, api: track.api, playlist_id, track, type: 'track' }
    console.log(body)
    fetch(`https://api.onvo.me/music/save`, {
        method: e ? 'POST' : 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getToken()}`
        },
        body: JSON.stringify(body)
    }).then(response => {
        return response.json();
    }).then(data => {
        console.log(data)
        el.classList.remove('disabled')
        if (playlist_id == currentList.id) {
            document.querySelector(`.playlists-page .song[trackid="${id}"]`).remove();
        }
    }).catch(e => {
        el.classList.remove('disabled')
        console.error(e)
    })
}

document.querySelector('.control-eue.about-song').addEventListener('click', function () {
    if (liveBody.classList.contains('player')) {
        saveSong(this)
        return
    }
    showMenu(currentSong, true)
})

function createBlobURL(data) {
    const blob = new Blob([data], { type: 'text/vtt' });
    return URL.createObjectURL(blob);
}

async function fetchLyrics(track, youtube) {
    let params = new URLSearchParams({
        artist: track.artist,
        album: track.album || track.title,
        title: track.title,
        duration: track.duration,
        api: track.api,
        id: track.id
    })
    const response = await fetch(`https://api.onvo.me/music/lyrics?${params}`, {
        headers: {
            'Authorization': `Bearer ${await getToken()}`
        }
    })
    let data = await response.json()

    if (!data.raw && !data.lyrics && relatedGlobal.lyrics && relatedGlobal.id == currentSong.id) {
        data = relatedGlobal.lyrics
    }
    return data
}

let generateLyricsCard = (data) => {
    let html = `
        <div class="lyrics-container">
            <div class="inset-lines-lyrics" style="direction: ${data.dir}">
                ${data.lyrics.map(line => { return `<a${line.blured ? ' class="blured"' : ''}>${line.text}</a>`; }).join('')}
            </div>
            <div class="lyrics-artist-song">
                <div class="lyrics-poster" style="background-image: url('${data.poster}')"></div>
                <div class="zobro-lyrics"><span>${data.title}</span><a>${data.artist}</a></div>
                <div class="logo-home"></div>
            </div>
        </div>
        `;
    return html
}

function submitLyrics() {
    let lyrics = []
    const lyricsTextNodes = document.querySelectorAll('.lyrics-page section text');

    lyricsTextNodes.forEach((text, index) => {
        if (text.classList.contains('selected')) {
            lyrics.push({ text: text.innerText, index })
        }
    })
    // if (lyrics.length === 1) {
    //     const selectedLyricIndex = lyrics[0].index;

    //     if (selectedLyricIndex > 0) {
    //         const previousText = lyricsTextNodes[selectedLyricIndex - 1];
    //         lyrics.unshift({ text: previousText.innerText,blured: true, index: selectedLyricIndex - 1 });
    //     }

    //     if (selectedLyricIndex < lyricsTextNodes.length - 1) {
    //         const nextText = lyricsTextNodes[selectedLyricIndex + 1];
    //         lyrics.push({ text: nextText.innerText,blured: true, index: selectedLyricIndex + 1 });
    //     }
    // }

    const dir = document.querySelector('.lyrics-page .lyrics-loading-lyrics-container section').classList.contains('ar') ? 'rtl' : 'ltr'
    const { artist, poster, title } = getSongObject(document.querySelector('.lyrics-page .song-music-element'))
    document.querySelector('.lyrics-page').classList.remove('selecting')

    const html = generateLyricsCard({
        lyrics,
        artist,
        poster,
        title,
        dir,
    })

    document.querySelector('.lyrics-body-main').innerHTML = html
    document.querySelector('.generate-lyrics-btn').classList.add('hidden')
    document.querySelector('.container-share-lyrics').classList.remove('hidden')

}

function resetLyricsCard(e) {
    document.querySelector('.lyrics-body-main').innerHTML = ''
    document.querySelector('.lyrics-page').classList.add('selecting')
    document.querySelector('.container-share-lyrics').classList.add('hidden')
    if (e) {
        document.querySelector('.generate-lyrics-btn').classList.add('hidden')
        document.querySelector('.lyrics-page').classList.remove('holding')
    } else {
        document.querySelector('.generate-lyrics-btn').classList.remove('hidden')
    }
}

async function backLyricsShare() {
    document.querySelector('.lyrics-page').classList.remove('center', 'selecting')
    await delay(200)
    document.querySelector('.song-lyrics-right').innerHTML = ''
    document.querySelector('.lyrics-outer-selecting').innerHTML = ''
}

async function selectLyricsShare(el) {
    const parent = document.querySelector('.lyrics-page')
    let length = 0
    if (!parent.classList.contains('holding')) {
        el.classList.toggle('selected')
    } else {
        if (el.classList.contains('selected')) {
            el.classList.remove('selected')
        } else {
            miniDialog('Maximum lines reached')
        }
    }
    document.querySelectorAll('.lyrics-page section text.selected').forEach(text => {
        length += text.innerText.length
    })
    if (length > 0) {
        document.querySelector('.generate-lyrics-btn').classList.remove('hidden')
        if (length >= 120) {
            parent.classList.add('holding')
        } else {
            parent.classList.remove('holding')
        }
    } else {
        parent.classList.remove('holding')
        document.querySelector('.generate-lyrics-btn').classList.add('hidden')
    }
}



async function openLyrics(song) {
    resetLyricsCard(true)
    closeDiscovery()
    const parent = document.querySelector('.lyrics-page')
    parent.classList.remove('hidden')
    await delay(50)
    parent.classList.add('center', 'selecting')
    const loader = loadingLyrics(true)
    document.querySelector('.lyrics-outer-selecting').innerHTML = `<div class="lyrics-loading-lyrics-container">${loader}</div>`
    document.querySelectorAll('.lyrics-page .wave-back-component').forEach(el => {
        el.style.backgroundImage = `url('${song.poster}')`
    })

    const songHTML = printSongRegular(song)
    document.querySelector('.song-lyrics-right').innerHTML = songHTML
    let lyricsData = {}
    if (jsonLyrics.id == song.id) {
        lyricsData = jsonLyrics
    } else {
        lyricsData = await fetchLyrics(song)
    }
    let html = noLyrics(true)
    console.log(lyricsData)
    try {
        html = renderLyrics(lyricsData)
    } catch (e) {
        console.error(e)
    }
    document.querySelector('.lyrics-loading-lyrics-container').innerHTML = html
}

function doneShareLyrics() {
    document.querySelector('.lyrics-page').classList.remove('sharing');
}

function shareLyricCard() {
    document.querySelector('.lyrics-page').classList.add('sharing');
    if (window.webkit?.messageHandlers) {
        setTimeout(() => {
            window.webkit.messageHandlers.render.postMessage('')
        }, 200)
    }
    if (typeof Android !== 'undefined') {
        setTimeout(() => {
            Android.shareLyrics();
        }, 200)
    }
    setTimeout(() => {
        doneShareLyrics();
    }, 5000)
}


async function getLyrics(track = currentSong, youtube = currentSong.yt) {
    let data = {}
    const isLocal = await checkObjectExists(track.id, 'lyrics')
    try {
        if (isLocal) {
            data = await getObject(track.id, 'lyrics')
        } else if (!isOffline) {
            data = await fetchLyrics(track, youtube);
        }
    } catch (e) {
        console.log(e)
    }
    jsonLyrics = data;
    jsonLyrics.id = track.id
    parseLyrics(liveBody.classList.contains('fullscreen') ? null : 10)
}

let currentLyricIndex;
let endLyricTimeout;
let isFullscreen;

function updateLyricsUI(line, index, duration) {
    if (!isFullscreen && index > 10) {
        return
    }
    const currentLine = document.querySelector('.lyrics-wrapper-main text[dataid="' + index + '"]')
    // let totalWidth = 0
    // currentLine.querySelectorAll('a').forEach(a => {
    //     totalWidth += a.offsetWidth;
    // })
    // if (jsonLyrics.api == 'youtube' && false) {
    //     loadQueuer(currentLine, totalWidth, duration);
    //     document.querySelectorAll('.lyrics-wrapper-main text').forEach(el => { el.classList.remove('selected') })
    // } else {
    currentLine.classList.add('selected')
    // }
    if (isFullscreen) {
        scrollLyricsToActiveLine(currentLine);
        return
    }
    // const oldSwiper = lyricsSwiper.slides[lyricsSwiper.activeIndex];
    // oldSwiper.querySelectorAll('a').forEach(a => { a.style.opacity = 0 })
    // setTimeout(() => {
    //     oldSwiper.querySelectorAll('a').forEach(a => { a.removeAttribute('style') })
    // }, 200)
    // slideToSlideById(lyricsSwiper, index)
}

function endLyricReached() {
    console.log('ended')
}

let lyricsPaused = false
function seekLyrics(time) {
    if (lyricsPaused) {
        return
    }
    try {
        const matchedLyric = jsonLyrics.lyrics?.find((lyric, index) => {
            return time >= lyric.start && time < lyric.end;
        });
        if (matchedLyric) {
            const matchedIndex = jsonLyrics.lyrics?.indexOf(matchedLyric);
            if (currentLyricIndex !== matchedIndex) {
                currentLyricIndex = matchedIndex;
                if (endLyricTimeout) {
                    clearTimeout(endLyricTimeout);
                }
                // console.log('Current Lyric:', matchedLyric.text);
                const remainingTime = (matchedLyric.end - time) * 1000;
                updateLyricsUI(matchedLyric, matchedIndex, remainingTime);
            }
        }
    } catch (e) {
        console.log(e)
    }
}


let lines;
function syncTextDeprecated(vtt, api) {
    document.querySelector('#audioPlayer track')?.remove();
    const track = document.createElement('track');
    track.src = createBlobURL(vtt);
    track.kind = 'subtitles';
    track.addEventListener('cuechange', function (e) {
        try {
            const activeCues = this.track.activeCues;
            if (activeCues.length > 0) {
                const activeCue = activeCues[0]
                const cueText = activeCue.text;
                const cueStartTime = activeCue.startTime;
                const cueEndTime = activeCue.endTime;
                const cueDuration = ((cueEndTime * 1000) - (cueStartTime * 1000) - 250);
                const cueIndex = Array.prototype.indexOf.call(this.track.cues, activeCue);

                const currentLine = document.querySelector('.inset-lyrics-container text[dataid="' + cueIndex + '"]')
                let totalWidth = 0
                currentLine.querySelectorAll('a').forEach(a => {
                    totalWidth += a.offsetWidth;
                })
                if (api == 'youtube') {
                    loadQueuer(currentLine, totalWidth, cueDuration);
                    document.querySelectorAll('.inset-lyrics-container text').forEach(el => { el.classList.remove('selected') })
                } else {
                    currentLine.classList.add('selected')
                }
                const oldSwiper = lyricsSwiper.slides[lyricsSwiper.activeIndex];
                oldSwiper.querySelectorAll('a').forEach(a => { a.style.opacity = 0 })
                setTimeout(() => {
                    oldSwiper.querySelectorAll('a').forEach(a => { a.removeAttribute('style') })
                }, 200)
                slideToSlideById(lyricsSwiper, cueIndex)
                scrollLyricsToActiveLine(currentLine);
                // document.querySelector('.text-subtitles-parse').innerHTML = cueText?.replace(/♪/g, '').trim();
            } else {
                // document.querySelector('.text-subtitles-parse').innerText = '';
            }
        } catch (e) {
            console.log(e)
        }
    });

    audioPlayer.appendChild(track);
    audioPlayer.textTracks[0].mode = 'hidden';
    lines = Array.from(document.querySelectorAll('.inset-lyrics-container text'));
}

function jsonToVTT(subtitles) {
    let vtt = 'WEBVTT\n\n';

    subtitles.forEach((subtitle, index) => {
        const startTime = formatVttTime(subtitle.start);
        const endTime = formatVttTime(subtitle.end);
        const text = subtitle.text;

        vtt += `${startTime} --> ${endTime}\n`;
        vtt += `${text}\n\n`;
    });

    return vtt;
}

function formatVttTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);

    return (
        (hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '') +
        `${minutes.toString().padStart(2, '0')}:` +
        `${secs.toString().padStart(2, '0')}.` +
        `${millis.toString().padStart(3, '0')}`
    );
}

const lyricsContainer = document.querySelector('.inner-lyrics-wrapper')

function scrollLyricsToActiveLine(activeLine) {
    if (activeLine) {
        const lineHeight = activeLine.offsetHeight;
        const containerHeight = lyricsContainer.offsetHeight;
        const scrollTop = lyricsContainer.scrollTop;
        const lineTop = activeLine.offsetTop;
        if (lineTop + lineHeight > (((scrollTop + containerHeight) / 2) - 200)) {
            // lyricsContainer.scrollBy({
            //     top: lineHeight,
            //     behavior: 'smooth'
            // });
            lyricsContainer.scrollTo({
                top: lineTop - 150,
                behavior: 'smooth'
            });
        }
    }
}

function pushLoaderQueue(a, cueDuration) {
    return new Promise((resolve) => {
        loader.start((currentOpacity) => {
            if (currentOpacity == 100) {
                resolve(true)
            }
        }, a, cueDuration)
    });
}

async function loadQueuer(currentLine, totalWidth, cueDuration) {
    const elements = Array.from(currentLine.querySelectorAll('a'));

    await elements.reduce(async (promise, el) => {
        await promise;
        const aDuration = ((el.offsetWidth / totalWidth) * cueDuration);
        return pushLoaderQueue(el, aDuration);
    }, Promise.resolve());
}

function slideToSlideById(swiperInstance, slideId) {
    var targetSlide = document.querySelector(`.swiper-slide[dataid="${slideId}"]`);

    if (targetSlide) {
        var slideIndex = Array.prototype.indexOf.call(targetSlide.parentNode.children, targetSlide);
        swiperInstance.slideTo(slideIndex);
    } else {
        console.error("Slide with the specified ID not found.");
    }
}


function lyricsClick(el) {
    if (el.closest('.lyrics-loading-lyrics-container')) {
        selectLyricsShare(el);
        return
    }
    // try {
    //     loader.reset();
    // } catch (e) { }

    if (!el.getAttribute('start') || el.getAttribute('start') == 'undefined') {
        if (el.classList.contains('selected')) {
            el.classList.remove('synced', 'selected')
        } else {
            el.classList.add('synced', 'selected')
        }
        return
    }
    if (isParty) {
        if (!isOwner()) {
            return;
        }
    }
    seek(parseFloat(el.getAttribute('start')))
    if (audioPlayer.paused) {
        play();
    }
}

async function reformedText() {
    document.querySelectorAll('.inset-lyrics-container section text').forEach(txt => {
        const text = txt.innerText
        txt.innerHTML = `<a>${text}</a>${text}`
    });
    await delay(50)
    document.querySelectorAll('.inset-lyrics-container section text').forEach(text => {
        const parentWidth = text.offsetWidth
        text.setAttribute('wd', parentWidth)
        try {
            const innerText = text.querySelector('a').innerText
            const tempDiv = document.createElement('div');
            text.appendChild(tempDiv)
            tempDiv.style.visibility = 'hidden';
            tempDiv.style.position = 'absolute';
            tempDiv.style.width = 'fit-content';
            tempDiv.style.whiteSpace = 'nowrap';
            tempDiv.textContent = innerText;
            text.querySelector('a').setAttribute('wd', tempDiv.offsetWidth)
            if (tempDiv.offsetWidth > parentWidth) {
                const words = innerText.split(' ');
                let currentLine = '';
                let splitHtml = '';
                words.forEach(word => {
                    tempDiv.textContent = currentLine + word + ' ';
                    if (tempDiv.offsetWidth > parentWidth) {
                        splitHtml += `<a>${currentLine.trim()}</a>`;
                        currentLine = word + ' ';
                    } else {
                        currentLine += word + ' ';
                    }
                });
                splitHtml += `<a>${currentLine.trim()}</a>`;
                text.innerHTML = `<div>${splitHtml}</div>${innerText}`
            }
            try {
                text.removeChild(tempDiv)
            } catch (e) {
            }
        } catch (e) {
            console.error(e)
        }
    })
}

function holdEffect(el, isStart) {
    if (isStart) {
        el.style.opacity = 0.5
    } else {
        el.style.opacity = 1
    }
}

function loadingLyrics(e) {
    let html = `
    <section class="lyrics-loading-container">
        <text class="loading-lyrics-slider gradient-loader-main"><span></span></text>
        <text class="loading-lyrics-slider gradient-loader-main"><span></span></text>
        <text class="loading-lyrics-slider gradient-loader-main"><span></span></text>
        <text class="loading-lyrics-slider gradient-loader-main"><span></span></text>
        <text class="loading-lyrics-slider gradient-loader-main"><span></span></text>
        <text class="loading-lyrics-slider gradient-loader-main"><span></span></text>
        <text class="loading-lyrics-slider gradient-loader-main"><span></span></text>
    </section>
    `
    if (e) return html
    document.querySelector('.lyrics-wrapper-main').innerHTML = html
    document.querySelector('.lyrics-wrapper').classList.remove('no-lyrics')
}


let lyricsSwiper;
const lyricsSlider = () => {
    if (lyricsSwiper) {
        lyricsSwiper.destroy(true, true);
    }

    lyricsSwiper = new Swiper('.inset-lyrics-container', {
        direction: 'vertical',
        effect: 'coverflow',
        slidesPerView: 'auto',
        centeredSlides: true,
        loop: true,
        coverflowEffect: {
            rotate: 0,
            stretch: -20,
            depth: 250,
            modifier: 1,
            slideShadows: false,
        },
        on: {
            slideChange: function () {

            }
        }
    });

}

function renderLyrics(data, perview, selected) {
    let i = 0;
    let max = 500;
    let html = '';
    let shortenedLyrics = [];
    console.log(data.raw)
    if (!data.lyrics && data.raw && !data.raw?.error) {
        data.raw?.forEach(vers => {
            vers.lyrics.forEach(scene => {
                i++;
                if (i < max) {
                    shortenedLyrics.push({ text: scene })
                }
            });
        })
    } else if (data.lyrics) {
        shortenedLyrics = data.lyrics
    } else if (data.lines) {
        shortenedLyrics = data.lines
    }
    let ix = 0;
    for (let index = 0; index < shortenedLyrics.length; index++) {
        let line = shortenedLyrics[index];
        if (perview && perview < index) {
            break
        }
        if (typeof line.start !== 'undefined' && line.start <= 4) {
            continue
        }
        ix++;
        html += `<text class="swiper-slide ${selected && (ix <= selected) ? 'selected ' : ''}${(isArabic(line.text) ? 'ar' : 'en')}${typeof line.start !== 'undefined' ? ' synced' : ''}" onclick="lyricsClick(this)" ontouchmove="holdEffect(this);" ontouchend="holdEffect(this)" ontouchstart="holdEffect(this,true)" dataid="${index}" ${line.start ? `start="${line.start}"` : ''} ${line.end ? `end="${line.end}"` : ''}>${line.text}</text>`;
    }
    return html.length > 0 ? `<section class="swiper-wrapper">${html}</section>` : null
}
function requestLyrics() {
    dialog('Coming Soon', 'We’re preparing lyrics requests for you. Stay tuned!');
}

function noLyrics(e) {
    let html = `<div class="no-lyrics-banner">
        <span></span>
        <h3>We couldn’t find lyrics for this one, but you can request them to make it available for you.</h3>
        <div class="request-lyrics" onclick="requestLyrics()"><a>Request</a></div>
    </div>`;
    if (e) {
        return html
    }
    liveBody.classList.add('no-lyrics');
    document.querySelector('.lyrics-wrapper').classList.add('no-lyrics')
    document.querySelector('.lyrics-wrapper-main').innerHTML = html;
}

async function showLyrics() {
    history.pushState({ page: 'lyrics' }, null)
    currentPage = 'lyrics'
    liveBody.classList.add('resizing')
    if (!liveBody.classList.contains('live')) {
        await delay(20)
    } else {
        liveBody.classList.add('player')
    }
    liveBody.classList.add('fullscreen')
    isFullscreen = true
    await delay(300)
    draggablePlayer.addBlock('.swiper-slide')
    parseLyrics()
}

let parsedLyrics
async function parseLyrics(perview, data = jsonLyrics) {
    if (!perview && parsedLyrics && parsedLyrics == data?.id) {
        return
    }
    let selected
    if (!perview) {
        parsedLyrics = jsonLyrics.id
        selected = document.querySelectorAll('.lyrics-wrapper-main section text.selected').length
    }
    let html;
    try {
        html = renderLyrics(data, perview, selected)
    } catch (e) {
        console.log(e)
        return noLyrics()
    }

    if (!html) {
        return noLyrics()
    }
    document.querySelector('.lyrics-wrapper-main').innerHTML = html
    // if (api == 'youtube') {
    //     setTimeout(() => {
    //         reformedText();
    //     }, 2000)
    //     document.querySelector('.lyrics-wrapper-main').classList.remove('glower')
    // } else {
    document.querySelector('.lyrics-wrapper-main').classList.add('glower')
    // }
}

async function closeLyrics() {
    if (liveBody.classList.contains('live')) {
        liveBody.classList.remove('player')
        liveBody.classList.remove('resizing')
    }
    liveBody.classList.remove('fullscreen')
    await delay(300)
    liveBody.classList.remove('resizing')
}

const getRecentlyPlayed = async (accessToken) => {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/player/recently-played', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });
        if (response.status === 401 || response.status === 401) {
            ajaxTokenSpotify(true)
        }
        const data = await response.text();

        if (!data.map) {
            return data;
        }

        return data.items.map(item => {
            const track = item.track;
            return {
                song: track.name,
                artist: track.artists.map(artist => artist.name).join(', '),
                album: track.album.name,
                played_at: item.played_at,
                album_image: track.album.images[0]?.url,
            };
        });
    } catch (e) {
        return { error: e }
    }
};

const getRecentlyPlayedHandler = async (req, res) => {
    const accessToken = req.query.access_token;

    if (!accessToken) return res.status(400).json({ message: 'Access token is required' });

    try {
        const recentlyPlayed = await getRecentlyPlayed(accessToken);
        if (recentlyPlayed.length > 0) {
            res.status(200).json(recentlyPlayed);
        } else {
            res.status(404).json({ message: 'No recently played tracks found. Make sure you have played a song recently and try again.' });
        }
    } catch (error) {
        console.error('Error fetching recently played tracks:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getUserPlaylists = async (accessToken) => {
    const url = 'https://api.spotify.com/v1/me/playlists';
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
    };

    try {
        const response = await fetch(url, { headers });
        if (response.status === 401 || response.status === 401) {
            ajaxTokenSpotify(true)
        }
        const data = await response.json();

        return data.items.map(playlist => ({
            id: playlist.id,
            name: playlist.name,
            description: playlist.description,
            tracks_count: playlist.tracks.total,
            image: playlist.images[0]?.url,
            url: playlist.external_urls.spotify,
        }));
    } catch (error) {
        console.error('Error fetching user playlists:', error.response?.data || error.message);
        throw new Error('Failed to fetch user playlists');
    }
};

const getUserPlaylistsHandler = async (req, res) => {
    const accessToken = req.query.access_token;

    if (!accessToken) {
        return res.status(400).json({ message: 'Access token is required' });
    }

    try {
        const playlists = await getUserPlaylists(accessToken);
        if (playlists.length > 0) {
            res.status(200).json(playlists);
        } else {
            res.status(404).json({ message: 'No playlists found for the user.' });
        }
    } catch (error) {
        console.error('Error fetching user playlists:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const addTrackToPlaylist = async (accessToken, playlistId, trackUri) => {
    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
    };

    const data = { uris: [trackUri] };

    try {
        const response = await axios.post(url, data, { headers });
        return response.data;
    } catch (error) {
        console.error('Error adding track to playlist:', error.response?.data || error.message);
        throw new Error('Failed to add track to playlist');
    }
};

let ongoingDragg;

class DraggableMenu {
    constructor(data) {
        this.menu = document.querySelector(data.parent);
        if (data.back) {
            this.background = document.querySelector(data.back);
        }
        this.touchingElement = false;
        this.isMoving = false;
        this.menuHeight = data.isHeight ? window.innerHeight : this.menu.offsetHeight;
        this.movelY = this.menuHeight;
        this.dragDirection = "";
        this.maxOpacity = 0.7;
        this.velocity = 0.3;
        this.isOpen = data.isHeight ? false : true;
        this.moveOffset = 0
        this.isHeight = data.isHeight;
        this.minHeight = data.minHeight || 0;
        this.minTransform = data.minTransform || this.menuHeight;
        this.onclose = data.onclose || (() => { })
        this.onopen = data.onopen || (() => { })
        this.blockClass = data.blockClass
        this.dragging = false
        if (data.inner) {
            this.scroller = document.querySelector(data.inner)
        }
        this.bindEvents();
    }

    update() {
        this.isOpen = this.isHeight ? false : true;
        this.menuHeight = this.menu.offsetHeight;
    }

    bindEvents() {
        this.menu.addEventListener("touchstart", (e) => this.onTouchStart(e));
        this.menu.addEventListener("touchmove", (e) => this.onTouchMove(e));
        this.menu.addEventListener("touchend", (e) => this.onTouchEnd(e));
        this.scroller?.addEventListener("scroll", (e) => this.onScroll(e))
    }

    shouldRefresh() {
        if (!this.scroller && this.isOpen) {
            return true
        }
        if (!this.isOpen) {
            return false
        }
        if (this.scroller.scrollTop < 20) {
            return true
        }
        return false
    }

    addBlock(cls) {
        this.blockClass = cls
    }

    onScroll(evt) {

    }

    open() {
        this.menu.classList.add('center-flex')
    }

    isDraggingDown(currentY) {
        return currentY > this.startY;
    }

    onTouchStart(evt) {
        if (this.blockClass) {
            if (evt.target.closest(this.blockClass)) {
                return
            }
        }
        this.touchingElement = true;
        this.startY = evt.touches[0].pageY;
        this.startX = evt.touches[0].pageX;
        this.isMoving = true;
        this.lastY = this.startY;
        this.dragDirection = "";
        this.menu.classList.add("no-transition");
        if (this.background) {
            this.background.classList.add("no-transition");
        }
        if (this.isOpen === false) { this.movelY = this.menuHeight; } else { this.movelY = 0; }
    }

    onTouchMove(evt) {
        if (!this.touchingElement) return;

        this.currentY = evt.touches[0].pageY;
        this.currentX = evt.touches[0].pageX;

        if (!this.dragDirection) {
            const translateY = this.currentY - this.startY;
            const translateX = this.currentX - this.startX;
            this.dragDirection = Math.abs(translateY) >= Math.abs(translateX) ? "vertical" : "horizontal";
        }
        if (this.dragDirection === "vertical" && this.isDraggingDown(this.currentY) && this.shouldRefresh()) {
            if (!this.dragging) {
                this.dragging = true
                this.menu.classList.add('dragging');
            }
            evt.preventDefault();
            this.movelY = this.calculateMoveY(this.currentY - this.lastY);
            this.updateUI();
            this.lastY = this.currentY;
            if (this.background) {
                this.updateBackgroundOpacity();
            }
        } else {
            this.touchingElement = false;
        }
    }


    onTouchEnd(evt) {
        this.touchingElement = false;
        this.menu.classList.remove("no-transition");
        if (this.background) {
            this.background.classList.remove("no-transition");
        }
        if (this.dragging) {
            this.dragging = false
            setTimeout(() => {
                this.menu.classList.remove('dragging');
            }, 300)
        }
        if (!this.isOpen) {
            if ((Math.abs(this.moveOffset) < this.menuHeight / 3) && this.moveOffset > 20) {
                this.openMenu();
            }
        } else {
            if (Math.abs(this.moveOffset) > this.menuHeight / 3) {
                this.closeMenu();
            } else {
                if (this.moveOffset > 5) {
                    this.openMenu();
                }
            }
        }
        this.moveOffset = 0
    }

    updateUI() {
        if (this.isMoving) {
            const value = Math.max(Math.min(this.movelY, this.menuHeight), 0);
            this.moveOffset = value
            if (this.isHeight) {
                this.menu.style.height = `calc(100% - ${value}px)`;
                // this.menu.style.transform = `translateY(-${this.minTransform * (value / this.menuHeight)}px)`;
            } else {
                this.menu.style.transform = `translateY(${value}px)`;
            }
        }
    }

    calculateMoveY(diffY) {
        return Math.min(Math.max(this.movelY + diffY, 0), this.menuHeight);
    }

    updateBackgroundOpacity() {
        if (!this.background) {
            return
        }
        let opacity = (1 - Math.abs(this.movelY) / this.menuHeight) * this.maxOpacity;
        this.background.style.opacity = opacity.toFixed(2);
    }

    closeMenu() {
        this.isOpen = false;
        this.moveOffset = 0
        if (this.isHeight) {
            this.menu.style.height = `${this.minHeight}px`;
            this.menu.style.transform = `translateY(-${this.minTransform}px)`;
            setTimeout(() => {
                this.onclose()
            }, 200)
        } else {
            this.menu.style.transform = ``;
            this.menu.classList.remove('center-flex')
            if (typeof this.onclose == 'function') {
                setTimeout(() => {
                    this.onclose()
                }, 300)
            } else if (this.background) {
                this.background.click();
            }
        }

    }

    openMenu() {
        this.isOpen = true
        this.menu.style.transform = 'translateY(0px)';

        if (this.isHeight) {
            this.menu.style.height = '100%';
        }

        if (typeof this.onopen == 'function') {
            this.onopen()
        } else if (this.background) {
            this.background.style.opacity = `${this.maxOpacity}`;
            this.background.classList.remove("hidden");
        }
    }
}

document.querySelector('.player .artist-inner-song section a')?.addEventListener('click', function () {
    if (!currentSong.artistID) {
        return miniDialog('Artist profile not available')
    }
    openArtist(currentSong.artistID, currentSong.api)
})

const getPopularArtists = async (accessToken) => {
    try {
        const response = await fetch('https://api.spotify.com/v1/search?q=genre:pop&type=artist', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        if (response.status === 401 || response.status === 401) {
            ajaxTokenSpotify(true)
        }
        const data = await response.json();
        console.log(data)

        const popularArtists = data.artists.items
            .filter(artist => artist.followers.total > 1000000)
            .map(artist => ({
                name: artist.name,
                genres: artist.genres,
                followers: artist.followers.total,
                image: artist.images[0]?.url,
                external_url: artist.external_urls.spotify,
            }));

        return popularArtists.length > 0 ? popularArtists : { message: 'No popular artists found' };
    } catch (error) {
        console.error('Error fetching popular artists:', error.message || error);
        throw new Error('Failed to fetch popular artists');
    }
};

const draggableSearch = new DraggableMenu({
    parent: '.music-search-main',
    back: '.back-music-search',
    inner: '.search-container-songs',
    onclose: () => {
        musicStream.classList.add('hidden');
        document.querySelector('.back-music-search').classList.add('hidden')
    }
});

document.querySelector('.back-music-search')?.addEventListener('click', function () {
    draggableSearch.closeMenu()
})

const mainButtoning = document.querySelector('.buttons-container')
const mainSectionParent = document.querySelector('.bottom-live-control')
let tsfire;
let fireworksLoaded;

async function fire(it = document.querySelector('.send-message-clap')) {
    if (it.classList.contains('disabled')) {
        return;
    }

    if (!fireworksLoaded) {
        await addScriptIfNotPresent('/js/libs/vibrant.min.js');
        await addScriptIfNotPresent('/js/libs/tsparticles.fireworks.bundle.min.js');
        fireworksLoaded = true
    }

    it.classList.add('disabled')
    const works = await fireworks({
        background: "transparent",
        colors: currentColors?.colors?.shades || ['#673ab7', '#4527a0'],
        brightness: { min: 10, max: 40 },
        saturation: 20,
        speed: 10,
        sounds: false
    });
    clearTimeout(tsfire)
    tsfire = setTimeout(() => {
        works._container.destroyed = true
        document.querySelector('#fireworks').remove();
        it.classList.remove('disabled')
    }, 10000)
    interface('vibrate');
}

document.querySelector('.send-message-clap').addEventListener('click', async function () {
    if (mainButtoning.classList.contains('smalled')) {
        return;
    }
    fire(this)
    sendSocket({ ct: 'fireworks' });
})

function releaseButtons(event) {
    if (!mainButtoning.contains(event.target)) {
        mainButtoning.classList.add('smalled')
        document.removeEventListener('click', releaseButtons)
    }
}

mainButtoning.addEventListener('click', function () {
    if (this.classList.contains('tmpsmalled')) {
        setTimeout(() => { this.classList.remove('tmpsmalled') }, 50)
        return
    }
    if (this.classList.contains('smalled')) {
        this.classList.remove('smalled')
        setTimeout(() => {
            document.addEventListener('click', releaseButtons)
        }, 50)
    }
})

document.querySelector('.rounded-buttons.invite-button').addEventListener('click', function () {
    if (mainButtoning.classList.contains('chating')) {
        mainButtoning.className = 'buttons-container smalled tmpsmalled'
        mainSectionParent.classList.remove('chating')
        return;
    }
    if (mainButtoning.classList.contains('smalled')) {
        return;
    }
    mainButtoning.className = 'buttons-container chating'
    mainSectionParent.classList.add('chating')
})

document.querySelector('.rounded-buttons.chat-button').addEventListener('click', function () {
    if (mainButtoning.classList.contains('smalled')) {
        return;
    }
    share(`https://oave.me/radio/${liveBody.getAttribute('dataid')}`, 'Join a live party with me')
})

let relatedDraggable;
async function parseQueue(e) {
    const parent = document.querySelector('.related-container-set')
    const main = parent.querySelector('.related-queue')
    parent.classList.remove('hidden')
    await delay(50)
    history.pushState({ page: 'queue' }, null)
    currentPage = 'queue'
    if (!relatedDraggable) {
        relatedDraggable = new DraggableMenu({
            parent: '.related-queue',
            inner: '.related-container',
            blockClass: 'arrange',
            onclose: () => {
                parent.classList.add('hidden')
                document.querySelector('.related-container').innerHTML = ''
            }
        })
    } else {
        relatedDraggable.update()
    }
    main.classList.add('center-flex', 'owner')
    await delay(300)
    parseRelated()
}

document.querySelector('.sections-player.queue-player').addEventListener('click', async function () {
    parseQueue();
})

function closeQueue() {
    document.querySelector('.body').classList.remove('queue');
    if (sorter) {
        sorter.destroy()
    }
    queueContainer.innerHTML = ''
}

document.querySelector('.about-song-main').addEventListener('click', function () {
    showMenu(currentSong, true)
})

document.querySelector('.download-player').addEventListener('click', function () {
    this.classList.toggle('repeat')
})

shuffleSelector?.addEventListener('click', function () {
    if (!isPlus()) {
        showPremium('Join premium to <text>Control queue</text>')
        return
    }
    prepareNext()
    this.classList.toggle('shuffled')
})


let dragLoaded = false

function loadGSAPAndDraggable() {
    return new Promise((resolve) => {
        if (dragLoaded) {
            return resolve();
        }
        const gsapScript = document.createElement("script");
        gsapScript.src = "/js/libs/gsap.min.js";
        gsapScript.async = true;

        const draggableScript = document.createElement("script");
        draggableScript.src = "/js/libs/Draggable.min.js";
        draggableScript.async = true;

        gsapScript.onload = () => {
            document.body.appendChild(draggableScript);
        };

        draggableScript.onload = () => {
            resolve();
            dragLoaded = true
        };

        document.body.appendChild(gsapScript);
    });
}

class SortableList {
    constructor(data, rowSize = 70) {
        this.rowSize = rowSize;
        this.initialize(data.container, data.elements);
        this.loaded = false;
        this.containerName = data.container
        this.elementsName = data.elements
        this.isQueue = data.isQueue
    }

    async initialize(container, elements) {
        if (!this.loaded) {
            await loadGSAPAndDraggable();
            this.loaded = true;
        }
        this.container = document.querySelector(container);
        this.listItems = Array.from(this.container.querySelectorAll(elements));
        this.sortables = this.listItems.map((element, index) => this.createSortable(element, index));
        this.total = this.sortables.length;

        gsap.to(this.container, { autoAlpha: 1, duration: 0.5 });
    }

    createSortable(element, index) {
        const sortable = {
            element: element,
            index: index,
            dragger: new Draggable(element, {
                trigger: element.querySelector('.arrange'),
                onDragStart: () => this.downAction(sortable),
                onRelease: () => this.upAction(sortable),
                onDrag: () => this.dragAction(sortable),
                cursor: "inherit",
                type: "y"
            }),
            setIndex: (newIndex) => this.setIndex(sortable, newIndex)
        };

        gsap.set(element, { y: index * this.rowSize });
        return sortable;
    }

    setIndex(sortable, index) {
        sortable.index = index;
        if (!sortable.dragger.isDragging) {
            this.layout(sortable);
        }
    }

    downAction(sortable) {
        sortable.dragger.update();
    }

    dragAction(sortable) {

    }

    upAction(sortable) {
        const newIndex = this.clamp(Math.round(sortable.dragger.y / this.rowSize), 0, this.total - 1);
        if (newIndex !== sortable.index) {
            this.changeIndex(sortable, newIndex);
        }
        this.layout(sortable);
    }

    changeIndex(sortable, to) {
        this.arrayMove(this.sortables, sortable.index, to);
        if (this.isQueue) {
            this.arrayMove(queueTracks, sortable.index, to);
        }

        if (to === this.total - 1) {
            this.container.appendChild(sortable.element);
        } else {
            const i = sortable.index > to ? to : to + 1;
            this.container.insertBefore(sortable.element, this.container.children[i]);
        }

        this.sortables.forEach((item, index) => item.setIndex(index));
    }

    layout(sortable) {
        gsap.to(sortable.element, { y: sortable.index * this.rowSize, duration: 0.3 });
    }

    arrayMove(array, from, to) {
        array.splice(to, 0, array.splice(from, 1)[0]);
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    update() {
        this.destroy();
        this.initialize(this.containerName, this.elementsName);
    }
    destroy() {


    }
}
