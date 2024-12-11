
let url = new URL(window.location.href);
let params = new URLSearchParams(url.search);
let token = localStorage.getItem('token');
const version = '1.8';
let isApp = (typeof Android !== 'undefined' || window.webkit) ? true : false;

let globalRCE = {}
if (!token) {
    getToken();
} else {
    interface('token', token)
}


function closeError() {
    history.back();
    closedError = true;
}

function error(head, body) {
    createSwitch([head, body], [{
        text: 'Done',
        attr: 'onclick="closeError()"',
        class: 'main'
    }]);
}

let currentPage = ''
async function getToken() {
    const innrtToken = localStorage.getItem('token');
    if (innrtToken) {
        return innrtToken;
    }
    return fetch('https://api.onvo.me/token').then(response => {
        if (!response.ok) {
            handleError(response, true);
        }
        return response.json();
    }).then(data => {
        if (data.error) {
            handleError(data, true);
        }
        localStorage.setItem('token', data.token)
        token = data.token;
        interface('token', token)
        return token;
    }).catch(error => {
        error('Token Error', 'You have error fetching the token, please contact support')
        handleError(error);
        return error;
    });
}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let closedError;
async function closeError() {
    if (closedError) {
        return
    }
    document.querySelector('.dialog-body').classList.remove('center')
    await delay(200)
    document.querySelector('.dialog-container').classList.add('hidden')
    closedError = false
}

const fetchUserInfo = async () => {
    const data = { status: 'true', fcm: localStorage.getItem('notitoken'), osVersion: localStorage.getItem('osVersion'), deviceManufacturer: localStorage.getItem('deviceManufacturer'), androidID: localStorage.getItem('androidID'), deviceModel: localStorage.getItem('deviceModel'), version: version, url: window.location.href, page: window.location.host, path: window.location.pathname, query: window.location.search }
    try {
        const res = await fetch(`https://api.onvo.me/wave/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${await getToken()}`
            },
            body: new URLSearchParams(data).toString()
        })
        const response = await res.json();
        return response
    } catch (error) {
        return error;
    }
}


function saveUserInfo(data) {
    try {
        localStorage.setItem('userid', data.id);
        localStorage.setItem('fullname', data.fullname);
        localStorage.setItem('firstname', data.firstname);
        localStorage.setItem('image', data.image);
        localStorage.setItem('username', data.username);
    } catch (e) {
        console.error(e);
    }
}

function printData(data, e) {
    if (!data) return;
    if (e) {
        saveUserInfo(data);
    }
    if (data.image) {
        document.querySelectorAll('.host-image').forEach(img => { img.style.backgroundImage = `url(${data.image})` })
    }
    if (data.fullname) {
        document.querySelectorAll('.morning-home a').forEach(span => { span.innerText = data.fullname })
    }
}

const origin = window.location.origin

function isArabic(text) {
    var arabic = /[\u0600-\u06FF]/;
    return arabic.test(text)
}

function isWeb() {
    return false
    return !window.webkit?.messageHandlers && typeof Android == 'undefined'
}

let proxy = (url, e, isDownload) => {
    return `${origin}/proxy?url=${encodeURIComponent(url)}${e ? '&cache=true' : ''}${isDownload ? '&download=true' : ''}`
}
let pI = (url, e, c) => {
    if (isWeb() || c) {
        return url
    }
    return `${origin}/proxy?url=${encodeURIComponent(url)}${e ? '&nocache=true' : ''}`
}

const AuthUser = async (user_credentials) => {
    return fetch('https://api.onvo.me/auth/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${await getToken()}`,
        },
        body: new URLSearchParams(user_credentials).toString(),
    }).then(response => {
        if (!response.ok) {
            handleError(response, true);
        }
        return response.json();
    }).then(data => {
        if (data.error) {
            handleError(data, true);
        }
        return data;
    }).catch(error => {
        handleError(error);
        console.error(error);
    });
};


