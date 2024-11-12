
let fetch;
(async () => {
    fetch = (await import('node-fetch')).default;
})();


let SOUNDCLOUD_CLIENT = 'T9frtmUVGsxBucS3jqGV9A8lsB3MAO47';

const scrap = async (url) => {
    return fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        redirect: 'follow',
    });
}

const scrapSouncloud = async (url) => {
    try {
        const response = await scrap(url);
        const html = await response.text();
        const regex = /<script>window.__sc_hydration = (.*?);<\/script>/s;
        const match = html.match(regex);

        if (match && match[1]) {
            return JSON.parse(match[1]);
        } else {
            return { error: 'no_data' };
        }
    } catch (error) {
        return { error: error.message };
    }
};


const getSoundListTracks = async (data, with_tracks, offset = 0, limit = 20, client_id) => {
    let tracks = [];
    let tracksIds = []
    let pendingTracks = []

    data.slice(offset, offset + limit).forEach(track => {
        try {
            if (with_tracks) {
                if (track.artwork_url) {
                    tracks.push(trackScrap(track));
                } else if ((tracks.length + pendingTracks.length) < limit) {
                    pendingTracks.push(track.id);
                }
            } else {
                tracks.push(track.id);
            }
        } catch (e) {
            console.log(e)
        }
    });

    data.forEach(track => {
        tracksIds.push(track.id)
    })

    if (pendingTracks.length > 0 && with_tracks) {
        await appendSoundTracks(pendingTracks, client_id, tracks, client_id)
    }
    return with_tracks ? tracks : tracksIds
}

const getSoundcloudList = async (req) => {
    let { offset = 0, url, id, with_tracks, limit = 25, type = 'native', client_id = SOUNDCLOUD_CLIENT } = req.query
    let playlist = {}

    if (type == 'url') {
        const list = await scrapSouncloud(url)
        list.forEach(element => {
            if (element.hydratable == 'playlist') {
                playlist = element.data
            }
        });
    } else {
        url = `https://api-v2.soundcloud.com/playlists/${id}?representation=full&client_id=${client_id}`
        const response = await scrap(url)
        playlist = await response.json()
    }

    if (!client_id) {
        return { error: 'missing_client_id' }
    }

    let tracks = await getSoundListTracks(playlist.tracks, with_tracks, offset, limit, client_id)

    const data = {
        api: 'soundcloud',
        id: playlist.id,
        name: playlist.title,
        tracks_count: playlist.track_count,
        likes: playlist.likes_count,
        duration: playlist.duration,
        genre: playlist.genre,
        url: playlist.permalink_url,
        owner: soundcloudUser(playlist.user),
        tracks: tracks,
    }

    return data
}

function trackScrap(track) {
    const isOrignal = track.user?.verified == true || track.user?.creator_mid_tier;
    return {
        api: 'soundcloud',
        id: track.id,
        title: track.title,
        poster: track.artwork_url,
        genre: track.genre,
        slug: track.permalink_url,
        artist: track.publisher_metadata?.artist || track.user.username,
        album: track.publisher_metadata?.album_title,
        copyright: track.publisher_metadata?.p_line_for_display || track.publisher_metadata?.c_line_for_display,
        wave: track.waveform_url,
        duration: track.full_duration,
        genre: track.genre,
        lable: track.label_name,
        likes: track.likes_count,
        artist_data: {
            id: isOrignal ? track.user?.id : track.publisher_metadata?.id,
            name: track.user?.username,
            image: track.user?.avatar_url,
            verified: track.user?.badges.verified,
            followers: track.user?.followers_count,
            location: track.user?.city,
            contry: track.user?.country_code
        },
        ...filterAudio(track.media)
    }
}

const getSoundcloudSingleTrack = async (data, method = 'url', client_id = SOUNDCLOUD_CLIENT) => {
    try {
        if (method == 'native') {
            const streamResponse = await fetch(`${data}?client_id=${client_id}`);
            const streamData = await streamResponse.json();
            return {
                audio: streamData.url,
            };
        }
        const resolveUrl = `https://api-v2.soundcloud.com/${method == 'id' ? `tracks/${data}?` : `resolve?url=${encodeURIComponent(data)}&`}client_id=${SOUNDCLOUD_CLIENT}`;
        const response = await fetch(resolveUrl);
        const trackData = await response.json();

        if (!trackData.media || !trackData.media.transcodings) {
            throw new Error("Invalid response from SoundCloud API.");
        }
        let transcodingUrl = trackScrap(trackData)

        if (transcodingUrl === null) {
            throw new Error("No progressive stream found.");
        }

        const streamResponse = await fetch(`${transcodingUrl.url}?client_id=${client_id}`);
        const streamData = await streamResponse.json();

        return {
            ...transcodingUrl,
            audio: streamData.url
        };

    } catch (error) {
        console.log(error)
        return { error: error.message };
    }
};


const getSoundRelated = async (req) => {

    let { id, offset = 0, client_id = SOUNDCLOUD_CLIENT } = req.query

    if (!id) {
        return { error: 'missing_id' }
    }

    try {
        const resolveUrl = `https://api-v2.soundcloud.com/tracks/${id}/related?client_id=${client_id}&offset=${offset}&limit=20&app_locale=en`
        const response = await fetch(resolveUrl);
        const data = await response.json();
        const filter = [];
        data.collection.forEach(component => {
            try {
                filter.push(trackScrap(component))
            } catch (e) {
                console.log(e);
            }
        });
        return filter;
    } catch (e) {
        return { error: e.toString() }
    }
}


