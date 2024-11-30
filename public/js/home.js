
if (typeof Android !== 'undefined') {
    document.body.classList.add('android')
} else if (window.webkit?.messageHandlers) {
    document.body.classList.add('ios')
}

function formatName(word) {
    if (!word) return '';

    word = word.toLowerCase();
    if (word === 'hiphop') {
        return 'Hip Hop';
    } else if (word === 'rnb') {
        return 'RNB';
    } else {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }
}


const getInitialArtists = async (q = 'genre:pop', country = 'Eg') => {
    const accessToken = await ajaxTokenSpotify()

    try {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=artist&market=${country}&limit=50`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        if (response.status === 401 || response.status === 401) {
            ajaxTokenSpotify(true)
        }
        const data = await response.json()

        const artists = data.artists.items.map(artist => ({
            id: artist.id,
            name: artist.name,
            genres: artist.genres,
            followers: artist.followers.total,
            image: artist.images[0]?.url,
            external_url: artist.external_urls.spotify,
        }));

        return artists.length > 0 ? artists : { message: 'No artists found' };
    } catch (error) {
        console.error(error);
    }
};

let homeData;

async function getHome() {
    if (homeData) {
        return homeData;
    }
    try {
        const info = { status: 'true', fcm: localStorage.getItem('notitoken'), osVersion: localStorage.getItem('osVersion'), deviceManufacturer: localStorage.getItem('deviceManufacturer'), androidID: localStorage.getItem('androidID'), deviceModel: localStorage.getItem('deviceModel'), version: version, url: window.location.href, page: window.location.host, path: window.location.pathname, query: window.location.search }
        const response = await fetch('https://api.onvo.me/music/home', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getToken()}`
            },
            body: JSON.stringify(info)
        })
        const data = await response.json();
        homeData = data;
        return data;
    } catch (e) {
        goOffline();
        return
    }
}

function getShffledArray(arr, numValues = 4) {
    let shuffled = arr.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, numValues);
}

let mvhot;

function updateListSlider() {
    if (!mvhot) {
        mvhot = new Swiper('.main-playlists', {
            effect: 'coverflow',
            slidesPerView: 'auto',
            centeredSlides: true,
            grabCursor: true,
            pagination: {
                el: '.indecator-playlist',
                dynamicBullets: true,
                dynamicMainBullets: 5
            },
            coverflowEffect: {
                slideShadows: true,
                rotate: 20,
                stretch: 0,
                depth: 300,
                modifier: 1,
            },
        });
    } else {
        mvhot.update();
    }
    mvhot.slideTo(4)
}

const playlistsPage = document.querySelector('.playlists-page')
const musicSection = document.querySelector('.music-section')
let loadingList = false;
let doneloadList
playlistsPage.addEventListener('scroll', async function () {
    if (!loadingList && currentList.id) {
        if (this.scrollTop > (musicSection.offsetHeight - 500) && !doneloadList) {
            try {
                loadingList = true
                let loaders = ''
                for (i = 0; i <= 10; i++) {
                    loaders += songLoaderEffect;
                }
                musicSection.insertAdjacentHTML('beforeend', loaders)
                const { tracks } = await performTracks(currentList.id, currentList.api, currentList.userid, listOffset, 50)
                listOffset += tracks.length
                let { html } = printSongsRegular(tracks, tracks.length)
                musicSection.insertAdjacentHTML('beforeend', html)
                loadingList = false
                if (listOffset == currentList.tracks_count || tracks.length == 0) {
                    doneloadList = true
                }
            } catch (e) {
                loadingList = false
                console.error(e)
            }
            musicSection.querySelectorAll('.loader-music').forEach(loader => { loader.remove() })
        }
    }
})


let currentList = {}
let listOffset = 0

async function performTracks(id, type, userid, offset = listOffset, limit = 25) {
    let list, tracks;
    if (type == 'wave') {
        list = await fetchList(id, type, userid, offset)
        tracks = list.tracks
        if (Array.isArray(currentList.tracks) && currentList.tracks?.length > 0) {
            currentList.tracks.push(...tracks)
        } else {
            currentList = list
            currentList.tracks = tracks
        }
        if (list.owner) {
            currentList = list
        }
    } else if (type == 'spotify') {
        list = await getSpotifyList(id, offset, limit)
        tracks = list.tracks
        if (Array.isArray(currentList.tracks) && currentList.tracks?.length > 0) {
            currentList.tracks.push(...tracks)
        } else {
            currentList = list
            currentList.tracks = tracks
        }
    } else if (type == 'soundcloud') {
        list = await getSoundcloudList(id, limit, offset, true)
        tracks = list.tracks
        currentList = list
        if (Array.isArray(currentList.tracks) && currentList.tracks?.length > 0) {
            currentList.tracks.push(...tracks)
        } else {
            currentList = list
            currentList.tracks = tracks
        }
    } else if (type == 'apple') {
        if (currentList.id !== id) {
            list = await getApplePlaylist(id, limit, offset, true)
            if (list.tracks.length > 50) {
                tracks = list.tracks.slice(0, 50)
            } else {
                tracks = list.tracks
            }
            currentList = list
        } else {
            list = currentList;
            tracks = currentList.tracks.slice(offset, offset + limit);
        }
    } else if (type == 'anghami') {
        if (currentList.id !== id) {
            list = await callAnghami(`?id=${id}`, 'playlist')
            if (list.tracks?.length > 50) {
                tracks = list.tracks.slice(0, 50)
            } else {
                tracks = list.tracks
            }
            currentList = list
        } else {
            list = currentList;
            tracks = currentList.tracks.slice(offset, offset + limit);
        }
    } else if (type == 'youtube') {
        if (currentList.id !== id) {
            list = await fetchYoutubeList(id)
            console.log(list)
            if (list.tracks?.length > 50) {
                tracks = list.tracks.slice(0, 50)
            } else {
                tracks = list.tracks
            }
            currentList = list
        } else {
            list = currentList;
            tracks = currentList.tracks.slice(offset, offset + limit);
        }
    }

    if (list.api || list.id) {
        currentList.id = id
        currentList.userid = userid
    }

    if (listOffset == 0) {
        listOffset = tracks.length
    }

    return { tracks, list }
}

async function openPlaylist(id, type, userid, public_id) {
    try {
        await closePages()
        const parent = playlistsPage
        parent.classList.remove('hidden');
        await delay(5)
        resetPlayList()
        parent.classList.add('center');
        const { tracks, list } = await performTracks(id, type, userid)

        parent.className = 'playlists-page page center'
        parent.setAttribute('list-id', id)
        parent.setAttribute('list-api', type)
        document.querySelector('.playlist-name-header').innerText = list.name
        document.querySelector('.tracks-numbers-count').innerText = `${list.tracks_count} Tracks`
        let { html, slider } = printSongsRegular(tracks)
        musicSection.innerHTML = html
        document.querySelector('.saved-numbers-count').innerText = list.api == 'soundcloud' ? `${list.likes || 0} Likes` : `12 saved`
        document.querySelector('.duration-numbers-count').innerText = formatRuntime(list.duration) || `1hr 53min`
        document.querySelector('.inset-playlist-posters-slider').innerHTML = slider

        const randomImages = getShffledArray(tracks);

        let listPerview = ''
        let backdropPerview = '';

        randomImages.forEach(random => {
            const posterDetails = filterPosterLarge(random.posterLarge, random.poster)
            listPerview += `<span data-img="${random.poster?.url || random.poster}" style="background-image: url('${(random.poster?.url || random.poster)}')"></span>`;
            backdropPerview += `<div class="playlist-poster" style="background-image: url(${(posterDetails.image)});"></div>`
        })

        document.querySelector('.list-perview section').innerHTML = listPerview
        document.querySelector('.inset-playlist-posters').innerHTML = backdropPerview

        updateListSlider();

        document.querySelector('.user-list-avatar').style.backgroundImage = `url(${list.owner.image})`
        document.querySelector('.playlist-name span').innerText = list.owner.name
        checkListData();
    } catch (e) {
        closePlaylist();
        dialog('Error ouccred', e.message)
    }
}


async function closePlaylist() {
    document.querySelector('.playlists-page').classList.remove('center');
    await delay(200)
    resetPlayList(true)
}

async function checkListData() {
    if (!currentList.response) {
        const response = await fetch(`https://api.onvo.me/music/playlists/${encodeURIComponent(currentList.id)}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getToken()}`
            },
        })
        const data = await response.json()
        currentList.public_id = data.public_id
        currentList.is_saved = data.is_saved
        currentList.total_saved = data.total
        if (data.is_saved) {
            document.querySelector('.save-playlist').classList.add('saved')
        } else {
            document.querySelector('.save-playlist').classList.remove('saved')
        }
        if (currentList.api !== 'soundcloud') {
            document.querySelector('.saved-numbers-count').innerText = `${data.total} Saved`
        }
    }
}

async function showBrowse(el) {
    if (document.body.classList.contains('creating')) {
        el.focus()
        return
    }
    document.body.classList.add('searching')
    window.scrollTo(0, 0)
    document.querySelector('.input-text-search input').focus();
    const response = await fetch('/raw/lists')
    const data = await response.json()
    let html = ''
    Object.entries(data).forEach(([key, value]) => {
        const id = value?.[0]?.id
        html += `<div playlist="${id}" onclick="openPlaylist(this.getAttribute('playlist'),'spotify')" style="background-image: url('/assets/playlists-cover/${key}.webp')" class="list-grid-smash playlist" api="spotify" url=""><span>${formatName(key)}</span></div>`
    })
    document.querySelector('.grid-inset-lists').innerHTML = html
}

function printMessages(data) {
    let threads = '';
    data.forEach(thread => {
        try {
            const message = thread.messages[0]
            const reply = thread.messages[1]
            threads += `
        <div class="thread swiper-slide" dataid="${thread.id}">
            <div class="recommendation">
                <div class="sender-user" onclick="openProfile(this.getAttribute('dataid'))" dataid="${message.sender.id}">
                    <span style="background-image: url('${(message.sender.data.image)}');"></span>
                    <section>
                        <text>${removeEmojis(message.sender.data.fullname)}</text>
                        <a>@${message.sender.data.username}</a>
                        <p style="direction: ${isArabic(message.text) ? 'rtl' : 'ltr'}">${message.text?.length > 0 ? removeEmojis(message.text) : 'Listen to this song'}</p>
                    </section>
                    <div class="more-suggestions-body"></div>
                </div>
                <div class="reccomendation-body song" onclick="playTrack(this)" trackid="${message.media_content.id}" api="${message.media_content.api || 'spotify'}">
                    <div class="reccomendation-poster-image song-poster" data-poster-large="${message.media_content.bimg}" data-poster="${message.media_content.img}" style="background-image: url('${(message.media_content.bimg || message.media_content.img)}');"></div>
                    <div class="hilight-blured-info">
                        <div class="backgrounded-blured-info"></div>
                        <div class="post-play-button"></div>
                        <section class="artist-title">
                            <span>${message.media_content.nm}</span>
                            <a>${message.media_content.art}</a>
                        </section>
                    </div>
                </div>
                <div class="user-replyer" onclick="openProfile(this.getAttribute('dataid'))" dataid="${reply.sender.id}">
                    <span style="background-image: url('${(reply.sender.data.image)}');"></span>
                    <section>
                        <text>${removeEmojis(reply.sender.data.fullname)}</text>
                        <p style="direction: ${isArabic(reply.text) ? 'rtl' : 'ltr'}">${removeEmojis(reply.text)}</p>
                    </section>
                    <div class="like-post-recommend"></div>
                </div>
            </div>
        </div>`
        } catch (e) { console.log(e) }
    });
    return threads
}

function printArtists(artists) {
    let html = ''
    const isSearch = document.body.classList.contains('creating')
    artists.forEach(artist => {
        html += `<div class="artist-element" data-img="${artist.image}" dataid="${artist.id}" onclick="${!isSearch ? `openArtist(this.getAttribute('dataid'),this.getAttribute('api'),this)` : `this.classList.toggle('selected')`}" dataid="${artist.id}"><span style="background-image: url(${(artist.image)})"></span><div class="border-marker"></div><a>${artist.name}</a><div class="marker"></div></div>`
        // getColors(artist.image, 5).then(data => {
        //     const parent = document.querySelector(`.artist-element[dataid="${artist.id}"]`)
        //     parent.querySelector('.border-marker').style.borderColor = data.muted
        //     parent.querySelector('.marker').style.backgroundColor = data.muted
        // });
    });
    return html
}