const ONVO_Oauth = async (origin, path, query, port) => {
    try {
        console.log(origin)
        const res = await fetch(`https://api.onvo.me/auth?token=sub&api=wave&origin=${origin || window.location.hostname}&port=${port || window.location.port}&path=${path || window.location.pathname}&qurey=${query || window.location.search}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
        const response = await res.json();
        if (res.status === 200) {
            return response.url
        }
        return false
    } catch (error) {
        console.log('error Oauth', error);
        return false
    }
}

async function calculateConnectionSpeed() {
    const imageAddr = "https://www.google.com/images/branding/googlelogo/1x/googlelogo_light_color_272x92dp.png"; // URL to a sample image
    const downloadSize = 1024 * 1024; // 1MB file

    return new Promise(resolve => {
        var startTime, endTime;
        var download = new Image();
        download.onload = function () {
            endTime = (new Date()).getTime();
            var duration = (endTime - startTime) / 1000; // Time in seconds
            var bitsLoaded = downloadSize * 8;
            var speedMbps = (bitsLoaded / duration / 1024 / 1024).toFixed(2); // Speed in Mbps
            resolve(speedMbps);
        };

        startTime = (new Date()).getTime();
        download.src = imageAddr + "?n=" + Math.random(); // Randomizing URL to prevent caching
    });
}

let onvo_id = params.get('onvo_id');

function logoutClear() {
    localStorage.removeItem('userid');
    localStorage.removeItem('fullname');
    localStorage.removeItem('firstname');
    localStorage.removeItem('image');
    localStorage.removeItem('username');
}

if (params.get('spotify_token')) {
    filterUrl({ host: 'spotify', query: { spotify_refresh: params.get('spotify_refresh'), spotify_token: params.get('spotify_token'), spotify_expire: params.get('spotify_expire') } })
    let url = new URL(window.location);
    url.searchParams.delete('spotify_refresh');
    url.searchParams.delete('spotify_token');
    url.searchParams.delete('spotify_expire');
    window.history.replaceState({}, document.title, url);
}

if (onvo_id) {
    let token_secret = params.get('token_secret');
    filterUrl({ host: 'login', query: { token_secret: token_secret, onvo_id: onvo_id } })
}
function handleError(e = {}, i) {
    if (i) {
        if (e.error == 'user_not_signed') {
            createSwitch(
                ['Sign in required', 'You have to sign in with ONVO account to ' + (e.action || 'Create party')], [
                {
                    text: 'Sign in',
                    attr: `onclick="login(this,true)"`,
                    class: 'main'
                },
                {
                    text: 'Cancel',
                    attr: `onclick="closeError();"`,
                }

            ]);
            return;
        }
        error(e.type || 'Error occured', e.message || e.toString());
    }
}

// for call auth 

/*  */
function logout(el, e) {
    if (el.classList.contains('loading')) return;
    el.insertAdjacentHTML('beforeend', roller);
    el.classList.add('loading');
    fetch('https://api.onvo.me/auth/logout/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${token}`,
        },
        body: new URLSearchParams({ from: 'wave', action: e }).toString(),
    }).then(response => {
        if (!response.ok) {
            handleError(response, true);
        }
        return response.json();
    }).then(data => {
        if (data.error) {
            handleError(data, true);
        }
        closeError();
        if (data.status == 'done') {
            logoutClear();
            if (document.body.classList.contains('movie-parent')) {
                document.querySelector('.user-information').innerHTML = '<div class="loginicon" onclick="login(this)"></div>';
                document.querySelector('.menu-logs-sets').remove();
                return;
            }
            document.querySelector('.login-data').innerHTML = '';
            document.querySelector('.login-search-container').insertAdjacentHTML('beforeend', '<div class="login-btn" onclick="login(this)"></div>');
            goHome();
            if (e == 'delete') {
                error('Account deleted', 'your account was deleted successfully')
            }
        }
        closeMenuMobile()
    }).catch(error => {
        closeError();
        handleError(error);
        console.error(error);
    });
}

function login(element, e) {
    element.classList.add('loading');
    if (!e) {
        element.innerHTML = roller;
    } else {
        element.insertAdjacentHTML('beforeend', roller)
    }
    ONVO_Oauth().then(url => {
        interface('open', url);
        element.classList.remove('loading');
        if (!e) {
            element.innerHTML = '';
        } else {
            element.query('.lds-roller-main')?.remove()
        }
        document.querySelector('.login-btn').classList.remove('terms');
        document.querySelector('.watch-party-argument').classList.add('hidden');
    });
}

