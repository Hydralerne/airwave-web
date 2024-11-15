// ╔═══════════════════════════════════════════════════════╗
// ║                                                       ║
// ║                 Hydra de Lerne                        ║
// ║               For ONVO Platforms LLC                  ║
// ║                                                       ║
// ╚═══════════════════════════════════════════════════════╝


const xml2js = require('xml2js');

let fetch;

(async () => {
    fetch = (await import('node-fetch')).default;
})();

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

const scrap = async (url, agent = 'chrome') => {
    let agents = {
        chrome: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        ios: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        android: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
    }
    return fetch(url, {
        headers: agents[agent],
        redirect: 'follow',
    });
}


function filterYoutube(json) {
    const core = json.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents

    let tracks = [];
    let data = []

    core.forEach(component => {
        try {
            data = data.concat(component.itemSectionRenderer?.contents || []);
        } catch (e) {
            console.log(e)
        }
    });

    data.forEach(video => {
        try {
            tracks.push({
                api: 'youtube',
                id: video.videoRenderer.videoId,
                poster: video.videoRenderer.thumbnail.thumbnails[0].url,
                title: video.videoRenderer.title.runs[0].text,
                artist: video.videoRenderer.ownerText.runs[0].text,
            })
        } catch (e) {
            // console.log(e)
        }
    })

    return tracks
}

async function getVideoId(req, res) {
    const { q } = req.query
    try {
        const json = await scrapYoutube(`https://www.youtube.com/results?search_query=${q}`)
        const data = filterYoutube(json)
        if (data.length == 0) {
            throw new Error('error yt')
        }
        res.json({ id: data[0].id })
    } catch (e) {
        console.log(e)
        res.json({ error: e })
    }

}

function filterYoutubeScrap(textData) {
    const ytInitialDataRegex = /var ytInitialData = (.*?);<\/script>/s;
    const match = textData.match(ytInitialDataRegex);

    if (match && match[1]) {
        return JSON.parse(match[1]);
    } else {
        return { error: 'no_data' }
    }
}


function extractSubtitles(html) {
    const ytInitialDataRegex = /var ytInitialPlayerResponse\s*=\s*(\{.*?\})\s*;/s;
    const match = html.match(ytInitialDataRegex);

    if (match && match[1]) {
        try {
            let jsonString = match[1];
            const lastBraceIndex = jsonString.lastIndexOf('}');
            jsonString = jsonString.substring(0, lastBraceIndex + 1);
            const jsonData = JSON.parse(jsonString);
            return jsonData;
        } catch (error) {
            return { error: 'json_parse_error' };
        }
    } else {
        return { error: 'no_data' };
    }
}


function requestSubtitles(videoId, html) {
    return new Promise(async (resolve, reject) => {
        try {
            if (!html) {
                html = await scrapYoutube(`https://www.youtube.com.eg/watch?v=${videoId}`, true)
            }
            const json = extractSubtitles(html)
            const captions = json?.captions?.playerCaptionsTracklistRenderer?.captionTracks || { error: 'no_captions' };
            let url

            if (!captions[0]?.name?.simpleText.includes('auto')) {
                url = captions[0]?.baseUrl;
            }

            let original
            let selected = captions[0]?.languageCode;

            try {
                for (let track of captions) {
                    if (track.languageCode == 'ar' || track.languageCode == 'en') {
                        original = track.languageCode
                        break;
                    }
                }

                for (let track of captions) {
                    if (track.languageCode == original && !track.name?.simpleText.includes('auto')) {
                        url = track.baseUrl
                        selected = track.languageCode
                        break;
                    }
                }
            } catch (e) {
                console.log(e)
            }

            if (!url) {
                return resolve({ error: 'no_lyrics', discriptions: 'no_captions_found' })
            }

            const data = await scrapYoutube(url, true);
            resolve(data)
        } catch (e) {
            resolve({ error: e.message })
        }
    });
}

function processSubtitles(subtitles) {
    return subtitles
        .map(subtitle => {
            let { start, end, text } = subtitle;
            if (text.match(/^\[.*\]$/)) {
                text = null;
            }
            if (text !== null) {
                text = text.replace(/♪/g, '').trim();
                text = text.toLowerCase().replace(/(^\w)|(\.\s*\w)|(\?\s*\w)|(\!\s*\w)/g, match => match.toUpperCase());
            }

            return { start, end, text };
        })
        .filter(subtitle => subtitle.text !== null && subtitle.text !== "");
}

async function scrapYoutube(url, e) {
    try {
        const response = await scrap(url)
        let textData = await response.text();
        if (!e) {
            textData = filterYoutubeScrap(textData)
        }
        return textData
    } catch (e) {
        console.log(e)
        return { error: 'call_error' }
    }
}