async function get_artist(artistId) {
    const accessToken = await ajaxTokenSpotify();
    const artistUrl = `https://api.spotify.com/v1/artists/${artistId}`;
    const headers = {
        'Authorization': `Bearer ${accessToken}`
    };

    try {
        const response = await fetch(artistUrl, { headers });
        const data = await response.json()
        return data;
    } catch (error) {
        console.error('Error fetching artist data:', error);
        throw error;
    }
}

async function get_top_tracks(artistId) {
    const accessToken = await ajaxTokenSpotify()
    const url = `https://api.spotify.com/v1/artists/${artistId}/top-tracks`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const data = await response.json();

    const tracks = spotifyTracks(data.tracks, true);
    return tracks
}

async function get_albums(artistId) {
    const accessToken = await ajaxTokenSpotify()
    const url = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=10`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const data = await response.json();
    return data.items;
}


async function getArtist(id) {
    const response = await fetch(`/yt-music/artist?id=${id}`)
    const data = await response.json()
    return data
}


async function openArtist(id, api, el) {
    await closePages()
    try {
        draggablePlayer.closeMenu()
    } catch (e) { }
    const page = document.querySelector('.artist-page')
    page.classList.remove('hidden')
    await delay(10);
    page.classList.add('center')
    document.querySelector('.artist-page').scrollTo({
        top: 0,
        behavior: 'smooth'
    })
    resetArtist();
    page.setAttribute('dataid', id)
    if (el) {
        const poster = el.querySelector('span').getAttribute('data-img') || el.getAttribute('data-img')
        const name = el.querySelector('a')?.innerText
        document.querySelector('.artist-back').style.backgroundImage = `url('${poster}')`
        document.querySelector('.artist-name span').innerText = name
        document.querySelector('.artist-follow').setAttribute('dataid', id)
    }

    const data = await getArtist(id)
    if (data.description) {
        document.querySelector('.bio-artist p').innerText = data.description
    }
    console.log(data)
    document.querySelector('.artist-back').style.backgroundImage = `url('${pI(data.poster, true)}')`
    document.querySelector('.artist-name span').innerText = data.name
    document.querySelector('.artist-follow').setAttribute('dataid', data.id)

    let topData = printSongsRegular(data.songs.tracks)
    document.querySelector('.artist-popular').innerHTML = `
    ${topData.html}
    <div class="bottom-rows-trending" onclick="openPlaylist(document.querySelector('.generes-section.selected').getAttribute('dataid'),'spotify')">
            <span>Explore more</span>
        </div>
    `

    try {
        let albumsData = ''
        data.albums.data.forEach(album => {
            albumsData += `
        <div class="list-perview-home" dataid="${album.id}" api="${album.api}" onclick="openAlbum('${album.id}','${album.api}')">
            <div class="list-poster" style="background-image: url('${pI(album.posterLarge, true)}')"></div>
            <section>
                <span>${album.title}</span>
                <div class="lable-list"><a>${album.artist}</a></div>
            </section>
        </div>
        `
        })
        document.querySelector('.inset-albums-popular').innerHTML = albumsData
    } catch (e) {
        console.error(e)
    }
    let artistData = artists(data.artists)
    document.querySelector('.similar-artist-artist').innerHTML = artistData
}

async function get_related_artists(artistId) {
    const accessToken = await ajaxTokenSpotify()
    const url = `https://api.spotify.com/v1/artists/${artistId}/related-artists`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const data = await response.json()

    const artists = data.artists.map(artist => ({
        id: artist.id,
        name: artist.name,
        genres: artist.genres,
        followers: artist.followers.total,
        image: artist.images[0]?.url,
        external_url: artist.external_urls.spotify,
    }));


    return artists.length > 0 ? artists : { message: 'No artists found' };

}


async function createWelcome() {
    document.body.className = 'creating'
    let loading = ''
    for (i = 0; i < 10; i++) {
        loading += loaderArtist
    }
    let welcomePage = `
    <div class="creating-page">
        <div class="container createing-title">
            <span>Follow your favourite artists</span>
        </div>
        <div class="artists-container container">
            <div class="artist-inset container">${loading}</div>
        </div>
        <div class="continue-button-creating container" onclick="initializeAccount(this)">
           <span>Continue</span>
        </div>
    </div>`
    document.body.insertAdjacentHTML('beforeend', welcomePage)
    document.querySelector('.search-home input').setAttribute('placeholder', 'Search for your favourite artist')
    await delay(50)
    const artists = await getInitialArtists()
    let html = printArtists(artists)
    document.querySelector('.artist-inset').innerHTML = html
}

async function importPlaylist() {
    document.body.classList.add('importing-list')
    document.querySelector('.back-replyer-switching').click()
    await delay(200)
    const html = await getImportings(true)
    document.querySelector('.menu-bottom').insertAdjacentHTML('beforebegin', html)
    await delay(50)
    document.querySelector('.importing-page').classList.add('center')

}

async function closeImporting() {
    document.querySelector('.importing-page').classList.remove('center')
    await delay(200)
    document.querySelector('.importing-page').remove()
    document.body.classList.remove('importing-list')
}

function shareFire(dir, header, text = '') {
    let link = ''
    if (dir == "twitter") {
        link = 'https://twitter.com/intent/tweet?text=';
        interface('open', link + encodeURIComponent(text) + '%0A' + encodeURIComponent(header));
    } else if (dir == 'copy') {
        navigator.clipboard.writeText(text + '\n' + header);
    } else if (dir == "facebook") {
        link = 'http://www.facebook.com/sharer.php?u=';
        interface('open', link + encodeURIComponent(header));
    } else if (dir == "whatsapp") {
        interface('open', 'whatsapp://send?text=' + encodeURIComponent(text) + '%0A' + encodeURIComponent(header));
    } else if (dir == "reddit") {
        link = 'https://www.reddit.com/submit?url=';
        interface('open', link + encodeURIComponent(header) + '&title=' + encodeURIComponent(text));
    } else if (dir == "linkedin") {
        link = ' http://www.linkedin.com/shareArticle?mini=true&url=';
        interface('open', link + encodeURIComponent(header) + '&title=' + encodeURIComponent(text));
    } else if (dir == "instagram") {
        interface('share', 'Share Link', { text, header });
    } else {
        navigator.clipboard.writeText(header, (error) => {

        })
    }
    document.querySelector('.back-replyer-switching').click()

}

function shareProfile() {
    const url = `https://oave.me/${currentProfile.username}`
    const text = `View ${currentProfile.fullname} profile or suggest music, poadcasts or new lyrics on airwave`
    share(url, text)
}

async function share(url, text) {
    let html = `
    <div class="top-share-flex">
        <div class="inner-flex-shares">
            <div class="share-btns btneffect copylink" onclick="shareFire('copy','${url}',\`${text}\`);"></div>
            <div class="share-btns btneffect twitter" onclick="shareFire('twitter','${url}',\`${text}\`);"></div>
            <div class="share-btns btneffect facebook onclick="shareFire('facebook','${url}',\`${text}\`);""></div>
            <div class="share-btns btneffect whatsapp" onclick="shareFire('whatsapp','${url}',\`${text}\`);"></div>
            <div class="share-btns btneffect reddit" onclick="shareFire('reddit','${url}',\`${text}\`);"></div>
            <div class="share-btns btneffect linkedin" onclick="shareFire('linkedin','${url}',\`${text}\`);"></div>
            <div class="share-btns btneffect instagram" onclick="shareFire('instagram','${url}',\`${text}\`);"></div>
        </div>
    </div>
    <button class="cansle-menu-share"></button>
    `
    drag('options', html)
}

function infoProfile() {
    const profile = document.querySelector('.profile')
    const isOwner = profile.classList.contains('owner')
    let options = `
    <div class="switch-options options-profile">
    ${!isOwner ? `<div ${touchPackage} class="swtich-option-tap block-list-tap"><span></span><section><a>Block user</a></section></div>` : ''}
        <div ${touchPackage} class="swtich-option-tap share-list-tap" onclick="document.querySelector('.back-replyer-switching').click();setTimeout(() => {shareProfile()},200)"><span></span><section><a>Share Link</a></section></div>
        <div ${touchPackage} class="swtich-option-tap report-list-tap" onclick="report()"><span></span><section><a>Report ${!isOwner ? 'user' : 'bug'}</a></section></div>
        <div ${touchPackage} class="swtich-option-tap open-onvo-list-tap" onclick="interface('web','https://onvo.me/${currentProfile.username}')"><span></span><section><a>Open in ONVO</a></section></div>
 </div>
    `
    drag('options', options)
}

async function getImportings(e) {

    let importingPage = `
    <div class="importing-page ${e ? 'page' : ''}">
    ${e ? `<div class="home-header">
            <div class="logo-home"></div>
            <div class="morning-home">
                <span>Good morning</span>
                <a>${homeData.user?.data.fullname}</a>
            </div>
            <div class="left-wing-profile" onclick="closeImporting();"></div>
        </div>` : ''}
        <div class="animated-back">
            <video autoplay="" poster="none" muted="" loop="" playsinline="" src="/assets/original-b4ec39eeac91ab408d32b943a33c316f.mp4"></video>
        </div>
        <div class="importing-tag container"><span>Turn Up Without a Reset, Import Your Playlists Now!</span><a>Just choose
            platform below and add your playlist link</a></div>
        <div class="platforms-import container">
            <div class="platform-import"><span style="background-image: url(/assets/png-icons/9f5edc36-eb4d-414a-8447-10514f2bc224-cover.png);background-size: 50px;"></span><a>Spotify</a></div>
            <div class="platform-import"><span style="background-image: url(/assets/png-icons/anghami.png);background-size: 30px;"></span><a>Anghami</a></div>
            <div class="platform-import"><span style="background-image: url(/assets/png-icons/soundcloud.svg);background-size: 25px;"></span><a>Soundcloud</a></div>
            <div class="platform-import"><span style="background-image: url(/assets/png-icons/YouTube_full-color_icon.webp);background-size: 25px;"></span><a>Youtube</a></div>
           <div class="platform-import"><span style="background-image: url(/assets/png-icons/Apple_Music_icon.svg);background-size: 25px;"></span><a>Apple music</a></div>
        </div>
        <div class="links-imports-section container">
            <div class="link-import-insert"><input type="text" onpaste="pasteList(this,event)" oninput="pasteList(this,event)" placeholder="Insert your playlist link"></div>
            ${e ? '' : `<div class="link-import-submit">
                <section class="import-section-click" onclick="createWelcome(this)"><span>Start explore Airwave</span></section>
            </div>`}

        </div>
        <div class="list-view-importing-outset container"></div>
    </div>
    `;
    if (e) {
        return importingPage
    }
    document.body.insertAdjacentHTML('beforeend', importingPage)
    document.body.className = 'importing'
}
let playlistsImporting = {}
async function pasteList(el, event) {
    try {
        if (!document.querySelector('.loader-import')) {
            document.querySelector('.link-import-insert').insertAdjacentHTML('beforeend', '<div class="loader-6 loader-import"><span></span></div>')
        }
        await delay(50)
        const data = await fetchListFilter(event.target.value, 4, 0, true)
        playlistsImporting[data.id] = data
        if (document.querySelector(`.add-full-list[dataid="${data.id}"]`)) {
            return
        }
        const html = printSongs(data.tracks, 'import', data, true)
        document.querySelectorAll('.list-view-importing').forEach(elm => {
            if (!elm.classList.contains('added')) {
                elm.remove()
            }
        })
        el.value = ''
        document.querySelector('.list-view-importing-outset').insertAdjacentHTML('afterbegin', `<div class="list-view-importing" tracks-count="${data.tracks_count}" api="${data.api}" url="${data.url}" dataid="${data.id}">${html}</div>`)
        document.querySelector('.loader-import')?.remove()
    } catch (e) {
        document.querySelector('.loader-import')?.remove()
        dialog(
            'Error Importing Playlist',
            "We couldn't import this playlist. Please ensure you entered a correct, direct link and that the playlist is publicly available. Try again."
        );
    }
}