if (window.innerWidth < 380 && window.innerWidth > 250) {
    var scale = window.innerWidth / 380;
    var metaTag = document.querySelector("meta[name=viewport]");
    metaTag?.setAttribute('content', 'width=device-width, initial-scale=' + scale + ', maximum-scale=' + scale + ', user-scalable=no');
}

function interface(type, data, arr = {}) {
    try {
        switch (type) {
            case 'open':
                if (window.webkit) {
                    window.webkit.messageHandlers.openUrl.postMessage(data);
                } else if (typeof Android !== 'undefined') {
                    Android.openUrlInBrowser(data)
                } else {
                    window.open(data)
                }
                break;
            case 'login':
                window.webkit.messageHandlers.login.postMessage("a");
                break;
            case 'share':
                window.webkit.messageHandlers.share.postMessage({
                    text: arr.text,
                    url: arr.header
                });
                break;
            case 'web':
                if (window.webkit) {
                    window.webkit.messageHandlers.web.postMessage(data);
                } else if (typeof Android !== 'undefined') {
                    Android.openUrlInBrowser(data)
                } else {
                    window.open(data)
                }
                break;
            case 'notisets':
                window.webkit.messageHandlers.notificationSettings.postMessage("a");
                break;
            case 'token':
                try {
                    window.webkit.messageHandlers.setUserToken.postMessage(data);
                } catch (e) {
                    console.error(e)
                }
                break;
            case 'vibrate':
                window.webkit.messageHandlers.vibrate.postMessage("a");
                break;
            case 'notitoken':
                window.webkit.messageHandlers.notitoken.postMessage("a");
                break;
            case 'webview':
                if (window.webkit) {
                    window.webkit.messageHandlers.openWebView.postMessage(data);
                } else {
                    Android.displayView(data);
                }
                break;
            case 'copy':
                if (window.webkit) {
                    window.webkit.messageHandlers.copy.postMessage(data);
                } else if (typeof Android !== 'undefined') {
                    Android.copyItem(data);
                }
            case 'paste':
                if (window.webkit) {
                    window.webkit.messageHandlers.pasteItem.postMessage('');
                } else if (typeof Android !== 'undefined') {
                    Android.pasteItem('');
                }
                break;
            default:

                break;
        }
    } catch (e) {
        console.error(e)
    }
}

async function sucessLog(data) {
    saveUserInfo(data.user);
    await delay(200)
    window.location.assign(`/?success_login=${data.profile ? 'true' : 'setup'}`)
    let url = new URL(window.location);
    if (data.user.id) {

    }
    document.querySelector('.login-page').remove()
    document.body.classList.remove('outlog')

    url.searchParams.delete('onvo_id');
    url.searchParams.delete('token_secret');
    window.history.replaceState({}, document.title, url);
}

async function getRadio(id) {
    const response = await fetch(`https://api.onvo.me/music/channels?id=${id}`, {
        headers: {
            Authorization: `Bearer ${await getToken()}`
        }
    })
    const data = await response.json();
    return data
}

async function filterUrl(data) {
    globalRCE = data
    if (data.host == 'login') {
        AuthUser({ login: 'true', onvo_id: data.query.onvo_id, token_secret: data.query.token_secret, api: 'wave' }).then(async data => {
            if (data.error) {
                handleError(data, true);
            }
            token_secret = null;
            onvo_id = null;
            sucessLog({ user: data });

        });
    }
    if (data.host == 'spotify') {
        localStorage.setItem('spotify_token', data.query.spotify_token)
        localStorage.setItem('spotify_refresh', data.query.spotify_refresh)
        localStorage.setItem('spotify_expire', data.query.spotify_expire)
        // loged in
    }
    if (data.host == 'billing') {
        if (data.query.success == 'true') {
            handleBillingCall({ success: true })
        }
    }

    if (data.host == 'radio') {
        const data = await getRadio(data.query.id)
        fireJoinMethod(data)
    }
}


function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;

        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
    });
}

function hexToHSL(hex) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    r /= 255;
    g /= 255;
    b /= 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h * 360, s * 100, l * 100];
}


