
const cheerio = require('cheerio');
let fetch;

(async () => {
    fetch = (await import('node-fetch')).default;
})();

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

const createSpotifyUrl = (playlistId, offset = 0, limit = 100, version = 1, sha256Hash = 'a5a14254b4f14d0c360ff1987fe484a71ed4d5d8f5133181f303d58bfd2f50a5') => {
    // Decode the base URL to work with its query parameters
    const baseUrl = 'https://api-partner.spotify.com/pathfinder/v1/query';
    const params = {
        operationName: 'fetchPlaylistContents',
        variables: {
            uri: `spotify:playlist:${playlistId}`,
            offset: offset,
            limit: limit,
        },
        extensions: {
            persistedQuery: {
                version: version,
                sha256Hash: sha256Hash,
            },
        },
    };

    const queryParams = new URLSearchParams({
        operationName: params.operationName,
        variables: JSON.stringify(params.variables),
        extensions: JSON.stringify(params.extensions),
    });

    return `${baseUrl}?${queryParams.toString()}`;
};


const filterSpotifyTracks = (tracksRaw) => {
    let tracks = []
    tracksRaw.forEach(track => {
        const raw = track.itemV2.data
        tracks.push({
            api: 'spotify',
            id: raw.uri.replace('spotify:track:', ''),
            title: raw.name,
            artist: raw.artists.items.map(artist => { return artist.profile.name }).join(', '),
            poster: raw.albumOfTrack.coverArt.sources[1].url,
            posterLarge: raw.albumOfTrack.coverArt.sources[2].url,
            duration: raw.trackDuration.totalMilliseconds,
            play_count: raw.playcount,
            album: raw.albumOfTrack.name,
            albumID: raw.albumOfTrack.uri.replace('spotify:album:', ''),
        })
    });
    return tracks
}

const filterSpotifyList = (id, data, info) => {
    const tracksRaw = data.data.playlistV2.content.items
    const tracks = filterSpotifyTracks(tracksRaw)
    if (tracks.length == 0) {
        return {
            tracks: []
        }
    }
    const owner = tracksRaw[0]?.addedBy?.data || {}
    return {
        api: 'spotify',
        id: id,
        owner: {
            id: owner?.username,
            name: owner?.name,
            image: owner.avatar?.sources[1].url
        },
        name: info.name,
        description: info.description,
        tracks_count: info.tracks_count,
        tracks: tracks
    }
}

let ongoingList = {}

const getPlaylist = async (req) => {
    try {
        const id = req.query.id
        let token = ''
        let meta = {}
        if (ongoingList.id !== id) {
            const body = await scrap(`https://open.spotify.com/playlist/${id}`)
            const html = await body.text()
            const $ = cheerio.load(html);
            token = JSON.parse($('#session').text()).accessToken
            ongoingList.token = token
            ongoingList.id = id
            meta = JSON.parse($('script[type="application/ld+json"]').text())
            const tracks_count = $('meta[name="music:song_count"]').attr('content')
            meta.tracks_count = parseInt(tracks_count)
            ongoingList.meta = meta
        } else {
            meta = ongoingList.meta
            token = ongoingList.token
            console.log('cachinggg')
        }
        const url = createSpotifyUrl(req.query.id, (parseInt(req.query.offset) || 0), parseInt(req.query.limit) || 100)
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        const data = await response.json()
        const json = filterSpotifyList(id, data, meta)
        return json
    } catch (e) {
        ongoingList = {}
        return e
    }
}

module.exports = { getPlaylist }