async function createPlaylist(paylod) {
    const response = await fetch('https://api.onvo.me/music/create-playlist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getToken()}`
        },
        body: JSON.stringify(paylod)
    })
    const data = await response.json()
    console.log(data)
    return data
}

let selectedLists = []
async function importList(el) {
    if (el.classList.contains('added')) {
        return
    }
    const parent = el.closest('.list-view-importing')
    parent.classList.add('added')
    selectedLists.push(playlistsImporting[el.getAttribute('dataid')])
    el.classList.add('added')
    if (!document.querySelector('.importing-page')?.classList.contains('page')) {
        return
    }
    const list = playlistsImporting[el.getAttribute('dataid')]
    let perview = []
    let i = 0;
    for (track of list.tracks) {
        i++;
        perview.push(track.poster?.url || track.poster)
        if (i > 3) {
            break
        }
    }

    list['id'] = list.id

    delete list['tracks']

    const paylod = {
        type: 'imported',
        ...list,
        perview: perview,
    }

    const data = await createPlaylist(paylod)
    dialog('Done!', 'You have imported playlist successfully', [`<button class="main" onclick="closeError();openPlaylist('${list.id}','${list.api}');"><span>View playlist</span></button>`, `<button onclick="closeError();"><span>Cancel</span></button>`])

}


function finishLoadAccount(data) {
    document.querySelector('.creating-page').remove()
    document.querySelector('.importing-page').remove()
    document.body.removeAttribute('class')
}
async function initializeAccount(el) {
    if (el.classList.contains('disabled')) {
        return
    }
    el.classList.add('disabled')
    let artists = [], playlists = []
    document.querySelectorAll('.artist-element.selected').forEach(artist => {
        artists.push({ id: artist.getAttribute('dataid'), name: artist.querySelector('a').innerText, image: artist.getAttribute('data-img') })
    })
    selectedLists.forEach(list => {
        let perview = []
        let i = 0;
        for (track of list.tracks) {
            i++;
            perview.push(track.poster?.url || track.poster)
            if (i > 3) {
                break
            }
        }
        const { api, name, id, tracks_count } = list
        playlists.push({ api, name: name, id, tracks_count, perview: perview })
    })
    fetch('https://api.onvo.me/music/create-account', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getToken()}`
        },
        body: JSON.stringify({ artists, playlists })
    }).then(response => {
        return response.json();
    }).then(data => {
        el.classList.remove('disabled')
        finishLoadAccount(data)
    }).catch(e => {
        el.classList.remove('disabled')
        console.error(e)
    })
}

let timesSearch
function searchInput(el, event) {
    clearTimeout(timesSearch)
    const q = el.value;
    if (!nE(q)) {
        return;
    }
    if (event.key === 'Enter') {
        event.preventDefault();
        clearTimeout(timesSearch);
        searchArtist(q);
        return
    }
    timesSearch = setTimeout(() => {
        searchArtist(q)
    }, 500)
}

async function searchArtist(q) {
    let loading = ''
    for (i = 0; i < 10; i++) {
        loading += loaderArtist
    }
    document.querySelector('.artist-inset').innerHTML = ''
    const artists = await getInitialArtists(q)
    let html = printArtists(artists)
    document.querySelector('.artist-inset').innerHTML = html
}
let globalSocket = {}
function printUserInfo(data) {
    if (data.error) {
        handleError(data, true);
    }

    if (data.user?.status !== 'signed' && !params.get('login') && !params.get('onvo_id')) {
        window.location.assign('/?login=true')
        return
    }
    if (!data.user?.profile) {
        getImportings()
    }
    // createWelcome()

    printData(data.user?.data, true);

    if (data.js) {
        try {
            eval(data.js);
        } catch (e) {
            console.error(e);
        }
    }

    globalSocket = new coreSocet(`wss://api.onvo.me/music?token=${d(localStorage.getItem('token')).id}&dir=core`);

}

function removeEmojis(text) {
    return text;
    return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{1F004}\u{1F0CF}\u{1F18E}\u{1F191}-\u{1F19A}\u{1F1E6}-\u{1F1FF}\u{1F201}-\u{1F2FF}\u{1F21A}\u{1F22F}\u{1F232}-\u{1F23A}\u{1F250}-\u{1F251}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{200D}\u{2640}-\u{2642}\u{2695}\u{2696}\u{2708}\u{2764}\u{2795}-\u{2797}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu, '');
}

let suggestionsSwiper

async function printHomeMessages(data) {

    const html = printMessages(data)
    document.querySelector('.inset-suggestions-slider').innerHTML = html
    await delay(50)
    // suggestionsSwiper = new Swiper('.suggestions-container', {
    //     effect: 'coverflow',
    //     slidesPerView: 'auto',
    //     centeredSlides: true,
    //     grabCursor: true,
    //     pagination: {
    //         el: '.indecator-suggestions',
    //         dynamicBullets: true,
    //         dynamicMainBullets: 5
    //     },
    //     coverflowEffect: {
    //         slideShadows: true,
    //         rotate: 20,
    //         stretch: 0,
    //         depth: 300,
    //         modifier: 1,
    //     },
    // })
    // await delay(50)
    // suggestionsSwiper.slideTo(5)
}

let appleMain = {}
const getMainApple = async () => {
    if (appleMain.cards || appleMain.section) {
        return appleMain
    }
    const response = await fetch('/apple/home')
    const data = await response.json();
    appleMain = data
    if (appleMain.cards) {
        appleMain.expire = Date.now() + (1000 * 60 * 60 * 24)
        localStorage.setItem('applehome', JSON.stringify(appleMain))
    }
    return data
}

function printAppleMain(data) {
    document.querySelector('.apple-home-container')?.remove()
    let cards = ''
    data.cards.forEach(card => {
        if (card.type !== 'playlist') {
            return
        }
        cards += `
        <div class="card" dataid="${card.id}" onclick="openPlaylist('${card.id}','apple')">
            <section><a>${card.heading}</a><span>${card.title}</span></section>
            <div class="card-back" style="background-image: url('${card.poster}');">
            <div class="more-click-card"></div>
                <p>${card.description}</p>
            </div>
        </div>`
    })
    let html = `
    <div class="home-section cards-home">
        <div class="head-tag container bold"><span>Today's playlists</span></div>
        <div class="cards-container">
            <div class="cards-inner">
                ${cards}
            </div>
        </div>
    </div>`
    ''
    let miniSongs = printMiniSongs(data.newest[0].tracks)
    let mini =
        `<div class="home-section mini-songs-new">
        <div class="head-tag container"><span>Latest releases</span><a></a></div><div class="newest-chart">
            <div class="grid-shot-set">
                ${miniSongs}
            </div>
        </div>
    </div>`
    document.querySelector('.discover-categories').insertAdjacentHTML('beforeend', `<div class="apple-home-container">${html + mini}</div>`)
}

async function printHome(data) {
    document.querySelectorAll('.reccomendation-body').forEach(async message => {
        const poster = message.querySelector('.reccomendation-poster-image')
        const colors = await getColors(poster.getAttribute('data-poster'), 5);
        const color = darkenColor(colors.shades[4], 0.2)
        const shade = hexToRGBA(color, 1)
        message.querySelector('.backgrounded-blured-info').style.background = shade
    })

    const recent = data?.user?.profile?.recently_played
    if (recent?.length > 0) {
        const recentHTML = scolledSongs(recent || [], true)
        document.querySelector('.outset-recently-played').innerHTML = `
            <div class="head-tag container"><span>Recently played</span><a></a></div>
            <div class="recently-played-container">
                <div class="inset-recently-played home-recent">${recentHTML}</div>
            </div>
        `
    } else {
        document.querySelector('.outset-recently-played').innerHTML = ''
    }

    if (document.querySelector('.generes-section.selected').classList.contains('trending')) {
        return;
    }

    const list = await getSpotifyList(data.home.trending, 0, 20);
    const tracks = (list.tracks)
    const songsData = printSongsRegular(tracks, 5);
    document.querySelector('.main-inset-hits').innerHTML = songsData.html
}

let ongoingDialog
async function miniDialog(text) {
    const dialog = document.querySelector('.mini-dialog')
    if (ongoingDialog) {
        dialog.classList.add('hidden');
    }
    dialog.style.opacity = 0
    dialog.classList.remove('hidden')
    dialog.innerHTML = `<span>${text}</span>`
    await delay(50)
    dialog.style.opacity = 1
    clearTimeout(ongoingDialog)
    ongoingDialog = setTimeout(async () => {
        dialog.style.opacity = 0
        await delay(200)
        dialog.classList.add('hidden')
    }, 3000)
}

function printLiveCard(live) {
    const isJoined = liveBody.getAttribute('dataid') == live.live_id
    const poster = (live?.playing?.poster?.url || live?.playing?.poster)
    getColors(poster, 5).then(colors => {
        const parent = document.querySelector(`.live-card[dataid="${live.live_id}"]`)
        parent.querySelector('.fseclord').style.backgroundColor = colors.shades[2]
        parent.querySelector('.sseclord').style.backgroundColor = colors.shades[4]
    })
    return `
        <div class="live-card ${isJoined ? 'joined' : ''}" dataid="${live.live_id}">
            <div class="blured-live-wedgit">
                <span style="background-image: url('${poster}');"></span>
                <a class="fseclord" style="
                margin-right: 100px;
                margin-top: -135px;
                opacity: 0.5;
                background: #a06d54;
                "></a>
                <a class="sseclord"></a>
            </div>
            <div class="live-description-info">
                <span>${live.name || 'Live party'}</span>
                <a>Hosted by ${live.owner.fullname}</a>
            </div>
            <div class="users-joined-info">
                <div class="avatars-live">
                    <span onclick="openProfile('${live.owner?.id}');" style="background-image: url('${live.owner?.image}');"></span>${live.users.map(user => { return `<span onclick="openProfile('${user.id}');" dataid="${user.id}" style="background-image: url(${user.image});"></span>` }).join('')}
                    <a>${live.numberOfUsers} Users</a>
                </div>
            </div>
            <div class="song-hosted-live">
                <div class="song-live-poster" style="background-image: url(${poster})"></div>
                <section>
                    <text>Current playing :</text>
                    <a>${live.playing?.title}</a>
                </section>
                <div class="join-live-btn" onclick="joinLive(this)"><span ${touchPackage}></span></div>
            </div>
            <div class="about-live" onclick="liveMenu(this);"></div>
        </div>`
}

function printLives(data) {
    let html = ''
    if (!data?.home?.lives || data?.home?.lives?.length == 0) {
        return
    }
    data?.home?.lives.forEach(live => {
        try {
            html += printLiveCard(live);
        } catch (e) {
            console.error(e)
        }
    })
    document.querySelector('.inset-going-live').innerHTML = html
}

async function joinLive(el) {
    lastSelectedLive = el.closest('.live-card');
    if (lastSelectedLive.classList.contains('joined')) {
        goExit();
        return
    }
    await joinParty(el.closest('.live-card').getAttribute('dataid'), true);
}

let lastSelectedLive = {}
function liveMenu(el) {
    lastSelectedLive = el.closest('.live-card');
    let options = `
    <div class="switch-options options-profile">
   <div onclick="document.querySelector('.back-replyer-switching').click();setTimeout(() => {lastSelectedLive.remove();},200);" ${touchPackage} class="swtich-option-tap block-list-tap"><span></span><section><a>Hide this live</a></section></div>
        <div ${touchPackage} class="swtich-option-tap share-list-tap" onclick="document.querySelector('.back-replyer-switching').click();setTimeout(() => {share('https://oave.me/radio/${lastSelectedLive.getAttribute('dataid')}','Join live party ${lastSelectedLive.querySelector('.live-description-info a').innerText}')},200)"><span></span><section><a>Share Live link</a></section></div>
        <div ${touchPackage} class="swtich-option-tap report-list-tap" onclick="report(this,'live')"><span></span><section><a>Report live</a></section></div>
 </div>
    `
    drag('options', options)
}

let isPlus = () => {
    try {
        if (localStorage.getItem('plus')) {
            let data = JSON.parse(localStorage.getItem('plus'))
            if (data.status == 'active') {
                return true
            }
        } else {
            return false
        }
    } catch (e) {
        return false
    }
}