const getSoundCloudTrackUrl = async (trackUrl, client_id = SOUNDCLOUD_CLIENT) => {
    try {
        const resolveUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(trackUrl)}&client_id=${SOUNDCLOUD_CLIENT}`;
        const response = await fetch(resolveUrl);
        const trackData = await response.json();

        if (!trackData.media || !trackData.media.transcodings) {
            return { error: ("Invalid response from SoundCloud API.") };
        }

        let transcodingUrl = null;
        for (let transcoding of trackData.media.transcodings) {
            if (transcoding.format.protocol === 'progressive') {
                transcodingUrl = transcoding.url;
                break;
            }
        }

        if (!transcodingUrl) {
            return { error: ("No progressive stream found.") };
        }

        const streamResponse = await fetch(`${transcodingUrl}?client_id=${client_id}`);
        const data = await streamResponse.json()
        return { url: data.url };
    } catch (error) {
        return { error: error.message };
    }
};

const filterAudio = (data) => {
    let bestAudio = null;
    let protocol = null;
    for (let audio of data.transcodings) {
        if (audio.format?.protocol === "hls") {
            return { url: audio.url, protocol: "hls" };
        }
    }
    for (let audio of data.transcodings) {
        if (audio.format?.protocol === "progressive") {
            bestAudio = audio.url;
            protocol = "progressive";
            break;
        }
    }
    return { url: bestAudio, protocol };
};
const getSoundcloudTracksById = async (ids, client_id = SOUNDCLOUD_CLIENT) => {
    if (!client_id) {
        return { error: 'missing_client_id' }
    }
    let tracks = []
    await appendSoundTracks(ids, client_id, tracks)
    return tracks
}
const getSoundcloudTracks = async (dir = 'trending', req) => {
    try {
        let { client_id = SOUNDCLOUD_CLIENT } = req.query
        if (dir == 'related') {
            return getSoundRelated(req)
        }
        let { offset = 0, q } = req.query
        const query = q
        const genere = 'all-music'

        const resolveUrl = `https://api-v2.soundcloud.com/${dir == 'search' ? 'search/tracks' : 'charts'}?client_id=${client_id}${dir == 'trending' ? `&genre=soundcloud:genres:${genere}&kind=top` : `&q=${query}`}&offset=${offset}&limit=25&linked_partitioning=1`;
        const response = await fetch(resolveUrl);
        const data = await response.json();
        const filter = [];
        data.collection.forEach(component => {
            try {
                filter.push(trackScrap(dir == 'search' ? component : component.track))
            } catch (e) {
                console.log(e);
            }
        });

        return filter;
    } catch (error) {
        return { error: error.message };
    }
};

const appendSoundTracks = async (tracksId, client_id, tracks) => {
    const response = await fetch(`https://api-v2.soundcloud.com/tracks?ids=${tracksId.join(',')}&client_id=${client_id}`)
    const data = await response.json()
    data.forEach(track => {
        tracks.push(trackScrap(track))
    })
}

const soundcloudUser = (user) => {
    return {
        id: user.id,
        name: user.username,
        image: user.avatar_url,
        followers: user.followers_count,
        verified: user.verified,
        bio: user.description
    }
}

async function soundcloudDiscovery(req) {
    let { offset = 0, limit = 20, client_id = SOUNDCLOUD_CLIENT } = req.query
    const response = await scrap(`https://api-v2.soundcloud.com/mixed-selections?variant_ids=&client_id=${client_id}&limit=${limit}&offset=${offset}&linked_partitioning=1`);
    const data = await response.json();
    let home = [];
    data.collection.forEach(section => {
        let data = []
        section.items.collection.forEach(item => {
            data.push({
                id: item.id,
                duration: item.duration,
                poster: item.artwork_url,
                likes: item.likes_count,
                tracks_count: item.track_count,
                url: item.permalink_url,
                reposts: item.reposts_count,
                title: item.title,
                owner: soundcloudUser(item.user)
            })
        })
        home.push({
            title: section.title,
            data: data
        })
    })
    return home
}

const getSoundcloudTrendingTracks = async (genre = 'all-music', offset = 0, limit = 25, client_id = SOUNDCLOUD_CLIENT) => {
    try {
        if (!client_id) {
            return { error: 'missing_client_id' }
        }
        const resolveUrl = `https://api-v2.soundcloud.com/charts?client_id=${client_id}&genre=soundcloud:genres:${genre}&kind=top&limit=${limit}&offset=${offset}`;
        console.log(resolveUrl)
        const response = await fetch(resolveUrl);
        const data = await response.json();
        const filter = [];
        data.collection.forEach(component => {
            try {
                filter.push(trackScrap(component.track))
            } catch (e) {
                console.log(e);
            }
        });

        return filter;
    } catch (error) {
        return { error: error.message };
    }
};


const soundcloudThread = (req, res) => {
    const { client_id } = req.query;
    SOUNDCLOUD_CLIENT = client_id
    res.json({ status: 'success' })
}

module.exports = {
    getSoundcloudSingleTrack,
    soundcloudThread,
    getSoundcloudTrendingTracks,
    soundcloudDiscovery,
    getSoundcloudTracks,
    getSoundCloudTrackUrl,
    getSoundRelated,
    getSoundcloudList,
    getSoundListTracks,
    getSoundcloudTracksById
}
