const { getSoundcloudSingleTrack } = require('./soundcloud')
const { getAnghamiTrack } = require('./handler')

async function getAlbumData(id, e) {
    const response = await fetch(`https://api.onvo.me/music/apple/album?id=${id}`)
    const data = await response.json()
    return (e ? data.tracks[0] : data)
}

async function getAppleTrack(id, e) {
    const response = await fetch(`https://api.onvo.me/music/apple/track?ids=${id}`)
    const data = await response.json()
    return (e ? data[0] : data)
}

async function getSpotifyTrack(id, e) {
    const response = await fetch(`https://api.onvo.me/music/spotify/track?ids=${id}`)
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
            data = await getSoundcloudSingleTrack(id, 'id')
            break;
        case 'spotify':
            data = await getSpotifyTrack(id, true)
            break;
        case 'anghami':
            const track = await getAnghamiTrack(id)
            data = track.track
            break;
    }
    return data;
}

module.exports = {
    getTracksData
}