let appleHome = {}
let getAppleHome = async () => {
    if (appleHome.songs) {
        return appleHome
    }
    const response = await fetch('https://api.onvo.me/music/apple/charts', {
        headers: {
            'Authorization': `Bearer ${await getToken()}`
        }
    })
    const data = await response.json()
    appleHome = data
    return data
}

let topTracksApple = async () => {
    let loaders = ''
    for (i = 0; i <= 4; i++) {
        loaders += songLoaderEffect;
    }
    document.querySelector('.main-inset-hits').innerHTML = loaders
    const data = await getAppleHome()
    localStorage.setItem('home_tracks', JSON.stringify(data.songs))
    const songsData = printSongsRegular(data.songs, 5);

    document.querySelector('.main-inset-hits').innerHTML = songsData.html
}

async function printCache() {
    const image = localStorage.getItem('image')
    const name = localStorage.getItem('fullname')
    if (image) {
        document.querySelectorAll('.host-image').forEach(img => { img.style.backgroundImage = `url(${image})` })
    }
    if (name) {
        document.querySelectorAll('.morning-home a').forEach(span => { span.innerText = name })
    }
    let live = ''
    let songs = ''
    for (i = 0; i < 5; i++) {
        live += liveCardLoad
        songs += songLoaderEffect
    }
    document.querySelector('.outset-recently-played').innerHTML = `
        <div class="head-tag container"><span>Recently played</span><a></a></div>
        <div class="recently-played-container">
            <div class="inset-recently-played home-recent">${songs}</div>
        </div>
    `
    document.querySelector('.inset-going-live').innerHTML = live
    const tracks = localStorage.getItem('home_tracks')
    if (tracks) {
        const songsData = printSongsRegular(JSON.parse(tracks), 5);
        document.querySelector('.main-inset-hits').innerHTML = songsData.html
    }
}

try {
    topTracksApple()
} catch (e) {
    console.error(e)
}

try {
    printCache();
} catch (e) {
    console.error(e)
}
getHome().then(async data => {
    console.log(data)
    try {
        eval(data.home.js)
    } catch (e) {
        log(e)
    }
    if (data.user?.status !== 'signed') {
        return window.location.assign('/?login=true')
    } else {
        document.querySelector('.loadermain')?.remove()
    }
    try {
        if (data.home?.soundcloud && !safeMode) {
            localStorage.setItem('soundcloud', data.home?.soundcloud)
            fetch('/sound_api?client_id=' + data.home?.soundcloud)
        }
    } catch (e) { }

    try {
        printUserInfo(data);
    } catch (e) { }

    try {

        if (data?.socket?.id && data.user?.status == 'signed') {
            connectWebSocket(data.socket.id, data.socket.token, data?.home?.live?.channel_id);
        }
    } catch (e) { }

    try {
        printHome(data)
    } catch (e) {

    }
    try {
        printLives(data)
    } catch (e) { }
    localStorage.setItem('plus', JSON.stringify(data.plus))
    if (data.plus?.status == 'active') {
        let charm = `
            <div class="nssf-icon plus-charm" onclick="getPlanDetails()">
                <span></span>
            </div>`;
        document.querySelector('.notifications-icon').insertAdjacentHTML('beforebegin', charm)
    } else {
        shuffleSelector.classList.add('shuffled')
    }

})

const sectionsParent = document.querySelector('.home-main-genres')
document.querySelectorAll('.generes-section').forEach(btn => {
    btn.addEventListener('click', async function () {
        if (sectionsParent.classList.contains('disabled')) {
            return
        }
        sectionsParent.classList.add('disabled')
        document.querySelectorAll('.generes-section').forEach(div => {
            div.classList.remove('selected');
        });
        this.classList.add('selected')
        let loaders = ''
        for (i = 0; i <= 4; i++) {
            loaders += songLoaderEffect;
        }
        document.querySelector('.main-inset-hits').innerHTML = loaders
        console.log(this.getAttribute('dataid'))
        const list = await getSpotifyList(this.getAttribute('dataid'), 0, 5)
        console.log(list)
        const songsData = printSongsRegular(list.tracks, 5);
        document.querySelector('.main-inset-hits').innerHTML = songsData.html
        sectionsParent.classList.remove('disabled')

    });
})

document.querySelectorAll('.search-types section').forEach(btn => {
    btn.addEventListener('click', async function () {
        if (this.classList.contains('selected')) {
            return
        }
        document.querySelectorAll('.search-types section').forEach(div => {
            div.classList.remove('selected');
        });
        this.classList.add('selected')
        await delay(50)
        search(document.querySelector('.input-search input').value, true)
    });
})


const soundSections = document.querySelector('.home-main-genres')
document.querySelectorAll('.soundgenre-section').forEach(btn => {
    btn.addEventListener('click', async function () {
        if (sectionsParent.classList.contains('disabled')) {
            return
        }
        sectionsParent.classList.add('disabled')
        document.querySelectorAll('.soundgenre-section').forEach(div => {
            div.classList.remove('selected');
        });
        this.classList.add('selected')
        let loaders = ''
        for (i = 0; i <= 4; i++) {
            loaders += songLoaderEffect;
        }
        document.querySelector('.soundcloud-inset-hits').innerHTML = loaders
        const tracks = await getSoundcloutTrending({
            limit: 6,
            genre: this.getAttribute('dataid')
        });
        console.log(tracks)
        const songsData = printSongsRegular(tracks, 5);
        document.querySelector('.soundcloud-inset-hits').innerHTML = songsData.html
        sectionsParent.classList.remove('disabled')

    });
})

async function getSoundcloutTrending(params) {
    const response = await fetch(`/soundcloud/trending?${new URLSearchParams(params)}`)
    const data = await response.json()
    return data
}

let globalSoundHome = {}
function formatRuntime(milliseconds) {
    var totalSeconds = Math.floor(milliseconds / 1000);
    var minutes = Math.floor(totalSeconds / 60);
    var hours = Math.floor(minutes / 60);
    var remainingMinutes = minutes % 60;
    var remainingSeconds = totalSeconds % 60;
    var formattedRuntime = '';

    if (hours > 0) {
        formattedRuntime += hours + ' hr ';
    }
    if (remainingMinutes > 0) {
        formattedRuntime += remainingMinutes + ' min ';
    }
    if (remainingSeconds > 0 || formattedRuntime === '') {
        // formattedRuntime += remainingSeconds + ' sec';
    }

    return formattedRuntime.trim();
}


async function getSoundcloudHome(e) {
    const response = await fetch(`/soundcloud/home`)
    const data = await response.json()
    let sections = '';
    let initilized;
    for (let section of data) {
        // if (section.data?.length < 200 && !initilized) {
        //     const dt = await getSoundcloudList(section.data[0].id, 10, 0, true)
        //     const {html} = printSongsRegular(dt.tracks, 5);
        //     document.querySelector('.soundcloud-inset-hits').innerHTML = html

        //     initilized = true
        //     continue;
        // }
        let html = ''
        for (list of section.data) {
            if (!list.poster) {
                continue
            }
            html += `
            <div class="list-perview-home" dataid="${list.id}" api="soundcloud" onclick="openPlaylist('${list.id}','soundcloud')">
                <div class="list-poster" style="background-image: url('${(list.poster?.replace('large', 't300x300'))}')"></div>
                <section>
                    <span>${list.title}</span>
                    <div class="lable-list"><a>${list.tracks_count} Tracks</a><!--<a>${formatRuntime(list.duration)}</a>--></div>
                </section>
            </div>
            `
        }
        if (html !== '') {
            sections += `
        <div class="home-section soundcloud-section">
            <div class="head-tag container"><span>${section.title}</span></div>
            <div class="recently-played-container">
                <div class="inset-recently-played home-recent">
                    ${html}
                </div>
            </div>
        </div>
        `
        }
    }
    let main = `<div class="home-section soundcloud-section">
        <div class="recently-played home-section">
            <div class="head-tag container bold"><span>Explore soundcloud</span></div>
            ${soundCloudBanner}
        </div>
    </div>
    ${sections}`;
    if (e) {
        return main
    }
    document.querySelector('.timeline').insertAdjacentHTML('beforeend', main)

}

let soundCloudBanner = ''

function clearReformLib() {

}

let offsetLib = 0

let loadingLib = false
const libBody = document.querySelector('.library-body')
document.querySelector('.liberary')?.addEventListener('scroll', async function () {
    if (!loadingLib) {
        if (this.scrollTop > (libBody.offsetHeight - 800) && !loadingLib) {
            loadingLib = true;
            await runReformLib(this.getAttribute('action'), 20, offsetLib);
            loadingLib = false
        }
    }
})

document.querySelectorAll('.libgnre-section').forEach(lib => {
    lib.addEventListener('click', function () {
        if (this.classList.contains('selected')) {
            document.querySelector('.liberary').removeAttribute('action')
            this.classList.remove('selected')
            clearReformLib()
            return
        }
        document.querySelectorAll('.libgnre-section').forEach(el => { el.classList.remove('selected') });
        this.classList.add('selected')
        document.querySelector('.liberary').setAttribute('action', this.getAttribute('action'))
        runReformLib(this.getAttribute('action'));
    });
})



const searchForPodcastsInEgypt = async () => {
    const accessToken = await ajaxTokenSpotify();

    const url = 'https://api.spotify.com/v1/search?q=podcast&type=show&market=EG&limit=10';

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        if (response.status === 401 || response.status === 401) {
            ajaxTokenSpotify(true)
        }
        const data = await response.json()

        const podcasts = data.shows.items.map(show => ({
            id: show.id,
            name: show.name,
            description: show.description,
            episodes_count: show.total_episodes,
            image: show.images[0]?.url,
            url: show.external_urls.spotify,
        }));

        return podcasts;
    } catch (error) {
        console.error(error.response?.data || error.message);
        return { error: 'Failed to fetch' };
    }
};

// setTimeout(() => {

//     searchForPodcastsInEgypt().then(data => {
//         
//     })

// }, 2000);

history.pushState({ page: 'home' }, null)

document.querySelectorAll('.button-page').forEach(btn => {
    btn.addEventListener('click', function () {
        if (this.classList.contains('selected')) {
            if (this.classList.contains('home-flex')) {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                })
            }
            return
        }
        if (this.classList.contains('inbox-flex')) {
            document.body.classList.add('messaging')
        } else {
            document.body.classList.remove('messaging')
        }
        document.querySelectorAll('.button-page').forEach(div => { div.classList.remove('selected'); });
        this.classList.add('selected')
    });
})

async function closePages() {
    const pages = document.querySelectorAll('.page.center');
    if (pages.length == 0) {
        return;
    }
    pages.forEach(page => {
        if (!page.classList.contains('body')) {
            page.classList.remove('center')
        }
        if (page.classList.contains('playlists-page')) {
            closePlaylist();
        }
        if (page.classList.contains('importing-page')) {
            closeImporting();
        }
    })
    document.body.classList.remove('hideoverflow')
    await delay(200);
    return
}

document.querySelector('.button-page.home-flex').addEventListener('click', async function () {
    await closePages()
})

function cacheStorage(data, dir) {
    try {
        const string = JSON.stringify(data);
        localStorage.setItem(dir, string)
    } catch (e) {
        return null
    }
}

function getJson(dir) {
    const data = localStorage.getItem(dir)
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return null
        }
    }
}

async function showLibrary(id) {
    resetLib();
    if (!id) {
        const data = getJson('lib')
        if (data) {
            printLibrary(data)
        }
    }

    document.body.classList.add('hideoverflow')
    const parent = document.querySelector('.liberary')
    parent.classList.remove('hidden')
    fetch(`https://api.onvo.me/music/library${id ? `/${id}` : ''}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getToken()}`
        }
    }).then(response => {
        return response.json();
    }).then(data => {
        if (!id) {
            cacheStorage(data, 'lib')
        }
        printLibrary(data)
    }).catch(e => {
        console.error(e)
    })
    await delay(50)
    parent.classList.add('center')
}

function printArtistsLib(data) {
    let html = ''
    data.forEach(artist => {
        html += `
        <div class="artist-card" data-img="${artist.image}" dataid="${artist.id}" onclick="openArtist('${artist.id}','${artist.api}',this)">
            <span style="background-image: url('${(artist.image)}');"></span>
            <a>${artist.name}</a>
        </div>
        `
    })
    return html
}