function colorEqualizer(baseHex, targetHex) {
    const baseHSL = hexToHSL(baseHex);
    const targetHSL = hexToHSL(targetHex);
    const newColor = hslToHex(targetHSL[0], baseHSL[1], baseHSL[2]);
    return newColor;
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function generateShades(hex, numberOfShades = 10) {
    const hsl = hexToHSL(hex);
    const shades = [];
    for (let i = -Math.floor(numberOfShades / 2); i <= Math.floor(numberOfShades / 2); i++) {
        let newLightness = Math.min(Math.max(hsl[2] + i * 10, 0), 100);
        shades.push(hslToHex(hsl[0], hsl[1], newLightness));
    }

    return shades;
}

async function getColors(imageURL, shco) {
    try {
        const img = await loadImage(imageURL);
        const vibrant = new Vibrant(img);
        const palette = await vibrant.getPalette();
        const mutedColor = palette.Muted.getHex();
        const shades = generateShades(mutedColor, shco);
        return { shades: shades, muted: mutedColor }
    } catch (err) {
        console.error('Failed to load image or extract colors:', err);
    }
}

function hexToHSLA(hex, opacity = 1) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    r /= 255;
    g /= 255;
    b /= 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = h * 360;
    s = s * 100;
    l = l * 100;
    return `hsl(${h.toFixed(2)}deg ${s.toFixed(2)}% ${l.toFixed(2)}% / ${opacity * 100}%)`;
}

function hexToRGBA(hex, opacity = 1) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
function darkenColor(hex, darkenAmount) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, Math.round(r * (1 - darkenAmount)));
    g = Math.max(0, Math.round(g * (1 - darkenAmount)));
    b = Math.max(0, Math.round(b * (1 - darkenAmount)));
    r = r.toString(16).padStart(2, '0');
    g = g.toString(16).padStart(2, '0');
    b = b.toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
}

function decodeJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

function fadeColor(hex, fadeAmount) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.round(r + (128 - r) * fadeAmount);
    g = Math.round(g + (128 - g) * fadeAmount);
    b = Math.round(b + (128 - b) * fadeAmount);
    r = r.toString(16).padStart(2, '0');
    g = g.toString(16).padStart(2, '0');
    b = b.toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

window.addEventListener('popstate', function (event) {
    if (event.state.page == 'home') {
        document.querySelectorAll('.page.center').forEach(page => {
            if (page.classList.contains('player')) {
                minimizePlayer(page)
            } else {
                page.classList.remove('center')
            }
        })
    }
});

async function ajaxTokenSpotify(e) {
    return new Promise((resolve, reject) => {
        let stdte = {};
        try {
            if (nE(localStorage.getItem("spotify_data"))) {
                stdte = JSON.parse(localStorage.getItem("spotify_data"));
            }
        } catch (e) {

        }
        if (stdte.token && !e) {
            if ((Math.floor(Date.now() / 1000) - parseInt(stdte.time)) < 600) {
                resolve(stdte.token);
                return;
            }
        }
        fetch(`https://api.onvo.me/spotify?spotify_token=true${e ? '&force=true' : ''}`, {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
            }
        }).then(response => {
            return response.json();
        }).then(data => {
            resolve(data.token);
            localStorage.setItem("spotify_token", data.token);
            localStorage.setItem("spotify_data", JSON.stringify(data));
        }).catch(error => {
            reject(error)
        });
    });
}

function formatNumber(number) {
    if (number < 1000) {
        return number?.toString();
    } else if (number < 1000000) {
        return (number / 1000).toFixed(1) + 'K';
    } else if (number < 1000000000) {
        return (number / 1000000).toFixed(1) + 'M';
    } else {
        return (number / 1000000000).toFixed(1) + 'B';
    }
}

function d(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

async function dialog(header, text, btns = ['<button class="main" onclick="closeError()" type="button"><span>Got it</span></button>']) {
    const page = document.querySelector('.dialog-container')
    page.classList.remove('hidden')
    page.querySelector('.dialog-header span').innerHTML = header
    page.querySelector('.dialog-header p').innerHTML = text
    let html = ''
    btns.forEach(btn => {
        html += btn
    })
    page.querySelector('.dialog-buttons').innerHTML = html
    await delay(50)
    page.querySelector('.dialog-body').classList.add('center')
}


let currentProfile = {}
let currentSettings = {};

try {
    const stc = localStorage.getItem('settings')
    if (stc) {
        currentSettings = JSON.parse(stc)
    }
} catch (e) { }
