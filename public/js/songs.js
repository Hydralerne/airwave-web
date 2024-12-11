
function printSongs(data, dir, listData, e) {
    let html = '';
    data.forEach(song => {
        try {
            if (dir == 'search') {
                const posterDetails = filterPosterLarge(song.posterLarge, song.poster);
                html += `<div class="music-search-component song ${currentSong?.id == song.id ? 'running' : ''}" duration="${song.duration}" ${song.album ? `album="${encodeURIComponent(song.album)}"` : ''} ${song.kind == 'album' ? 'kind="album"' : ''} ${song.artistID ? `artist-id="${song.artistID}" ` : ''}${song.albumID ? `album-id="${song.albumID}"` : ''} trackid="${song.id}" api="${song.api}">
                    <div class="song-poster" onclick="playTrack(this)" data-poster="${song.poster?.url || song.poster}" data-size-large="${posterDetails.size}" data-poster-large="${posterDetails.image}" style="background-image: url('${pI(song.poster?.url || song.poster, true)}')"></div>
                    <div class="artist-title audio-control" onclick="playTrack(this)" protocol="${song.audio?.protocol}" data-audio="${song.audio?.url}">
                        <span>${song.title}</span>
                        <a>${song.artist}</a>
                    </div>
                    <div class="more-song-search" onclick="showMenu(this.closest('.song'))"></div>
                    <div class="add-song" onclick="addTrack(this)"></div>
                    <div class="send-song-inner" onclick="sendTrack(this)"></div>
                    <div class="play-pause-song hidden"></div>
                </div>`;
            } else {
                html += printSong(song);
            }
        } catch (e) {
            console.log(e)
        }
    });
    let list = '';
    let perview = '';
    if (e) {
        perview = `
            <div class="imgs-colls-bv main-colls-bv">
                <section>${data.slice(0, 4)?.map(img => { return `<span data-img="${img.poster?.url || img.poster}" style="background-image: url('${(img.poster?.url || img.poster)}')"></span>` }).join('')}</section>
            </div>`
    }
    if (listData) {
        list = `
        <div class="playlist-search">
            ${perview}
            <span dataid="${listData.owner?.id}" api="${listData.api}" style="background-image: url(${(listData.owner?.image)})" class="playlist-user"></span>
            <div class="playlist-info">
                <span>${listData.name}</span>
                <a><p>${listData.owner?.name || 'Playlist owner'}</p><text>${listData.tracks_count} tracks</text></a>
            </div>
            <div class="add-full-list" api="${listData.api}" dataid="${listData.id}" data-number="${listData.tracks_number}" ${e ? `onclick="importList(this)"` : ''}><span>Add playlist</span></div>
        </div>`
        if (e) {
            return (list);
        }
    }
    return list + html
}

function scolledSongs(data, e, c) {
    let html = ''
    data.forEach(song => {
        const posterDetails = filterPosterLarge(song.posterLarge, song.poster);
        html += `
            <div class="song-recent song ${currentSong?.id == song.id ? 'running' : ''}" onclick="${song.kind == 'playlist' ? `openPlaylist('${song.id}','${song.api}')` : (song.kind == 'podcast' ? 'openPodcast(this)' : 'playTrack(this)')}" duration="${song.duration}" ${song.album ? `album="${encodeURIComponent(song.album)}"` : ''} ${song.kind == 'album' ? 'kind="album"' : ''} ${song.artistID ? `artist-id="${song.artistID}" ` : ''} ${song.albumID ? `album-id="${song.albumID}"` : ''} api="${song.api}" trackid="${song.id}">
                <div class="track-poster song-poster" data-poster="${song.poster?.url || song.poster}" data-size-large="${posterDetails.size}" data-poster-large="${posterDetails.image}" style="background-image: url('${pI(posterDetails.image.replace('600x600', '500x500'), e, c)}')"></div>
                <section class="artist-title">
                    <span class="track-title">${song.title}</span>
                    <a class="track-artist">${song.artist}</a>
                </section>
            </div>`
    })
    return html
}

function printMiniSongs(data, e) {
    let miniSongs = ''
    data?.forEach(track => {
        miniSongs += `
        <div class="song mini-song" duration="${track.duration}" ${track.album ? `album="${encodeURIComponent(track.album)}"` : ''} ${track.kind == 'album' ? 'kind="album"' : ''} ${track.artistID ? `artist-id="${track.artistID}" ` : ''} ${track.albumID ? `album-id="${track.albumID}"` : ''} trackid="${track.id}" api="${track.api}">
            <div class="song-poster" onclick="playTrack(this)" data-poster="${track.poster}" data-poster-large="${track.posterLarge}" style="background-image: url('${proxy(track.poster, e)}');"></div>
            <section class="artist-title" onclick="playTrack(this)"><span>${track.title}</span><a>${track.artist}</a></section>
            <div class="song-complay">
                <span></span>
                <span onclick="showMenu(this.closest('.song'))"></span>
            </div>
        </div>`;
    })
    return miniSongs
}