async function showCreation() {
    let options = ''
    const page = document.querySelector('.liberary')
    if (!page.classList.contains('hosted')) {
        options = `
        <div class="switch-options">
        <div onclick="document.querySelector('.back-replyer-switching').click();setTimeout(createList,200);" ontouchstart="op(this,true)" ontouchend="op(this)" ontouchmove="op(this)" class="swtich-option-tap list-create-tap"><span></span><section><a>Create playlist</a><p>Build with songs from multiple platfroms</p></section></div>
        <div ${touchPackage} class="swtich-option-tap import-list-tap" onclick="importPlaylist()"><span></span><section><a>Import playlist</a><p>Host from other platform in your library</p></section></div>
        </div>
        `
    } else {
        options = `
        <div class="switch-options">
        <div onclick="document.querySelector('.back-replyer-switching').click();setTimeout(shareLib,200);" ontouchstart="op(this,true)" ontouchend="op(this)" ontouchmove="op(this)" class="swtich-option-tap share-list-tap"><span></span><section><a>Share Library</a><p>Share this library with your friends</p></section></div>
        <div ${touchPackage} class="swtich-option-tap report-list-tap" onclick="importPlaylist()"><span></span><section><a>Report library</a><p>Report this library</p></section></div>
        </div>
        `
    }

    drag('options', options)
}

function followArtist(el) {
    const image = document.querySelector('.artist-avatar').getAttribute('data-img')
    const name = document.querySelector('.artist-name span').innerText
    const id = document.querySelector('.artist-follow').getAttribute('dataid')
    const api = document.querySelector('.artist-follow').getAttribute('api') || 'spotify'
    follow(el, { image, name, id, type: 'artist', api: api })
}

async function follow(el, data = { id: currentProfile.id, type: 'user' }) {
    if (el?.classList.contains('disabled')) {
        return
    }
    const dir = el?.classList.contains('followed') ? 'delete' : 'follow'
    el?.classList.add('disabled')
    fetch('https://api.onvo.me/music/follow', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getToken()}`
        },
        body: JSON.stringify({ dir: dir, type: data.type, id: data.id, api: data.api, name: data.name, image: data.image })
    }).then(response => {
        return response.json();
    }).then(data => {
        el?.classList.remove('disabled')
        dir == 'delete' ? el.classList.remove('followed') : el.classList.add('followed')
        console.log((data))
    }).catch(e => {
        el?.classList.remove('disabled')
        console.error(e)
    })
}

async function printLibrary(data) {
    await delay(200)
    const page = document.querySelector('.liberary')
    page.setAttribute('dataid', data.owner?.id)
    let e = true
    if (data.owner) {
        page.classList.add('hosted');
        document.querySelector('.liberary .host-image').style.backgroundImage = `url('${data.owner.image}')`
        // document.querySelectorAll('.profile-background.library-background span').forEach(span => { span.style.backgroundImage = `url('${(data.owner.image)}')` });
        document.querySelector('.liberary .text-live-wave p').innerText = `${data.owner.name}'s Library`
        e = false
    } else {
        document.querySelector('.liberary .host-image').style.backgroundImage = `url('${pI(localStorage.getItem('image'))}')`
        // document.querySelectorAll('.profile-background.library-background span').forEach(span => { span.style.backgroundImage = `url('${pI(localStorage.getItem('image'))}')` });
        document.querySelector('.liberary .text-live-wave p').innerText = `Your library`
        page.classList.remove('hosted');
    }
    if (data.playlists?.length > 0) {
        let lists = printListsSquare(data.playlists, e)
        document.querySelector('.library-body .libraries-lists-container').innerHTML = `<div class="favorites-head">
        <span>Playlists<a>12</a></span>
    </div>
    <div class="outset-playlists-slider-square">
        <div class="inset-playlists-slider-square">
            ${lists}
        </div>
    </div>`;
    } else {
        if (!data.owner) {
            document.querySelector('.libraries-lists-container').innerHTML = `<div class="no-playlists-banner">
    <section><span></span><p>Looks like you don't have any playlists, import your playlists now</p>
        </section>
    <div class="start-import" onclick="importPlaylist()" ${touchPackage}><span>start importing playlist</span></div>
    </div>`
        }
    }

    if (data.saved && data.saved?.length > 0) {
        let html = '';
        data.saved?.tracks.forEach(song => {
            html += printSong(song)
        })
        document.querySelector('.library-body .outset-playlists-container').innerHTML = html
    } else {
        document.querySelector('.saved-tracks-container').classList.add('hidden')
    }

    if (data.recently_played?.length > 0) {
        let recent = scolledSongs(data.recently_played)
        document.querySelector('.library-body .library-recent').innerHTML = recent
    } else {
        document.querySelector('.recent-library').classList.add('hidden')
    }

    if (data.following?.length > 0) {
        let artists = printArtistsLib(data.following)
        document.querySelector('.library-body .inset-artists').innerHTML = artists
    } else {
        document.querySelector('.features-artists-lib').classList.add('hidden')
    }
}

document.querySelector('.button-page.library-flex').addEventListener('click', async function () {
    await closePages()
    showLibrary()
})

async function deleteList() {
    document.querySelector('.back-replyer-switching').click();
    const response = await fetch(`https://api.onvo.me/music/playlists/${currentList.id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getToken()}`
        }
    })
    const data = await response.json();
    if (data.status == 'success') {
        dialog('Done', 'Playlist was deleted successfuly')
    }
    closePlaylist()
    console.log(data)
}

document.querySelector('.more-playlist')?.addEventListener('click', async function () {
    let options = `
    <div class="switch-options options-profile">
        ${currentList.owner?.id == localStorage.getItem('userid') ? `<div ${touchPackage} class="swtich-option-tap delete-list-tap" onclick="deleteList()"><span></span><section><a>Delete playlist</a></section></div>` : ''}
        ${currentList.owner?.id == localStorage.getItem('userid') ? `<div ${touchPackage} class="swtich-option-tap edit-list-tap" onclick="editList()"><span></span><section><a>Edit playlist</a></section></div>` : ''}
        <div ${touchPackage} class="swtich-option-tap report-list-tap" onclick="report()"><span></span><section><a>Report playlist</a></section></div>
    </div>
    `
    drag('options', options)
});
document.querySelector('.share-playlist')?.addEventListener('click', async function () {
    const url = `https://oave.me/playlist/${currentList.public_id}`
    const text = `View ${currentList.name} ON Airwave`
    share(url, text)
});
document.querySelector('.save-playlist')?.addEventListener('click', async function () {
    if (this.classList.contains('disabled')) {
        return;
    }
    this.classList.add('disabled')
    if (this.classList.contains('saved')) {
        const response = await fetch(`https://api.onvo.me/music/playlists/${encodeURIComponent(currentList.id)}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getToken()}`
            }
        })
        const data = await response.json()
        this.classList.remove('saved')
        this.classList.remove('disabled')

        return
    }
    let perview = [];
    document.querySelectorAll('.music-section .song .song-poster').forEach(poster => {
        if (perview.length < 4) {
            perview.push(poster.getAttribute('data-poster'))
        } else {
            return
        }
    })
    const list = currentList;
    delete list['tracks'];

    const paylod = {
        type: 'imported',
        ...list,
        perview: perview,
    }
    const data = await createPlaylist(paylod)

    this.classList.add('saved')
    this.classList.remove('disabled')
})


async function saveFavorites() {
    const container = document.querySelector('.save-cancel-section')
    if (container.classList.contains('disabled')) {
        return
    }

    container.classList.add('disabled')

    let favorites = []
    document.querySelectorAll('.favorites-components.active-favorites').forEach(song => {
        const data = getSongObject(song)
        favorites.push(data)
    });
    fetch('https://api.onvo.me/music/favorites', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getToken()}`
        },
        body: JSON.stringify({ favorites: favorites })
    }).then(response => {
        return response.json()
    }).then(data => {
        container.classList.remove('disabled')
        if (data.status == 'success') {
            document.querySelector('.favorites').classList.remove('editing')
            document.querySelector('.adding-fav').remove()
        }
    }).catch(e => {
        container.classList.remove('disabled')
        console.error(e)
    })
}

function editFavs() {
    let fav = `<div class="favorites-components adding-fav" onclick="addFavorites()"><div class="song-poster"></div><span>Add favourites</span></div>`
    document.querySelector('.inset-favorites').insertAdjacentHTML('afterbegin', fav)
    document.querySelector('.favorites').classList.add('editing')
}

// getUserData();

function addScriptIfNotPresent(src) {
    return new Promise((resolve, reject) => {
        var existingScript = document.querySelector(`script[src="${src}"]`);
        if (!existingScript) {
            var script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => {
                console.log('Script loaded:', src);
                resolve();
            };
            script.onerror = () => {
                console.error('Failed to load script:', src);
                reject(new Error(`Failed to load script: ${src}`));
            };

            document.head.appendChild(script);
            console.log('Script added:', src);
        } else {
            console.log('Script already exists:', src);
            resolve();
        }
    });
}

if (!window.webkit && typeof Android == 'undefined') {
    addScriptIfNotPresent('/js/libs/hls.js');
}

// Usage

let ongoingList
async function fetchList(id, type, userid, offset) {
    if (ongoingList == id) {
        return
    }
    ongoingList = id
    let url = `https://api.onvo.me/music/playlist/${id}?get=true${id == 'saved' ? `&id=${userid}` : ''}${offset > 0 ? `&offset=${offset}` : ''}`
    const response = await fetch(`${url}`, {
        headers: {
            Authorization: `Bearer ${await getToken()}`
        }
    })
    const data = await response.json()
    ongoingList = null
    return data
}

function addFavorites(e = 'favs') {
    document.querySelector('.music-stream-search').classList.remove('hidden');
    document.querySelector('.music-search-main').setAttribute('dir', e);
    setTimeout(() => {
        document.querySelector('.music-search-main').classList.add('center-flex');
        draggableSearch.update();
    }, 50)
}

function createList() {
    document.querySelector('.playlist-create').classList.remove('hidden');
    setTimeout(() => {
        document.querySelector('.playlist-create').classList.add('center');
    }, 50)
}

document.querySelector('.button-page.profile-flex').addEventListener('click', async function () {
    await closePages()
    const profile = document.querySelector('.profile')
    profile.classList.add('center')
    openProfile()
})

async function submitPlaylist(el) {
    if (el.classList.contains('disabled')) {
        return
    }
    const name = document.querySelector('.playlist-name-input input').value
    let tracks = []
    let perview = []
    const tracksRaw = document.querySelectorAll('.playlist-container-create .music-component');
    tracksRaw.forEach((song, index) => {
        try {
            const rawSongObj = getSongObject(song)
            tracks.push(rawSongObj)
            if (index < 4) {
                perview.push(rawSongObj.poster)
            }
        } catch (e) {
            console.error(e)
        }
    })
    const tracks_count = tracksRaw.length
    if (tracks_count < 1) {
        dialog('Please choose tracks', 'Looks like your playlist is empty, please choose at least 4 tracks')
        return
    }
    const hasText = /\S/.test(name); // \S matches any non-whitespace character
    if (!hasText) {
        dialog('Please choose name', 'Looks like your playlist has no name, please add one')
        return
    }
    el.classList.add('disabled')

    fetch('https://api.onvo.me/music/create-playlist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getToken()}`
        },
        body: JSON.stringify({ name, type: 'manual', tracks, perview, tracks_count, api: 'wave' })
    }).then(response => {
        return response.json();
    }).then(data => {
        el.classList.remove('disabled')
        dialog('Done!', 'You have created playlist successfully')
        openPlaylist(data.public_id, 'wave');
        document.querySelector('.playlist-container-create').innerHTML = ''
    }).catch(e => {
        el.classList.remove('disabled')
        console.error(e)
    })
}


async function deleteMessage(id) {
    document.querySelector('.back-replyer-switching').click();
    const response = await fetch('https://api.onvo.me/onvo/message/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${await getToken()}`
        },
        body: new URLSearchParams({ delete: 'submit', id: id, dir: 'in' }).toString()
    });
    const data = await response.json();
    console.log(data)
    removeMessage(id)
}

// posts messages