async function getNativeSubtitles(videoId, html) {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await requestSubtitles(videoId, html)
            xml2js.parseString(data, { trim: true }, (err, result) => {
                if (err) {
                    return resolve({ error: 'transform_error', xml: data })
                } else {
                    try {
                        const transformed = result?.transcript?.text.map(item => ({
                            text: item._,
                            start: parseFloat(item.$.start),
                            end: parseFloat(item.$.dur) + parseFloat(item.$.start)
                        }));
                        let jsonSrt = processSubtitles(transformed)
                        resolve({ api: 'youtube', lyrics: jsonSrt, autoGenerated: false })
                    } catch (e) {
                        resolve({ error: 'transform_error', xml: data })
                    }
                }
            });
        } catch (e) {
            resolve(e)
        }
    });
}

const getYoutubeList = async (req) => {
    try {
        const json = await scrapYoutube(`https://www.youtube.com/playlist?list=${req.query.id}`)
        let tracks = []

        const core = json.contents
            ?.twoColumnBrowseResultsRenderer
            ?.tabs?.[0]
            ?.tabRenderer
            ?.content
            ?.sectionListRenderer
            ?.contents?.[0]
            ?.itemSectionRenderer
            ?.contents?.[0]
            ?.playlistVideoListRenderer
            ?.contents;

        core.forEach(video => {
            try {
                tracks.push({
                    api: 'youtube',
                    id: video.playlistVideoRenderer.videoId,
                    poster: video.playlistVideoRenderer.thumbnail.thumbnails[0].url,
                    title: video.playlistVideoRenderer.title.runs[0].text,
                    artist: video.playlistVideoRenderer.shortBylineText.runs[0].text,
                    artist_id: video.playlistVideoRenderer?.shortBylineText.runs?.[0].browseEndpoint?.browseId,
                })
            } catch (e) {

            }
        });

        const data = {
            api: 'youtube',
            owner: {
                id: json.header?.playlistHeaderRenderer?.ownerText.runs[0]?.navigationEndpoint?.browseEndpoint?.browseId,
                name: json.header?.playlistHeaderRenderer?.ownerText.runs[0]?.text,
                image: tracks[0]?.poster
            },
            name: json.header?.playlistHeaderRenderer?.title?.simpleText,
            description: json.header?.playlistHeaderRenderer?.descriptionText,
            tracks_count: json.header?.playlistHeaderRenderer?.numVideosText.runs[0].text,
            tracks: tracks,
            url: json.header?.playlistHeaderRenderer?.ownerText.runs[0]?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl,
        }

        return data
    } catch (e) {
        return { error: e.toString() }
    }
}



function filterYoutubeMusicScrap(textData) {
    const regex = /data: '(.*?)'}\);/gs;
    const matches = [];
    let match;

    while ((match = regex.exec(textData)) !== null) {
        const extractedData = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
        matches.push(extractedData.replace(/\\\\"/g, ''));
    }

    if (matches.length > 0) {
        return matches
    } else {
        return [];
    }
}


const getYotubeMusicList = async (req, res) => {
    try {
        const url = `https://music.youtube.com/playlist?list=${req.query.id}`
        const response = await scrap(url);
        const html = await response.text();
        const main = filterYoutubeMusicScrap(html);
        const rawData = JSON.parse(main[1])

        const playlistId = rawData.contents.twoColumnBrowseResultsRenderer.secondaryContents.sectionListRenderer.contents[0].musicPlaylistShelfRenderer.playlistId;
        const trackItems = rawData.contents.twoColumnBrowseResultsRenderer.secondaryContents.sectionListRenderer.contents[0].musicPlaylistShelfRenderer.contents;
        const playlistTitle = rawData.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].musicResponsiveHeaderRenderer.title.runs[0].text;
        const owner = rawData.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.musicResponsiveHeaderRenderer;
        const ownerName = owner?.straplineTextOne?.runs?.[0]?.text
        const ownerID = owner?.straplineTextOne?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId
        const ownerImage = owner?.straplineThumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails[1]?.url;

        const tracks = trackItems.map(item => {
            const renderer = item.musicResponsiveListItemRenderer;

            const title = renderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
            const artist = renderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text;
            const videoId = renderer.overlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.playNavigationEndpoint.watchEndpoint.videoId;

            const durationText = renderer.overlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.accessibilityPlayData?.accessibilityData?.label || '';

            const durationMatch = durationText.match(/(\d+) minutes, (\d+) seconds/);
            let durationMs = 0;
            if (durationMatch) {
                const minutes = parseInt(durationMatch[1], 10);
                const seconds = parseInt(durationMatch[2], 10);
                durationMs = (minutes * 60 + seconds) * 1000;
            } else {
                durationMs = null
            }

            const poster = renderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails[0].url;
            const posterLarge = renderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails[1] ? renderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails[1].url : poster;

            return {
                api: 'youtube',
                poster,
                posterLarge,
                title,
                artist,
                id: videoId,
                duration: durationMs
            };
        });

        const data = {
            id: playlistId,
            api: 'youtube',
            name: playlistTitle,
            owner: {
                id: ownerID,
                name: ownerName,
                image: ownerImage
            },
            tracks_count: tracks.length,
            tracks
        };

        res.json(data);
    } catch (e) {
        res.json({ error: e.message })
    }
};


