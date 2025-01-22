const path = require('path')
const { Router } = require(path.join(process.argv[1], 'node_modules', 'express').replace('index',''));
const router = Router();


const IOS_CLIENT_VERSION = '19.28.1',
    IOS_DEVICE_MODEL = 'iPhone16,2',
    IOS_USER_AGENT_VERSION = '17_5_1',
    IOS_OS_VERSION = '17.5.1.21F90';

const ANDROID_CLIENT_VERSION = '19.30.36',
    ANDROID_OS_VERSION = '14',
    ANDROID_SDK_VERSION = '34';

const generateClientPlaybackNonce = (length) => {
    const CPN_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    return Array.from({ length }, () => CPN_CHARS[Math.floor(Math.random() * CPN_CHARS.length)]).join('');
};

const getData = async (videoId, isRaw, clientName = 'android') => {

    let client = {}
    let agent = `com.google.ios.youtube/${IOS_CLIENT_VERSION}(${IOS_DEVICE_MODEL}; U; CPU iOS ${IOS_USER_AGENT_VERSION} like Mac OS X; en_US)`

    switch (clientName) {
        case 'ios':
            client = {
                clientName: 'IOS',
                clientVersion: IOS_CLIENT_VERSION,
                deviceMake: 'Apple',
                deviceModel: IOS_DEVICE_MODEL,
                platform: 'MOBILE',
                osName: 'iOS',
                osVersion: IOS_OS_VERSION,
                hl: 'en',
                gl: 'US',
                utcOffsetMinutes: -240,
            }
            break;
        case 'android':
            client = {
                clientName: 'ANDROID',
                clientVersion: ANDROID_CLIENT_VERSION,
                platform: 'MOBILE',
                osName: 'Android',
                osVersion: ANDROID_OS_VERSION,
                androidSdkVersion: ANDROID_SDK_VERSION,
                hl: 'en',
                gl: 'US',
                utcOffsetMinutes: -240,
            }
            agent = `com.google.android.youtube/${ANDROID_CLIENT_VERSION} (Linux; U; Android ${ANDROID_OS_VERSION}; en_US) gzip`
            break;
    }

    const payload = {
        videoId,
        cpn: generateClientPlaybackNonce(16),
        contentCheckOk: true,
        racyCheckOk: true,
        context: {
            client,
            request: {
                internalExperimentFlags: [],
                useSsl: true,
            },
            user: {
                lockedSafetyMode: false,
            },
        },
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
            'User-Agent': agent,
            'X-Goog-Api-Format-Version': '2',
        },
        body: JSON.stringify(payload),
    };
    const response = await fetch(`https://youtubei.googleapis.com/youtubei/v1/player?${queryString}`, opts);
    const data = await response.json()
    return !isRaw ? parseFormats(data) : data;
};

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


router.get('/get', async (req, res) => {
    try {
        const formats = await getData(req.query.id)
        const bestAudio = filter(formats, 'bestaudio');
        res.json({ url: bestAudio.url })
    } catch (e) {
        console.log(e)
        res.json({ error: e.message })
    }
});

// Export the router
module.exports = router;