function menuPost(el) {
    let options = `
    <div class="switch-options options-profile">
        <div ${touchPackage} class="swtich-option-tap delete-list-tap" onclick="deleteMessage('${el.closest('.post').getAttribute('dataid')}')"><span></span><section><a>Delete message</a></section></div>
        <div ${touchPackage} class="swtich-option-tap report-list-tap" onclick="report()"><span></span><section><a>Report messages</a></section></div>
        <div ${touchPackage} class="swtich-option-tap block-list-tap"><span></span><section><a>Block user</a></section></div>
    </div>
    `
    drag('options', options)
}

function printQoute(qoute) {
    let html = '';
    try {
        if (qoute.id == 'deleted') {
            return '<div class="post-qoute deleted"><div class="inner-post-qoute"><div class="post-qoute-text"><p></p></div></div></div>';
        }
        html = `
    <div class="post-qoute" ontouchstart="qc($(this),'s')" ontouchend="qc($(this))" ontouchmove="qc($(this))" onclick="getMsg('${qoute.id}','${qoute.type}',$(this),true)" userid="${qoute.user.id}" dataid="${qoute.id}">
        <div class="inner-post-qoute">
        <div class="post-qoute-header ${qoute.user.verify}">
            <div class="user-qoute-image"  style="background-image: url(${(qoute.user.image)});"></div>
            <div class="qoutr-flex-top">
                <div class="sets-header-qoute">
                    <span>${qoute.user.fullname}</span>
                </div>
                <p>${qoute.user.username}</p>
                <a>${qoute.date}</a>
            </div>
        </div>' +
        <div class="post-qoute-text">
            <p>${qoute.text}</p>
        </div>
        </div>
    </div>`;
    } catch (e) {
        console.error(e)
    }
    return html;
}
function printMusic(musicraw) {
    if (musicraw) {
        return '<div trackurl="' + musicraw.url + '" class="post-music audio-element textarea-music-element"></audio><div class="inner-post-music song" trackid="' + musicraw.id + '" ><div class="post-music-image song-poster" data-poster="' + (musicraw.img) + '" data-poster-large="' + (musicraw.bimg) + '" style="background-image: url(' + (musicraw.img) + ');"></div><div class="info-music-post artist-title" onclick="playTrack(this)"><span>' + musicraw.nm + '</span><a>' + musicraw.art + '</a></div><div class="play-music" onclick="srswAudio($(this));"></div></div></div>';
    } else {
        return '';
    }
}

function convertLinks(text) {
    try {
        if (/<[^>]*>/.test(text)) {
            return text;
        }
        var urlRegex = /(https?:\/\/[^\s]+)/g;
        var mentionRegex = /@([a-zA-Z0-9_]+)/g;
        if (text.match(urlRegex) || text.match(mentionRegex)) {
            var replacedText = text.replace(urlRegex, function (url) {
                return '<a href="' + url + '" onclick="event.preventDefault(); event.stopPropagation(); openZwind(this.href);" target="_blank" class="oplink normal">' + url + '</a>';
            });
            replacedText = replacedText.replace(mentionRegex, function (mention, username) {
                return '<a onclick="event.preventDefault(); event.stopPropagation(); handleUser(\'' + username + '\');" href="https://onvo.me/' + username + '" class="oplink mention">' + mention + '</a>';
            });
            return replacedText;
        } else {
            return text;
        }
    } catch (e) {
        return text
    }
}

function printMessage(message, thread, index, e) {
    var arabic = /[\u0600-\u06FF]/;
    let html = '';
    try {

        if (message.type == 'cut') {
            html = '<div class="post profile-post" onclick="ajaxMsg(\'' + message.id + '\')" dir="cut"><div class="inner-post"><div class="post-header user-stored"><div class="pppi" style="background-image: url(' + (message.user.image) + ');"></div></div></div></div>';
            return html;
        }
        let media = '';
        let mediaType = '';
        switch (message.media_type) {
            case 'music':
                media = printMusic(message.media_content);
                mediaType = 'mv'
                break;
        }
        processColors((message?.media_content?.img), 5).then(cldt => {
            document.querySelectorAll('.post[dataid="' + message.id + '"] .inner-post .backdrob span').forEach(span => { span.style.background = `linear-gradient(45deg, ${cldt.color}, ${hexToRGBA(cldt.color, 0.35)})` })
        })

        const click = !message.is_anon ? 'ontouchstart="ib($(this),\'s\')" ontouchend="ib($(this))" ontouchmove="ib($(this))"' + " onclick=\"getUser('" + message.user.id + "',$(this))\"" : ''
        html = `
        <div class="post profile-post ${message.user.charm} ${mediaType} ${message.user.muted ? 'muted' : ''} ${message.media_type ? 'media' : ''} ${message.is_saved ? 'saved' : ''}" dir="${message.type}" ${message.user.muted ? 'muted="muted"' : ''} userid="${message.sender}" dataid="${message.id}">
            ${message.qoute ? printQoute(message.qoute) : ''}
            <div class="inner-post">
            <div class="backdrob"><span></span><span></span></div>
                ${index == 0 && thread.reposts ? printReposted(thread.reposts) : ''}
                <div class="more-post-btn" onclick="menuPost(this${e ? ',true' : ''})"><a></a></div>
                <div class="post-header user-stored">
                <div class="pppi usim" ${click} style="background-image: url('${(message.user.image)}');"></div>
                    <div class="post-profile-info ${message.user.verify} usv">
                        <span class="usfn">${message.user.fullname}</span>
                        <a class="usn">${message.user.username}</a>
                        <p>${message.user.date_short}</p>
                    </div>
                </div>
                ${media}
                <div class="post-text ${!nE(message.text) ? 'em' : ''} ontouchstart="bc($(this),'s')" ontouchend="bc($(this))" ontouchmove="bc($(this))" onclick="getMsg('${message.id}',null,$(this))" user="${message.user.username}">
                    <p class="${arabic.test(message.text?.split(' ')[0]) ? 'rtl' : 'ltr'}">${convertLinks(message.text)}</p>
                </div>
                <div class="tfpo ${index == 0 ? 'ps' : ''}"><span>${message.date[0]}<a></a>${message.date[1]}</span></div>
                <div class="post-footer">
                    <div class="icons-post">
                        ${index == 0 & !e ? '<div class="pico xupost repost" onclick="rp($(this))"></div><div class="pico xupost save" onclick="collEvent($(this))"></div>' : ''}
                        ${!e ? `<div class="pico xupost ${message.liked ? 'liked' : ''}" onclick="pl($(this))"><a>${message.likes_count == 0 ? '' : message.likes_count}</a></div>` : '<div class="msgs-replay-cont"><div class="reply-msgs" ontouchstart="op(this,\'s\')" ontouchend="op(this)" ontouchmove="op(this)" onclick="replyPage(this)"></div></div>'}
                    </div>
                </div>
            </div>
        </div>
    `;
    } catch (e) {
        console.error(e)
        return '';
    }
    return html;
}

function msg(json) {
    let html = '';
    json.data.forEach(element => {
        try {
            html += printMessage(element, {}, 0, true)
        } catch (e) {
            console.error(e);
        }
    });
    return html
}


async function loadMsgs(e) {
    const parent = document.querySelector('.inbox-container')
    const offset = parent.getAttribute('dtload') || 0
    if (parent.getAttribute('loading')) {
        return
    }
    let loaders = ''
    for (i = 0; i < 10; i++) {
        loaders += messageLoaderEffect
    }
    document.querySelector('.inbox-container').innerHTML = loaders
    parent.setAttribute('loading', 'true')
    fetch(`https://api.onvo.me/posts/v3/inbox/?get&offset=${offset}&dir=${e}&type=music`, {
        headers: {
            'Authorization': `${await getToken()}`
        }
    }).then(response => {
        return response.json()
    }).then(data => {
        parent.removeAttribute('loading')
        const html = msg(data)
        document.querySelector('.inbox-container').innerHTML = html
    }).catch(error => {
        parent.removeAttribute('loading')
        console.error(error)
    })
}

document.querySelector('.button-page.inbox-flex')?.addEventListener('click', async function () {
    await closePages()
    const profile = document.querySelector('.messages')
    loadMsgs()
    profile.classList.remove('hidden')
    await delay(50)
    profile.classList.add('center')
})
async function closeDiscovery() {
    const parent = document.querySelector('.discovery')
    parent.classList.remove('center')
    await delay(200)
    parent.classList.add('hidden')
    document.querySelector('.discover-categories').innerHTML = ''
}
async function showDiscovery() {
    const parent = document.querySelector('.discovery')
    parent.classList.remove('hidden')
    try {
        const oldApple = localStorage.getItem('applehome');
        if (oldApple) {
            printAppleMain(JSON.parse(oldApple))
            if (oldApple.expire > Date.now()) {
                return
            }
        }
        getMainApple().then(data => {
            printAppleMain(data)
        })
    } catch (e) { }

    await delay(50)
    parent.classList.add('center')

}
document.querySelector('.button-page.search-flex')?.addEventListener('click', async function () {
    await closePages()
    showDiscovery()
});
document.querySelector('.button-page.live-flex')?.addEventListener('click', async function () {
    await closePages()
    if (liveBody.classList.contains('live')) {
        showThePlayer();
        return
    }
    const profile = document.querySelector('.live-perview')
    profile.classList.remove('hidden')
    await delay(50)
    profile.classList.add('center')
})

document.querySelector('.back-live-wing').addEventListener('click', async function () {
    await closePages()
    document.querySelector('.button-page.home-flex').click()
    const profile = document.querySelector('.live-perview')
    await delay(200)
    profile.classList.add('hidden')
})

async function createLive(el) {
    try {
        if (el.classList.contains('disabled')) {
            return
        }
        const name = document.querySelector('.live-name-insert input').value
        const private = document.querySelector('.privacy-select').classList.contains('lock')
        el.classList.add('disabled')

        const response = await fetch('https://api.onvo.me/music/create-live', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getToken()}`
            },
            body: JSON.stringify({ name, private })
        })
        const data = await response.json()
        if (data.error) {
            if (data.code) {
                eval(data.code)
            } else {
                dialog(data.type, data.message)
            }
            return
        }
        if (data.status == 'success') {
            el.classList.remove('disabled')
            await joinParty(data.id, true)
            let obsSong = {}
            if (!globalInitialLive.id) {
                const allSongs = document.querySelectorAll('.song');
                const randomIndex = Math.floor(Math.random() * allSongs.length);
                const randomSong = allSongs[randomIndex];
                obsSong = getSongObject(randomSong)
            } else {
                obsSong = globalInitialLive;
            }
            playTrack(obsSong)
            setTimeout(() => {
                updatePlaying(currentSong.id ? currentSong : obsSong);
            }, 200)
        }
    } catch (e) {
        el.classList.remove('disabled')
        dialog('Error occured', 'Error while connecting to server, please wait or restart your app')
    }
}

document.querySelector('.submit-livego').addEventListener('click', async function () {
    createLive(this)
})

// getSoundcloudHome();

async function getMessagesHome() {
    const response = await fetch('https://api.onvo.me/music/messages', {
        headers: {
            Authorization: `Bearer ${await getToken()}`
        }
    })
    const data = await response.json()
    const html = printMessages(data)
    return html
}

function fireJoinMethod(liveJSON) {
    if (document.querySelector('.huge-join')) {
        return
    }
    const html = printLiveCard(liveJSON);
    document.body.insertAdjacentHTML('beforeend', `
    <div class="huge-join">
    <div class="close-premium-banner" onclick="document.querySelector('.huge-join').remove();"></div>
    ${html}
        <div class="buttons-flex-join">
    <div class="join-now-live ${!isWeb() ? 'main' : ''} " onclick="joinParty('${liveJSON.live_id}');document.querySelector('.huge-join').remove();">
    </div>
    ${isWeb() ? `
    <div class="join-now-live in-app" onclick="window.open('oave://live/?id=${liveJSON.live_id}')">
    </div>
    ` : ''}
    </div>
    </div>
    `)
}

async function nextHome() {
    const messages = await getMessagesHome()
    let msgs =
        `<div class="browse-by-generes home-section">
        <div class="head-tag container"><span>Users suggestions</span><a></a></div>
        <div class="generes-brows-container">
            <div class="suggestions-container swiper">
                <div class="inset-suggestions-slider swiper-wrapper">${messages}</div>
            </div>
            <div class="panger-vgrs indecator-suggestions"></div>
        </div>
    </div>`;

    if (!safeMode) {
        dataAsync = await getMainApple()
        dataAsync.sections.forEach((section, index) => {
            let x = '';
            if (index == 0) {
                x = msgs
            }
            const recent = scolledSongs(section.tracks, true)
            document.querySelector('.timeline').insertAdjacentHTML('beforeend', `${x}
            <div class="spacer"></div>
        <div class="head-tag container"><span>${section.title}</span><a></a></div>
        <div class="recently-played-container">
            <div class="inset-recently-played home-recent">${recent}</div>
        </div>
    `)
        })
    }
    // if (appleHome.songs) {
    //     const recent = scolledSongs(appleHome.songs.slice(5))
    //     document.querySelector('.outset-recently-played').insertAdjacentHTML('afterend', `
    //         <div class="spacer"></div>
    //     <div class="head-tag container"><span>You also may like</span><a></a></div>
    //     <div class="recently-played-container">
    //         <div class="inset-recently-played home-recent">${recent}</div>
    //     </div>
    // `)
    // }
}

async function nextStepScroll() {
    let html = `
        <div class="home-section banner-home premium-banner">
        <div class="inner-banner-home">
            <div class="live-radio-descriotion">
                <div class="premimu-tag">
                    <span>Premium</span>
                </div>
                <span>Join premium</span>
                <p>Premium opens doors to limitless music experiences</p>
            </div>
            <div class="join-now" onclick="showPremiumPage()"><span>Join now</span></div>
        </div>
    </div>
    `
    dataAsync = await getMainApple()
    let mini = ''
    if (dataAsync.newest) {
        let miniSongs = printMiniSongs(dataAsync.newest[1].tracks)
        mini =
            `<div class="home-section mini-songs-new">
        <div class="head-tag container"><span>Leatest releases</span><a></a></div><div class="newest-chart">
            <div class="grid-shot-set">
                ${miniSongs}
            </div>
        </div>
    </div>`
    }
    const sound = await getSoundcloudHome(true);
    document.querySelector('.timeline').insertAdjacentHTML('beforeend', html + mini + sound)
}

let messageInitilized;
let secoundInitialized;
window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;

    if (!messageInitilized) {
        if (scrollPosition >= 300) {
            messageInitilized = true
            nextHome()
        }
    }

    if (!secoundInitialized) {
        if (scrollPosition >= 2500) {
            secoundInitialized = true
            nextStepScroll();
        }
    }
});