function printSongRegular(track, e, c) {
    const posterDetails = filterPosterLarge(track.posterLarge, track.poster)
    return `
        <div class="song-music-element song ${currentSong?.id == track.id ? 'running' : ''}"${track.path ? ` path="${track.path}" ` : ''}${track.youtube ? ` yt="${track.youtube}" ` : ''} duration="${track.duration}" ${track.album ? `album="${encodeURIComponent(track.album)}"` : ''} ${track.kind == 'album' ? 'kind="album"' : ''} ${track.artistID ? `artist-id="${track.artistID}" ` : ''} ${track.albumID ? `album-id="${track.albumID}"` : ''} trackid="${track.id}" api="${track.api}">
            <div onclick="playTrack(this)" class="song-element-poster song-poster" data-poster="${track.poster?.url || track.poster}" data-size-large="${posterDetails.size}" data-poster-large="${posterDetails.image}" style="background-image: url('${e ? proxy(track.poster?.url || track.poster, e, c) : (track.poster?.url || track.poster)}')"></div>
            <section class="artist-title" onclick="playTrack(this)"><span>${track.title}</span><a>${track.artist}</a></section>
            <div class="song-complay" ${touchPackageV2}>
                <span></span>
                <span onclick="showMenu(this.closest('.song'))"></span>
            </div>
        </div>`;
}
function printSongsRegular(tracks, data = { limit: 20, offset: 0 }, limit = data.limit || 20, offset = data.offset || 0, e = data.proxy, c = data.download) {
    let html = '';
    let slider = '';
    for (let index = offset; index < tracks.length; index++) {
        if (limit && index >= offset + limit) {
            break;
        }

        const track = tracks[index];
        html += printSongRegular(track, e, c)
        if (index < 9) {
            try {
                const posterDetails = filterPosterLarge(track.posterLarge, track.poster)
                slider += `<div trackid="${track.id}" onclick="playTrack(document.querySelector(\`.song[trackid='${track.id}']\`));" class="swiper-slide playlist-poster-slider" style="background-image: url(${proxy(posterDetails.image, e, c)});"></div>`
            } catch (e) {

            }
        }
    }

    return { html, slider }
}

function printLiveSong(data) {
    const posterDetails = filterPosterLarge(data.posterLarge, data.poster);
    let html = `
    <div class="song-chat msg-core song" duration="${data.duration}" ${data.album ? `album="${encodeURIComponent(data.album)}"` : ''} ${data.artistID ? `artist-id="${data.artistID}" ` : ''} ${data.kind == 'album' ? 'kind="album"' : ''} ${data.albumID ? `album-id="${data.albumID}"` : ''} api="${data.api}" trackid="${data.id}" dataid="${data.msgid}">
        <div class="poster-chat song-poster" data-poster="${data.poster?.url || data.poster}" data-size-large="${posterDetails.size}" data-poster-large="${posterDetails.image}" style="background-image: url('${(data.poster?.url || data.poster)}')"></div>
        <div class="song-info-chat artist-title" onclick="playTrack(this)"><span>${data.title}</span><a>${data.artist}</a></div>
        <div class="song-chat-play">
            <div class="save-song" onclick="saveSong(this,getSongObject(this.closest('.song')))"></div>
            <div class="add-song" onclick="addTrack(this)"></div>
        </div>
    </div>`;
    processColors(pI((data.poster?.url || data.poster), true), 5).then(cldt => {
        document.querySelector('.song-chat.msg-core[trackid="' + data.id + '"]').style.background = `linear-gradient(45deg, ${cldt.color}, ${hexToRGBA(cldt.color, 0.35)})`
    })
    return html
}

function printSong(song, e) {
    const posterDetails = filterPosterLarge(song.posterLarge, song.poster);
    return `
                <div class="music-component song ${currentSong?.id == song.id ? 'running' : ''}" duration="${song.duration}" ${song.album ? `album="${encodeURIComponent(song.album)}"` : ''} ${song.kind == 'album' ? 'kind="album"' : ''} ${song.artistID ? `artist-id="${song.artistID}" ` : ''}${song.albumID ? `album-id="${song.albumID}"` : ''} trackid="${song.id}" api="${song.api}">
                    <div class="arrange"></div>
                    <div class="song-poster" onclick="playTrack(this)" data-poster="${song.poster?.url || song.poster}" data-size-large="${posterDetails.size}" data-poster-large="${posterDetails.image}" style="background-image: url('${pI(song.poster?.url || song.poster, e)}')"></div>
                    <div class="artist-title audio-control" onclick="playTrack(this)" protocol="${song.audio?.protocol}" data-audio="${song.audio?.url}">
                        <span>${song.title}</span>
                        <a>${song.artist}</a>
                    </div>
                    <div class="remove-delete-song">
                        <div class="save-song" onclick="saveSong(this,this.closest('.song').getAttribute('trackid'),this.closest('.song').getAttribute('api'))"></div>
                        <div class="remove-song" onclick="removeTrack(this)"></div>
                    </div>
                </div>`
}

function printFavs(song) {
    const posterDetails = filterPosterLarge(song.posterLarge, song.poster.url);
    let html = `
        <div class="favorites-components active-favorites song" onclick="if(this.closest('.favorites').classList.contains('editing')){ this.remove() }else { playTrack(this) }" duration="${song.duration}" ${song.album ? `album="${encodeURIComponent(song.album)}"` : ''} ${song.kind == 'album' ? 'kind="album"' : ''} ${song.artistID ? `artist-id="${song.artistID}" ` : ''} ${song.albumID ? `album-id="${song.albumID}"` : ''} api="${song.api}" trackid="${song.id}">
            <div class="song-poster" data-poster="${song.poster?.url || song.poster}" data-size-large="${posterDetails.size}" data-poster-large="${posterDetails.image}" style="background-image: url('${pI(posterDetails.image)}')"></div>
           <section class="artist-title">
                <span class="track-title">${song.title}</span>
                <a class="track-artist">${song.artist}</a>
            </section>
        </div>`
    return html
}


function filterPosterLarge(large, poster) {
    let image;
    let size = 500;

    if (large) {
        image = large?.url || large;
        size = large?.width
        poster = poster?.url || poster
    }
    if (poster?.includes('&size')) {
        image = poster?.split('&size')[0];
        size = 520;
    }
    if (!image) {
        image = poster?.replace('large', 't500x500');

    }

    return { image, size }
}

function printAlbums(data) {
    let albumsData = ''
    data?.forEach(album => {
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
    return albumsData
}