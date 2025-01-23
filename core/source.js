let fetch;

(async () => {
    fetch = (await import('node-fetch')).default;
})();


const generateClientPlaybackNonce = (length) => {
    const CPN_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    return Array.from({ length }, () => CPN_CHARS[Math.floor(Math.random() * CPN_CHARS.length)]).join('');
};

const iosPayload = {
    data: () => {
        return {
            cpn: generateClientPlaybackNonce(16),
            contentCheckOk: true,
            racyCheckOk: true,
            context: {
                client: {
                    clientName: 'IOS',
                    clientVersion: '19.228.1',
                    deviceMake: 'Apple',
                    deviceModel: 'iPhone16,2',
                    platform: 'MOBILE',
                    osName: 'iOS',
                    osVersion: '17.5.1.21F90',
                    hl: 'en',
                    gl: 'US',
                    utcOffsetMinutes: -240,
                },
                request: {
                    internalExperimentFlags: [],
                    useSsl: true,
                },
                user: {
                    lockedSafetyMode: false,
                },
            }
        }
    },
    agent: `com.google.ios.youtube/19.228.1(iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)`
}
const remotePaylod = {
    data: () => {
        return {
            cpn: generateClientPlaybackNonce(16),
            contentCheckOk: true,
            racyCheckOk: true,
            context: {
                client: {
                    clientName: 'ANDROID',
                    clientVersion: '19.30.36',
                    platform: 'MOBILE',
                    osName: 'Android',
                    osVersion: '14',
                    androidSdkVersion: '34',
                    hl: 'en',
                    gl: 'US',
                    utcOffsetMinutes: -240,
                },
                request: {
                    internalExperimentFlags: [],
                    useSsl: true,
                },
                user: {
                    lockedSafetyMode: false,
                },
            }
        }
    },
    agent: `com.google.android.youtube/19.30.36 (Linux; U; Android 14; en_US) gzip`
}

const getData = async (videoId, isRaw, payloadData) => {
    const payload = {
        videoId,
        ...payloadData || remotePaylod.data()
    };

    const query = {
        prettyPrint: false,
        t: generateClientPlaybackNonce(12),
        id: videoId,
    };

    const queryString = new URLSearchParams(query).toString();
    const opts = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': remotePaylod.agent,
            'X-Goog-Api-Format-Version': '2',
        },
        body: JSON.stringify(payload),
    };
    let data = {}
    try {
        const response = await fetch(`https://youtubei.googleapis.com/youtubei/v1/player?${queryString}`, opts);
        if (!response.ok) {
            hasError = true
            checkUpdate()
        }
        data = await response.json()
    } catch (e) {

    }
    return !isRaw ? parseFormats(data) : data;
};

let hasError = false

const checkUpdate = async () => {
    try {
        const response = await fetch('https://st.onvo.me/config.json')
        const json = await response.json()
        if (json.version !== currentVersion) {
            if (json.data && hasError || json.forceUpdate) {
                remotePaylod.data = () => {
                    return {
                        cpn: generateClientPlaybackNonce(16),
                        ...json.data
                    }
                }
            }
            if (json.agent && hasError || json.forceUpdate) {
                remotePaylod.agent = json.agent
            }
        }
    } catch (e) {

    }
}

const parseFormats = (response) => {
    let formats = [];
    if (response && response.streamingData) {
        formats = formats
            .concat(response.streamingData.formats || [])
            .concat(response.streamingData.adaptiveFormats || []);
    }
    return formats;
};

const filter = (formats, filter, options = {}) => {
    if (!Array.isArray(formats)) {
        throw new Error('Formats must be an array');
    }

    if (!filter) {
        throw new Error('Filter must be provided');
    }

    const {
        fallback = false,
        customSort = null,
        minBitrate = 0,
        minResolution = 0,
        codec = null,
    } = options;

    let fn;

    const filterByCodec = (format) => {
        if (!codec) return true;
        return format.mimeType.includes(codec);
    };

    const filterByBitrate = (format) => {
        return (format.bitrate || 0) >= minBitrate;
    };

    const filterByResolution = (format) => {
        return (format.width || 0) >= minResolution || (format.height || 0) >= minResolution;
    };

    const filterByUrl = (format) => !!format.url;

    const applyFilters = (format) => {
        return filterByUrl(format) && filterByCodec(format) && filterByBitrate(format) && filterByResolution(format);
    };

    switch (filter) {
        case 'bestvideo':
            fn = (format) => format.mimeType.includes('video');
            return formats
                .filter((format) => applyFilters(format) && fn(format))
                .sort(customSort || ((a, b) => (b.width || 0) - (a.width || 0) || (b.bitrate || 0) - (a.bitrate || 0)))[0];

        case 'bestaudio':
            fn = (format) => format.mimeType.includes('audio');
            return formats
                .filter((format) => applyFilters(format) && fn(format))
                .sort(customSort || ((a, b) => (b.bitrate || 0) - (a.bitrate || 0)))[0];

        case 'lowestvideo':
            fn = (format) => format.mimeType.includes('video');
            return formats
                .filter((format) => applyFilters(format) && fn(format))
                .sort(customSort || ((a, b) => (a.width || 0) - (b.width || 0) || (a.bitrate || 0) - (b.bitrate || 0)))[0];

        case 'lowestaudio':
            fn = (format) => format.mimeType.includes('audio');
            return formats
                .filter((format) => applyFilters(format) && fn(format))
                .sort(customSort || ((a, b) => (a.bitrate || 0) - (b.bitrate || 0)))[0];

        case 'videoandaudio':
        case 'audioandvideo':
            fn = (format) => format.mimeType.includes('video') && format.mimeType.includes('audio');
            break;

        case 'video':
            fn = (format) => format.mimeType.includes('video');
            break;

        case 'videoonly':
            fn = (format) => format.mimeType.includes('video') && !format.mimeType.includes('audio');
            break;

        case 'audio':
            fn = (format) => format.mimeType.includes('audio');
            break;

        case 'audioonly':
            fn = (format) => !format.mimeType.includes('video') && format.mimeType.includes('audio');
            break;

        default:
            if (typeof filter === 'function') {
                fn = filter;
            } else if (typeof filter === 'string' && filter.startsWith('extension:')) {
                const extension = filter.split(':')[1];
                fn = (format) => format.url.includes(`.${extension}`);
            } else {
                throw new Error(`Given filter (${filter}) is not supported`);
            }
    }

    const filteredFormats = formats.filter((format) => applyFilters(format) && fn(format));

    if (fallback && filteredFormats.length === 0) {
        return formats.filter(filterByUrl)[0];
    }

    return filteredFormats;
};


module.exports = { filter, getData, remotePaylod }