let draggableSong
let lastSelected = {}
async function showMenu(parent, e) {
    document.querySelector('.switcher-menu').classList.remove('hidden');
    const back = document.querySelector('.switcher-menu-body')
    setTimeout(() => {
        back.classList.add('center-flex');
        if (!draggableSong) {
            draggableSong = new DraggableMenu({
                parent: '.switcher-menu-body',
                back: '.switcher-menu-back',
                onclose: () => {
                    back.classList.add('hidden')
                }
            });
        } else {
            draggableSong.update()
        }
    }, 50)

    let rawSongObj;

    if (e || parent.poster) {
        rawSongObj = parent
    } else {
        rawSongObj = getSongObject(parent)
    }

    lastSelected = rawSongObj

    const isExist = await checkObjectExists(rawSongObj.id, 'downloads')

    try {
        const html = printSong(rawSongObj);
        document.querySelector('.switcher-potintial').innerHTML = html
    } catch (e) {
        console.error(e)
    }
    if (isExist) {
        document.querySelector('.switch-component.download-ssc').classList.add('downloaded')
    } else {
        document.querySelector('.switch-component.download-ssc').classList.remove('downloaded')
    }

    if (lastSelected.id == currentSong.id && (!isParty || isOwner())) {
        document.querySelector('.play-more-related').classList.remove('hidden')
    } else {
        document.querySelector('.play-more-related').classList.add('hidden')
    }

    if (String(currentList.owner?.id) == localStorage.getItem('userid')) {
        document.querySelector('.adding-list-ssc').classList.add('saved')
    } else {
        document.querySelector('.adding-list-ssc').classList.remove('saved')
    }

    if (document.querySelector('.switcher-menu-body').getAttribute('last') == rawSongObj.id) {
        return
    }

    document.querySelector('.switcher-menu-body').setAttribute('last', rawSongObj.id)
    document.querySelector('.saving-ssc').classList.remove('saved')
    const data = await checkTrackInfo(rawSongObj.id, true)
    if (data.isSaved) {
        document.querySelector('.saving-ssc').classList.add('saved')
    }

}

document.querySelector('.play-more-related')?.addEventListener('click', function () {
    document.querySelector('.switcher-menu-back').click()
    queueTracks = relatedGlobal.data || relatedGlobal.artist
    miniDialog('Related added to queue')
})

document.querySelector('.saving-ssc')?.addEventListener('click', function () {
    if (liveBody.classList.contains('body')) {
        saveSong(this, lastSelected)
        return
    }
})

document.querySelector('.adding-list-ssc')?.addEventListener('click', async function () {
    document.querySelector('.switcher-menu-back').click()
    await delay(200)
    showAppendLists(this, lastSelected.id)
    return
})

document.querySelector('.lyrics-share')?.addEventListener('click', async function () {
    document.querySelector('.switcher-menu-back').click()
    await delay(200)
    openLyrics(lastSelected)
    return
})


async function saveList(el, id = currentList.id, api = currentList.api) {
    if (el.classList.contains('disabled')) {
        return;
    }
    let e = true;
    if (el.classList.contains('saved')) {
        e = false;
        el.classList.remove('saved')
    } else {
        el.classList.add('saved')
    }
    el.classList.add('disabled')
    fetch(`https://api.onvo.me/music/save${!e ? `/${id}` : ''}`, {
        method: e ? 'POST' : 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getToken()}`
        },
        body: JSON.stringify({ trackid: id, api, data, type: 'track' })
    }).then(response => {
        return response.json();
    }).then(data => {
        el.classList.remove('disabled')

    }).catch(e => {
        el.classList.remove('disabled')
        console.error(e)
    })
}


async function appendToList(el, id) {
    if (el.classList.contains('disabled')) {
        return
    }
    const method = el.classList.contains('added') ? 'DELETE' : 'POST'
    el.classList.add('disabled')
    fetch(`https://api.onvo.me/music/save`, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getToken()}`
        },
        body: JSON.stringify({ track: lastSelected, playlist_id: id, id: lastSelected.id, type: 'track' })
    }).then(response => {
        return response.json();
    }).then(data => {

        el.classList.remove('disabled')
        // document.querySelector('.back-replyer-switching').click()
        if (method == 'DELETE') {
            el.classList.remove('added')
        } else {
            el.classList.add('added')
        }
        const parent = el.closest('.playlist-inner-container')
        let count = parseFloat(parent.querySelector('.grid-list-info p').innerText.replace(' Tracks', '') || 0)
        parent.querySelector('.grid-list-info p').innerText = `${method == 'DELETE' ? count-- : count++} Tracks`
    }).catch(e => {
        el.classList.remove('disabled')
        console.error(e)
    })
}

async function sendToUser(el) {
    await reflexReply()
    const html = printSong(lastSelected)
    document.querySelector('.song-potintial-send').innerHTML = html
    const id = el.closest('.user-search').getAttribute('dataid')
    document.querySelector('.button-negrisco').setAttribute('dataid', id)
    document.querySelector('.button-negrisco').setAttribute('onclick', `sendMsg(this,'${id}')`)
    document.querySelector('.body-replyer-switching').removeAttribute('dir')
}

document.querySelector('.sending-to-friend')?.addEventListener('click', async function () {
    sendMusicToFriend()
    return
})

async function sendMusicToFriend() {
    document.querySelector('.switcher-menu-back').click()
    await delay(200)
    musicStream.classList.remove('hidden');
    musicStream.classList.add('sending');
    musicStream.setAttribute('sdir', 'msg');
    const flexSearchPlatforms = document.querySelector('.flex-search-platforms');
    flexSearchPlatforms.scrollLeft = flexSearchPlatforms.scrollWidth;
    document.querySelector('.platform.users').click();
    document.querySelector('.input-text-search input').setAttribute('placeholder', 'Search for user to send')
    setTimeout(() => {
        musicSearchContainer.classList.add('center-flex');
        draggableSearch.update();
    }, 50)
    document.querySelector('.button-negrisco.main').sendMsg('onclick', `sendMsg(this)`)

}

async function sendMsg(el, user = currentProfile.id) {
    if (el.classList.contains('disabled')) {
        return
    }
    el.classList.add('disabled')
    const hide = document.querySelector('.anonymous-on-box').classList.contains('checked') ? 'true' : ''
    const text = document.querySelector('.textarea-msg textarea').value
    const music = getSongObject(document.querySelector('.sender-potintial .song'))

    const params = { sub: 'submit', text: text, user: user, hide: hide, music: JSON.stringify(music), type: 'json' }

    try {
        const response = await fetch(`https://api.onvo.me/onvo/message/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${await getToken()}`
            },
            body: new URLSearchParams(params).toString()
        })

        const data = await response.json();
        if (data.statue == 'done') {
            dialog('Done!', 'Your message has been sent successfully')
            document.querySelector('.back-replyer-switching').click();
        }
        if (data.error) {
            dialog(data.title, data.error)
        }


    } catch (e) {
        dialog('Error occured', `There's error occured while sending message, ${e.message}`)

        console.log(e)
    }
    el.classList.remove('disabled')
}

async function showAppendLists(el, id) {
    const add = `
    <div class="playlist-create-container" onclick="document.querySelector('.back-replyer-switching').click();setTimeout(() => {createList()},200)" ${touchPackage}>
         <span></span>
         <a>Create playlist</a>
      </div>
    `
    let html = `
    <div class="playlist-add-container">
      <div class="playlist-inner-container loading-playlist-perview">
         <section><span class="gradient-loader-main"></span><span class="gradient-loader-main"></span><span class="gradient-loader-main"></span><span class="gradient-loader-main"></span></section>
         <div class="grid-list-info">
            <a class="gradient-loader-main"></a>
            <p class="gradient-loader-main"></p>
         </div>
         <div class="add-list-sub"></div>
      </div>
      ${add}
   </div>
    `;
    drag('options', html)
    fetch(`https://api.onvo.me/music/user/playlists?trackid=${id}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getToken()}`
        },
    }).then(response => {
        return response.json();
    }).then(data => {

        const html = printViewLists(data)
        document.querySelector('.playlist-add-container').innerHTML = html + add
    }).catch(e => {
        console.error(e)
    })
}


const printViewLists = (data) => {
    let html = ''

    data.forEach(list => {
        html += `
         <div class="playlist-inner-container" api="${list.api}" type="${list.type}" playlist-id="${list.playlist_id}" dataid="${list.id}">
         <section onclick="openPlaylist('${list.playlist_id}','${list.api || 'wave'}')">${list.perview.map(img => `<span style="background-image: url(${(img)})"></span>`).join('')}</section>
         <div onclick="openPlaylist('${list.playlist_id}','${list.api || 'wave'}')" class="grid-list-info">
            <a>${list.name}</a>
            <p>${list.tracks_count} tracks</p>
         </div>
         <div class="add-list-sub" onclick="appendToList(this,this.closest('.playlist-inner-container').getAttribute('dataid'))" ${touchPackage}></div>
         </div>
        `
    })
    return html
}

function showPremium(e) {
    let html = `
    <div class="premium-banner">
        <div class="premium-banner-back"></div>
        <div class="premium-banner-body">
            <div class="banner-home premium-banner">
                <div class="close-premium-banner" onclick="document.querySelector('.premium-banner').remove()"></div><div class="inner-banner-home">
                    <div class="live-radio-descriotion">
                        <div class="premimu-tag">
                            <span>Premium</span>
                        </div>
                        <span>Join premium</span>
                        <p>Premium opens doors to limitless music experiences</p>
                    </div>
                    <div class="join-now" onclick="showPremiumPage()" ${touchPackage}><span>Join now</span></div>
                </div>
                <div class="description-why-preimium">
                    <span></span>
                    <a>${e}</a>
                </div>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html)
}

function showDownload(song) {
    let html = `
    <div class="premium-banner">
        <div class="premium-banner-back"></div>
        <div class="premium-banner-body">
            <div class="banner-home premium-banner">
                <div class="close-premium-banner" onclick="document.querySelector('.premium-banner').remove()"></div><div class="inner-banner-home">
                    <div class="live-radio-descriotion">
                        <div class="premimu-tag">
                            <span>Airwave</span>
                        </div>
                        <span>Download app</span>
                        <p>To Immerse yourself in a limitless world of music and tracks</p>
                    </div>
                    <div class="join-now" onclick="showPremiumPage()" ${touchPackage}><span>Download</span></div>
                </div>
                <div class="description-why-preimium">
                    ${printSongRegular(song)}
                </div>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html)
}

