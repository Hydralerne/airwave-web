
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


const cheerio = require('cheerio');


const anghamiScrapHandler = async (url, id) => {
    let json = '{"tracks": []}'
    let more = {};

    try {
        if (!url && id) {
            url = `https://play.anghami.com/playlist/${id}`
        }
        const response = await scrap(url)
        const textData = await response.text();
        const $ = cheerio.load(textData);

        try {
            const scriptContent = $('script[id=anghami-web-v2-state][type=application/json]').html();
            const decodedContent = scriptContent.replace(/&q;/g, '"').replace(/&a;/g, '&');
            more = decodedContent;
        } catch (e) {
            console.log(e)
        }
        json = $('script[type="application/ld+json"]').last().html();
    } catch (e) {
        console.log(e)
    }

    json = JSON.parse(json);
    let info = {}
    try {
        info = JSON.parse(more);
    } catch (e) {
        console.log(e)
    }
    return { json, info }
}

const anghamiTracks = (json, isTrack) => {
    const tracks = []
    json.forEach((song, index) => {
        tracks.push(anghamiTrack(song))
    })
    return tracks
}
const getAnghamiPlaylistId = (url) => {
    const regex = /https?:\/\/(?:play\.)?anghami\.com\/playlist\/(\d+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

const anghamiTrack = (song) => {
    return {
        api: 'anghami',
        id: song.id,
        album: song.album,
        albumID: song.albumID,
        artist: song.artist,
        artist_data: {
            id: song.artistID,
            image: `https://artwork.anghcdn.co/webp/?id=${song.ArtistArt}&size=296`,
            name: song.artist,
            verified: true
        },
        title: song.title,
        poster: `https://artwork.anghcdn.co/webp/?id=${song.coverArt}&size=296`,
        posterLarge: `https://artwork.anghcdn.co/webp/?id=${song.coverArt}`,
        genre: song.genre,
        hexcolor: song.hexcolor,
        releasedate: song.releasedate,
        year: song.year,
        likes: song.likes,
        plays: song.plays,
        video: song.videoid
    }
}

const getAnghamiTrack = async (id) => {
    const url = `https://play.anghami.com/song/${id}`
    let { info } = await anghamiScrapHandler(url, id)
    let coreData = info[Object.keys(info)[0]]
    const related = anghamiTracks(coreData.body?.sections?.[0]?.data)
    const track = anghamiTrack(coreData.body)
    return {
        related, track
    }

}

const getAnghamiList = async (id) => {
    const url = `https://play.anghami.com/playlist/${id}`
    let { json, info } = await anghamiScrapHandler(url, id)
    let ids = [];
    let coreData = {}

    try {
        coreData = info[Object.keys(info)[0]]
        ids = coreData.body?.songorder?.split(',')
    } catch (e) {
        console.log(e);
    }

    let loop = json.track

    const tracks = [];

    loop.forEach((track, index) => {
        tracks.push({
            api: 'anghami',
            id: ids[index],
            title: track.name,
            artist: track.byArtist.name,
            artist_link: track.byArtist['@id'],
            album: track.inAlbum['name'],
            album_url: track.inAlbum['@id'],
            poster: track.image,
            slug: `https://play.anghami.com/song/${ids[index]}`
        })
    });
    return {
        api: 'anghami',
        id: getAnghamiPlaylistId(json['@id']),
        owner: {
            id: coreData?.body.OwnerID,
            fbid: coreData?.body.fbid,
            name: coreData?.body.OwnerName,
            image: coreData?.body.OwnerPicture
        },
        name: json.name,
        description: json.description,
        tracks_count: json.numtracks,
        tracks: tracks,
        url: json.url
    }
}


const anghamiHandler = async (req) => {
    try {
        if ((req.params.endpoint == 'related' || req.params.endpoint == 'track')) {
            const track = await getAnghamiTrack(req.params.id, req.params.endpoint || req.query.id)
            return track
        } else if (req.params.endpoint == 'playlist') {
            const list = await getAnghamiList(req.params.id || req.query.id)
            return list
        } else if (req.params.endpoint == 'search') {
            const response = await fetch(`https://coussa.anghami.com/rest/v2/GETSearchResults.view?language=en&query=${req.query.q}&page=0&filter_type=${req.query.filter || 'song'}&simple_results=true`);
            const search = await response.json()
            const json = search.sections[0].data
            const tracks = anghamiTracks(json)
            return tracks;
        }
        return { error: 'no_type' }
    } catch (e) {
        console.log(e)
        return { error: e.message }
    }
}


const filterSectionItem = (data, e) => {
    let songs = []
    data.forEach(song => {
        songs.push({
            api: 'apple',
            kind: song.contentDescriptor?.kind,
            id: song.contentDescriptor?.identifiers.storeAdamID,
            albumID: song.contentDescriptor?.albumID,
            poster: getImage(song.artwork.dictionary.url, 200, 200),
            posterLarge: getImage(song.artwork.dictionary.url, 600, 600),
            title: song.accessibilityLabel,
            artist: e ? e : song.subtitleLinks?.[0].title,
        })
    })
    return songs
}

const filterRelated = (data) => {
    // return data
    const sectionsRaw = data[0].data.sections
    let sections = {}
    sectionsRaw.forEach(section => {
        if (section.id == 'more-by-artist - more-by-artist') {
            sections.byArtist = filterSectionItem(section.items, sectionsRaw[0]?.items?.[0]?.artistLinks?.[0]?.title || sectionsRaw[0]?.items?.[0]?.subtitleLinks?.[0]?.title)
        }
        if (section.id == 'you-might-also-like - you-might-also-like') {
            sections.related = filterSectionItem(section.items)
        }
    })
    return sections
}

const getAppleRelated = async (req, res) => {
    try {
        let url
        if (req.query.slug) {
            url = decodeURIComponent(req.query.slug)
        } else {
            url = `https://music.apple.com/us/${req.query.album ? 'album' : 'song'}/${req.query.id || req.query.album}`
        }
        console.log(url)
        const response = await scrap(url)
        const html = await response.text()
        const $ = cheerio.load(html)
        const script = $('#serialized-server-data').html();
        const raw = JSON.parse(script)
        const data = filterRelated(raw);
        res.json(data)
    } catch (e) {
        console.log(e)
        res.json(e)
    }

}
function getImage(url, width, height, format = 'jpg', color = "bb") {
    const newUrl = url
        .replace(/{w}/, width)
        .replace(/{h}/, height)
        .replace(/{c}/, color)
        .replace(/{f}/, format);

    return newUrl;
}
const appleHomeTrack = (song) => {
    return {
        api: 'apple',
        id: song.contentDescriptor?.identifiers?.storeAdamID,
        title: song.title || song.titleLinks?.[0]?.title,
        artist: song.artistName || song.subtitleLinks?.[0]?.title,
        poster: getImage(song.artwork.dictionary.url, 200, 200),
        posterLarge: getImage(song.artwork.dictionary.url, 600, 600),
        slug: song.contentDescriptor.url,
        kind: song.contentDescriptor.kind,
    };
};

const filteredHome = (data) => {
    const sectionsRaw = data?.[0]?.data?.sections
    let sections = []
    let newest = []
    let cards = []
    sectionsRaw.forEach(data => {
        if (data.itemKind == 'flowcaseLockup') {
            data.items.forEach(core => {
                cards.push({
                    title: core.title,
                    description: core.description,
                    poster: getImage(core.artwork.dictionary.url, 2500, 1550, 'webp'),
                    heading: core.heading,
                    type: core.contentDescriptor.kind,
                    id: core.contentDescriptor.identifiers.storeAdamID,
                    url: core.contentDescriptor.url
                })
            })
        }
        if (data.itemKind == 'trackLockup') {
            let newestSection = {
                title: data.header.item.titleLink.title,
                tracks: []
            }
            data.items.forEach(track => {
                newestSection.tracks.push(appleHomeTrack(track))
            });
            newest.push(newestSection)
        }
        if (data.itemKind == 'squareLockup') {
            let newestSection = {
                title: data.header.item.titleLink.title,
                tracks: []
            }
            data.items.forEach(track => {
                newestSection.tracks.push(appleHomeTrack(track))
            });
            sections.push(newestSection)
        }
    })
    return {
        cards,
        newest,
        sections
    }
}

const getAppleHome = async (req, res) => {
    try {
        const region = req.query.region || 'eg'
        const response = await scrap(`https://music.apple.com/${region}/new`)
        const html = await response.text()
        const $ = cheerio.load(html)
        const script = $('#serialized-server-data').html();
        const raw = JSON.parse(script)
        const data = filteredHome(raw);
        res.json(data)
    } catch (e) {
        console.log(e)
        res.json({ error: e.message })
    }
}

module.exports = { getAppleHome, anghamiHandler, scrap, getAppleRelated,getAnghamiTrack }