const getTrackingParam = (json) => {
    const main = json.contents
        ?.tabbedSearchResultsRenderer
        ?.tabs
        ?.[0]
        ?.tabRenderer
        ?.content
        ?.sectionListRenderer
        ?.header
        ?.chipCloudRenderer
        ?.chips
    let data = {}
    main.forEach(section => {
        const param = section.chipCloudChipRenderer.navigationEndpoint.searchEndpoint.params
        const id = section.chipCloudChipRenderer.uniqueId
        switch (id) {
            case 'Songs':
                data['songs'] = param
                break;
            case 'Videos':
                data['videos'] = param
                break;
            case 'Albums':
                data['albums'] = param
                break;
            case 'Featured playlists':
                data['playlists'] = param
                break;
            case 'Community playlists':
                data['users_playlists'] = param
                break;
            case 'Artists':
                data['artists'] = param
                break;
            case 'Podcasts':
                data['podcasts'] = param
                break;
            case 'Episodes':
                data['episodes'] = param
                break;
            case 'Profiles':
                data['users'] = param;
                break;
        }
    })
    return data
}

const request = async (query, params) => {
    const body = {
        "context": {
            "client": {
                "clientName": "WEB_REMIX",
                "clientVersion": "1.20241111.01.00",
                "acceptHeader": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "timeZone": "Etc/GMT-2"
            }
        },
        "query": query,
        params
    }
    const response = await fetch(`https://music.youtube.com/youtubei/v1/search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': userAgent
        },
        body: JSON.stringify(body)
    })
    const json = await response.json()
    return json
}

function timeToMilliseconds(timeString) {
    const timeParts = timeString.split(":").map(Number);
    let milliseconds = 0;

    if (timeParts.length === 3) {
        const [hours, minutes, seconds] = timeParts;
        milliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;
    } else if (timeParts.length === 2) {
        const [minutes, seconds] = timeParts;
        milliseconds = (minutes * 60 + seconds) * 1000;
    } else {
        console.log(timeString)
    }

    return milliseconds;
}

const filterMenu = (data) => {
    track.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0].navigationEndpoint?.browseEndpoint.browseId
    track.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[2].navigationEndpoint.browseEndpoint.browseId
}

const filterYTMusicTracks = (track) => {
    const duration = timeToMilliseconds(track.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[4].text)
    const ids = filterMenu(track)
    return {
        api: 'youtube',
        id: track.musicResponsiveListItemRenderer.playlistItemData.videoId,
        title: track.musicResponsiveListItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text,
        artist: track.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text,
        artistID: ids.artist,
        poster: track.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails[1].url,
        posterLarge: track.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails[1].url?.split('=')[0] + '=w600-h600-l100-rj',
        duration: duration,
        album: track.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[2].text?.split('(')[0].trim(),
        albumID: ids.album,
    }
}

const filterYTMusicPodcasts = (track) => {
    const artist = track.musicResponsiveListItemRenderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs
    const data = {
        api: 'youtube',
        kind: 'playlist',
        id: track.musicResponsiveListItemRenderer.overlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer.playNavigationEndpoint.watchPlaylistEndpoint.playlistId,
        title: track.musicResponsiveListItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text,
        artist: artist?.[2]?.text || artist?.[0]?.text,
        artistID: artist?.[2]?.navigationEndpoint?.browseEndpoint?.browseId || artist?.[0]?.navigationEndpoint?.browseEndpoint?.browseId,
        poster: track.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails[1].url,
    }
    return data
}

const filterYTMusicArtists = (artist) => {
    const data = {
        api: 'youtube',
        kind: 'artist',
        id: artist.musicResponsiveListItemRenderer?.navigationEndpoint?.browseEndpoint?.browseId,
        name: artist.musicResponsiveListItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text,
        followers: artist.musicResponsiveListItemRenderer.flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[2]?.text?.replace('subscribers', 'followers'),
        poster: artist.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails[1].url,
        posterLarge: artist.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails[1].url?.split('=')[0] + '=w600-h600-l100-rj',
    }

    return data
}


const filterYTMusicEpisodes = (track) => {
    return {
        api: 'youtube',
        kind: 'episode',
        id: track.musicResponsiveListItemRenderer.playlistItemData.videoId,
        title: track.musicResponsiveListItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text,
        poadcast: track.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[2].text,
        poadcastID: track.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[2].navigationEndpoint.browseEndpoint.browseId,
        poster: track.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails[0].url,
    }
}

const filterYoutubeSearch = (data, type) => {
    const sections = data.contents
        ?.tabbedSearchResultsRenderer
        ?.tabs
        ?.[0]
        ?.tabRenderer
        ?.content
        ?.sectionListRenderer
        ?.contents
    let tracks = []
    sections.forEach(section => {
        try {
            const loop = section?.musicShelfRenderer?.contents;
            loop.forEach(track => {
                try {
                    switch (type) {
                        case 'songs':
                            tracks.push(filterYTMusicTracks(track))
                            break;
                        case 'podcasts':
                            tracks.push(filterYTMusicPodcasts(track))
                            break;
                        case 'artists':
                            tracks.push(filterYTMusicArtists(track))
                            break;
                        case 'episodes':
                            tracks.push(filterYTMusicEpisodes(track))
                            break;

                    }
                } catch (e) {
                    console.error(e)
                }
            })
        } catch (e) {
            console.error(e)
        }
    });
    return tracks
}

const youtubeMusicSearch = async (req, res) => {
    try {
        const main = await request(req.query.q)
        const type = req.query.type || 'songs'
        const params = getTrackingParam(main)
        const data = await request(req.query.q, params[type])
        const json = filterYoutubeSearch(data, type)

        res.json(json)
    } catch (e) {
        console.log(e)
        res.json({ error: e.message })
    }
}


const getVideoSections = async (id) => {
    const response = await fetch('https://music.youtube.com/youtubei/v1/next', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': userAgent
        },
        body: JSON.stringify({
            "videoId": id,
            "isAudioOnly": true,
            "context": {
                "client": {
                    "clientName": "WEB_REMIX",
                    "clientVersion": "1.20241106.01.00"
                }
            }
        })
    })
    const data = await response.json();
    const sections = data?.contents
        ?.singleColumnMusicWatchNextResultsRenderer
        ?.tabbedRenderer
        ?.watchNextTabbedResultsRenderer
        ?.tabs
        ?.[0]
        ?.tabRenderer
        ?.content
        ?.musicQueueRenderer
        ?.content
        ?.playlistPanelRenderer
        ?.contents
    let mixID;
    let mixParam;
    sections.forEach(section => {
        try {
            if (section.automixPreviewVideoRenderer) {
                const mix = section
                    ?.automixPreviewVideoRenderer
                    ?.content
                    ?.automixPlaylistVideoRenderer
                    ?.navigationEndpoint
                    ?.watchPlaylistEndpoint
                mixID = mix?.playlistId
                mixParam = mix?.params
            } else if (section.playlistPanelVideoRenderer) {
                mixID = section.menu?.menuRenderer?.items?.[0]?.menuNavigationItemRenderer?.navigationEndpoint?.watchEndpoint?.playlistId
            }
        } catch (e) {
            console.error(e)
        }
    })
    const related = data?.contents
        ?.singleColumnMusicWatchNextResultsRenderer
        ?.tabbedRenderer
        ?.watchNextTabbedResultsRenderer
        ?.tabs
        ?.[2]
        ?.tabRenderer
        ?.endpoint
        ?.browseEndpoint
        ?.browseId
    return { mix: mixID, mixParam, related }
}

const filterTrackNextList = (track) => {
    const duration = timeToMilliseconds(track.playlistPanelVideoRenderer.lengthText.runs[0].text)
    return {
        api: 'youtube',
        id: track.videoId,
        title: track.playlistPanelVideoRenderer.title.runs[0].text,
        artist: track.playlistPanelVideoRenderer.longBylineText.runs[0].text,
        artistID: track.playlistPanelVideoRenderer.longBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId,
        poster: track.playlistPanelVideoRenderer.thumbnail.thumbnails[0].url,
        posterLarge: track.playlistPanelVideoRenderer.thumbnail.thumbnails[2].url,
        duration: duration,
    }
}

const getPlaylistQueue = async (id, params) => {
    const response = await fetch('https://music.youtube.com/youtubei/v1/next', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': userAgent
        },
        body: JSON.stringify({
            "playlistId": id,
            "params": params,
            "isAudioOnly": true,
            "context": {
                "client": {
                    "clientName": "WEB_REMIX",
                    "clientVersion": "1.20241106.01.00",
                    "clientFormFactor": "UNKNOWN_FORM_FACTOR"
                }
            }
        })
    })
    const data = await response.json();
    const tracksRaw = data.contents
        ?.singleColumnMusicWatchNextResultsRenderer
        ?.tabbedRenderer
        ?.watchNextTabbedResultsRenderer
        ?.tabs
        ?.[0]
        ?.tabRenderer
        ?.content
        ?.musicQueueRenderer
        ?.content
        ?.playlistPanelRenderer
        ?.contents
    const tracks = []
    tracksRaw.forEach(track => {
        try {
            tracks.push(filterTrackNextList(track))
        } catch (e) {
            console.error(e)
        }
    })
    return tracks

}

const filterTrackRelated = (track) => {
    return {
        api: 'youtube',
        id: track.musicResponsiveListItemRenderer.playlistItemData.videoId,
        title: track.musicResponsiveListItemRenderer.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text,
        artist: track.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text,
        artistID: track.musicResponsiveListItemRenderer.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0].navigationEndpoint.browseEndpoint.browseId,
        poster: track.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails[1].url,
        posterLarge: track.musicResponsiveListItemRenderer.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails[1].url?.split('=')[0] + '=w600-h600-l100-rj',
        album: track.musicResponsiveListItemRenderer.flexColumns[2].musicResponsiveListItemFlexColumnRenderer.text.runs[0]?.text?.split('(')[0].trim(),
        albumID: track.musicResponsiveListItemRenderer.flexColumns[2].musicResponsiveListItemFlexColumnRenderer.text.runs[0]?.navigationEndpoint.browseEndpoint.browseId,
    }
}

const filterRelatedArtists = (artist) => {
    const data = {
        api: 'youtube',
        kind: 'artist',
        id: artist.musicTwoRowItemRenderer?.navigationEndpoint?.browseEndpoint?.browseId,
        name: artist.musicTwoRowItemRenderer.title.runs[0].text,
        followers: artist.musicTwoRowItemRenderer.subtitle.runs?.[0]?.text?.replace('subscribers', 'followers'),
        poster: artist.musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails[0].url,
        posterLarge: artist.musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails[1].url,
    }

    return data
}

const requestBrowse = async (id) => {
    const response = await fetch('https://music.youtube.com/youtubei/v1/browse', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': userAgent
        },
        body: JSON.stringify({
            "context": {
                "client": {
                    "clientName": "WEB_REMIX",
                    "clientVersion": "1.20241106.01.00",
                    "clientFormFactor": "UNKNOWN_FORM_FACTOR"
                }
            },
            "browseId": id
        })
    })
    const data = await response.json();
    return data
}

const getYTMusicRelated = async (id) => {
    const data = await requestBrowse(id)
    const sections = data.contents
        ?.sectionListRenderer
        ?.contents
        ?.[0]
        ?.musicCarouselShelfRenderer
        ?.contents
    const artistsRaw = data.contents
        ?.sectionListRenderer
        ?.contents
        ?.[1]
        ?.musicCarouselShelfRenderer
        ?.contents
    const about = data?.contents
        ?.sectionListRenderer
        ?.contents
        ?.[2]
        ?.musicDescriptionShelfRenderer
        ?.description
        ?.runs
        ?.[0]
        ?.text
    const artists = []
    artistsRaw.forEach(artist => {
        try {
            artists.push(filterRelatedArtists(artist))
        } catch (e) {
            console.error(e)
        }
    })
    const tracks = []
    sections.forEach(section => {
        try {
            tracks.push(filterTrackRelated(section))
        } catch (e) {
            console.error(e)
        }
    })
    return { artists, tracks, about }
}


const youtubeMusicRelated = async (req, res) => {
    try {
        const params = await getVideoSections(req.query.id)
        const [list, related] = await Promise.all([
            getPlaylistQueue(params.mix, params.mixParam),
            getYTMusicRelated(params.related)
        ])
        res.json({ list, related })
    } catch (e) {
        console.log(e)
    }
}


const getArtist = async (req, res) => {
    try {
        const data = await requestBrowse(req.query.id);
        res.json(data)
    } catch (e) {
        console.error(e)
        res.json({error: e.message})
    }
}

module.exports = {
    youtubeMusicSearch,
    getYotubeMusicList,
    scrapYoutube,
    getVideoId,
    getYoutubeList,
    filterYoutube,
    youtubeMusicRelated,
    getArtist,
    getNativeSubtitles
}