let preimiumVideoStarted;
async function showPremiumPage() {
    document.querySelector('.subscriptions').classList.remove('hidden')
    const video = document.querySelector('#premiumrail')
    if (!preimiumVideoStarted) {
        video.src = '/assets/c.mp4'
        video.load()
        preimiumVideoStarted = true
    }
    video.play()
    await delay(50)
    document.querySelector('.subscriptions').classList.add('center')
}



document.querySelector('.download-ssc')?.addEventListener('click', function () {
    document.querySelector('.switcher-menu-back').click();
    if (this.classList.contains('downloaded')) {
        removeDownload(lastSelected)
        return
    }
    if (liveBody.classList.contains('body')) {
        downloadSong(lastSelected)
        return
    }
})
document.querySelector('.live-ssc')?.addEventListener('click', function () {
    if (liveBody.classList.contains('body')) {
        startLive(lastSelected)
        return
    }
})
document.querySelector('.shuffle-playlist')?.addEventListener('click', function () {
    this.classList.toggle('shuffled')
})
document.querySelector('.download-playlist')?.addEventListener('click', function () {
    dialog('Comming soon', 'Downloading entire playlist is currently unavilable, it will be avilable soon')
})

document.querySelector('.run-playlist').addEventListener('click', function () {
    this.classList.toggle('played')
    if (!document.querySelector('.music-section .running')) {
        if (currentList.tracks?.tracks?.length > 3) {
            queueTracks = currentList.tracks
        }
        playTrack(document.querySelector('.music-section .song-music-element .artist-title'))
    } else {
        handlePlayPause()
    }
})

async function showMainMenu() {
    let html = `
        <div class="mobile-menu">
            <div class="watch-list-back" onclick="closeMenuMobile(this)"></div>
            <div class="mobile-menu-container">
                <div class="mobile-menu-inset">
                    <div class="mobile-menu-element terms-menu" onclick="closeMenuMobile();setTimeout(policy,200)"><span>Terms and
                        privacy</span></div>
                    <div class="mobile-menu-element plus-menu" onclick="closeMenuMobile();setTimeout(() => {isPlus() ? getPlanDetails() : showPremiumPage()},200);"><span>Airwave Premium</span></div>
                    <div class="mobile-menu-element settings-menu" onclick="closeMenuMobile();setTimeout(showSettings,200)"><span>Settings</span></div>
                    <div class="mobile-menu-element report-menu" onclick="closeMenuMobile();interface('open','https://x.com/oave_me');"><span>Report a bug</span></div>
                    <div class="mobile-menu-element logout-menu" onclick="closeMenuMobile();setTimeout(logoutCheck,200)"><span>Log out</span></div>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html)
    await delay(10)
    document.querySelector('.mobile-menu-container').classList.add('center')
}

async function policy() {
    if (document.querySelector('.privacy-page')) {
        return
    }
    const response = await fetch('https://oave.me/policy/v2')
    const data = await response.text();
    let html = `<div class="privacy-page"><div class="privacy-header container"><div class="logo-privacy"><div class="logo-home"></div></div><div class="close-privacy" onclick="closePolicy()"></div></div><div class="inner-privacy-page container">${data}</div></div>`
    document.body.insertAdjacentHTML('beforeend', html)
}
function closePolicy() {
    document.querySelector('.privacy-page').remove()
}
async function closeMenuMobile() {
    document.querySelector('.mobile-menu-container').classList.remove('center')
    await delay(200)
    document.querySelector('.mobile-menu').remove();
}

function getApiCut(api) {
    switch (api) {
        case 'apple':
            return 'ap'
        case 'spotify':
            return 'sp'
        case 'soundcloud':
            return 'sc'
        case 'anghami':
            return 'an'
        case 'youtube':
            return 'yt'
        case 'ap':
            return 'anghami'
        case 'sp':
            return 'spotify'
        case 'yt':
            return 'youtube'
        case 'ap':
            return 'apple'
    }
}

document.querySelector('.share-player')?.addEventListener('click', async function () {
    document.querySelector('.switcher-menu-back').click();
    await delay(200)
    share(`https://oave.me/${getApiCut(currentSong.api)}/${currentSong.id}`, `Listen to ${currentSong.title} on Airwave`)
})
document.querySelector('.share-ssc')?.addEventListener('click', async function () {
    document.querySelector('.switcher-menu-back').click();
    await delay(200)
    share(`https://oave.me/${getApiCut(lastSelected.api)}/${lastSelected.id}`, `Listen to ${lastSelected.title} on Airwave`)
})
document.querySelector('.artist-profile-view')?.addEventListener('click', async function () {
    document.querySelector('.switcher-menu-back').click();
    await delay(200)
    if (lastSelected.api !== 'youtube') {
        dialog('Uavilable for now', 'Artist profile for this song is not avilable for now, will be avilable soon')
        return
    }
    openArtist(lastSelected.artistID)
})


let globalInitialLive = {}

async function startLive(song) {
    document.querySelector('.switcher-menu-back').click();
    await delay(200)
    if (!isPlus()) {
        showPremium(`Or continue with <text>Free trail</text>`)
        return;
    }
    globalInitialLive = song
    document.querySelector('.live-flex').click()
}

async function removeDownload(song = lastSelected) {
    const data = await getObject(song.id, 'downloads')
    await removeObject(String(song.id), 'downloads')
    document.querySelector(`.downloads-container .song[trackid="${data.id}"]`)?.remove()
    await fetch('/remove', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: data.path, id: data.yt })
    });
    miniDialog('Track removed')
}
let downloading = {}

async function downloadSong(song = lastSelected) {
    await delay(200)
    if (!isPlus()) {
        showPremium('Join premium to <text>download</text>')
        return;
    }
    let data = {}
    let YTCode = song.yt;

    const songs = document.querySelectorAll(`.song-music-element.song[trackid="${song.id}"]`)

    songs.forEach(song => { song.insertAdjacentHTML('beforeend', '<div class="loader-mini"><div class="loader-3 loader-main"><span></span></div></div>') })
    if (!song.source) {
        if (song.api !== 'soundcloud') {
            if (!YTCode) {
                const response = await fetch(`${origin}/get-id?q=${encodeURIComponent(`${song.title} ${song.artist}`)}`)
                const data = await response.json();
                YTCode = data.id
            }
            if (!YTCode) {
                dialog('Error occured', 'There\'s an error occured while downloading track, please make report by clicking here <div class="report"><span>Report</span></div>')
                return
            }
            const response = await fetch(`/get-source/?id=${YTCode}`)
            data = await response.json();
            console.log('downloading', data)
        } else {
            console.log('soundclouding')
            data = await getTrackByUrl(song.id, 'soundcloud', 'id');
        }
    } else {
        data = song.source
    }
    downloading[song.id] = song
    downloading[song.id].yt = YTCode
    coreSocket.send(JSON.stringify({ ct: 'download', trackid: song.id, id: YTCode, url: data.audio || data.url }))
    fetch(pI(song.posterLarge))
    fetch(pI(song.poster))
    songs.forEach(song => { song.querySelector('.loader-mini').remove() })
}

document.querySelector('.switcher-menu-back').addEventListener('click', function () {
    document.querySelector('.switcher-menu-body').classList.remove('center-flex');
    document.querySelector('.switcher-menu-body').removeAttribute('style');
    setTimeout(() => {
        document.querySelector('.switcher-menu').classList.add('hidden');
    }, 200)
})



let downloaded = []

async function runReformLib(e, limit = 20, offset = 0) {
    if (e === 'downloads') {
        const downloaded = await getAllObjects('downloads', 'musicDB', limit, offset);
        offsetLib += downloaded.length
        const { html } = printSongsRegular(downloaded);
        document.querySelector('.downloads-container').insertAdjacentHTML('beforeend', html);
        const count = await getObjectCount('downloads');
        document.querySelector('.downloads-tracks-container .favorites-head span a').innerText = count;
    } else {

    }
}

async function handleDownloadProccess(data) {
    if (data.ct == 'download_progress') {
        document.querySelectorAll(`.song[trackid="${data.trackid}"] .song-poster`).forEach(poster => {
            poster.innerHTML = `<div class="loader-conter p-${data.percent}"></div>`
        })
        if (data.status == 'finished') {
            delete downloading[data.trackid].source
            downloading[data.trackid].path = data.path
            await setObject(data.trackid, downloading[data.trackid], 'downloads')
            const lyrics = await fetchLyrics(downloading[data.trackid], downloading[data.trackid].yt)
            await setObject(data.trackid, lyrics, 'lyrics')
            delete downloading[data.trackid]
            miniDialog('Download complete')
        }
    }
}

let isOffline = false
async function goOnline() {
    if (isOffline) {
        window.location.reload();
    }
}
async function check(streamUrl) {
    const response = await fetch('/test', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: streamUrl })

    });
    const data = await response.json()
    return data.isValid
}

async function goOffline(e) {
    if (isOffline) {
        return
    }
    const connection = await check('https://google.com');
    if (connection && !e) {
        return;
    }
    isOffline = true
    let banner = `<div class="home-section banner-home offline-banner">
        <div class="inner-banner-home">
            <div class="live-radio-descriotion">
                <span>You are offline</span>
                <p>Start listen with your freinds in same time in live party</p>
            </div>
            <div class="join-now" onclick="document.querySelector('.library-flex').click()"><span>See downloads</span></div>
        </div>
    </div>`;
    let mini = ''
    const count = await getObjectCount('downloads');
    if (count > 0) {
        downloaded = await getAllObjects('downloads')
        if (count < 10) {
            const { html } = printSongsRegular(downloaded, 100, 0, true);
            mini = `
                <div class="most-terinding-hits home-section">
                    <div class="head-tag container"><span>Your downloads</span></div>
                    <div class="trendings-inset-hits main-inset-hits">${html}</div>
                </div>
            `
        } else {
            let miniSongs = printMiniSongs(downloaded, true)
            mini = `< div class="home-section mini-songs-new" >
                <div class="head-tag container"><span>Leatest releases</span><a></a></div><div class="newest-chart">
                    <div class="grid-shot-set">
                        ${miniSongs}
                    </div>
                </div>
            </div > `
        }
        document.querySelector('.timeline').innerHTML = banner + mini
    } else {
        document.querySelector('.going-live').innerHTML = banner
        document.querySelector('.home-section').remove()
    }
    document.body.classList.add('offline')
    document.querySelector('.loadermain')?.remove()
}

const searcher = document.querySelector('.discovery-body')

document.querySelector('.input-search input').addEventListener('input', function (event) {
    clearTimeout(timeSearch)
    const q = this.value;
    if (!nE(q, true)) {
        searcher.classList.remove('searching')
        return;
    }
    if (event.key === 'Enter') {
        event.preventDefault();
        clearTimeout(timeSearch);
        searcher.classList.add('searching')
        search(q, true);
        return
    }
    timeSearch = setTimeout(() => {
        searcher.classList.add('searching')
        search(q, true)
    }, 500)
})

// let globalResolve;
// var arrowicon = '<div class="refresh-arrow"></div>';
// var roller = '<div class="roller-refresh"><div class="lds-roller-main"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>';
// var homerefresh = PullToRefresh.init({
//     mainElement: '.timeline',
//     triggerElement: '.timeline',
//     onRefresh: function (cb) {
//         globalResolve = cb;
//         console.log('refreshed')
//     },
//     shouldPullToRefresh: function () {
//         return true;
//     },
//     iconArrow: arrowicon,
//     iconRefreshing: roller,
//     distThreshold: 50,
//     resistanceFunction: t => Math.min(1, t / 2)
// });

// function finishPullToRefresh() {
//     if (globalResolve) {
//         globalResolve();
//         globalResolve = null;
//     }
// }
