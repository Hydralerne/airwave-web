document.querySelectorAll('.sw-effect').forEach(sw => {
    sw.addEventListener('touchstart', function () {
        this.classList.add('texts-start-effect')
    })
    sw.addEventListener('touchend', function () {
        this.classList.remove('texts-start-effect')
    })
    sw.addEventListener('touchmove', function () {
        this.classList.remove('texts-start-effect')
    })
})

document.querySelectorAll('.bgwf-effect').forEach(sw => {
    sw.addEventListener('touchstart', function () {
        this.classList.add('bgwf-start-effect')
    })
    sw.addEventListener('touchend', function () {
        this.classList.remove('bgwf-start-effect')
    })
    sw.addEventListener('touchmove', function () {
        this.classList.remove('bgwf-start-effect')
    })
})

function ep(el, e) {
    if (e) {
        el.classList.add('bgwf-start-effect')
        return
    }
    el.classList.remove('bgwf-start-effect')
}


function op(el, e) {
    if (e) {
        el.classList.add('texts-start-effect')
        return
    }
    el.classList.remove('texts-start-effect')
}
const loaderArtist = `<div class="artist-element loader-artist"><span class="gradient-loader-main"></span><a class="gradient-loader-main"></a><div class="marker"></div></div>`
const songLoaderEffect = `
<div class="song-music-element loader-music">
    <div class="song-element-poster gradient-loader"> </div>
    <section class="artist-title">
        <span class="gradient-loader"></span>
        <a class="gradient-loader"></a>
    </section>
</div>`;


const messageLoaderEffect = `
<div class="post loader-post">
    <div class="inner-post">
        <div class="post-header user-stored">
            <div class="pppi usim gradient-loader-main"></div>
            <div class="post-profile-info  usv">
                <span class="usfn gradient-loader-main"></span>
            </div>
        </div>
        <div class="post-music">
            <div class="inner-post-music song">
                <div class="post-music-image song-poster gradient-loader-main"></div>
                <div class="info-music-post artist-title"><span class="gradient-loader-main"></span><a
                        class="gradient-loader-main"></a></div>
            </div>
        </div>
    </div>
</div>
`

async function resetPlayList(e) {
    let slide = '<div class="swiper-slide playlist-poster-slider"></div>'
    document.querySelector('.playlists-page .imgs-colls-bv section').innerHTML = '<span></span><span></span><span></span><span></span>'
    document.querySelector('.playlist-name-header').innerText = ''
    document.querySelector('.user-list-avatar').removeAttribute('style')
    document.querySelector('.playlist-name span').innerText = ''
    let songs = ''
    let slides = ''
    for (i = 0; i < 10; i++) {
        songs += songLoaderEffect
        slides += slide
    }
    doneloadList = false
    currentList = {}
    listOffset = 0
    document.querySelector('.music-section').innerHTML = songs
    document.querySelectorAll('.playlist-name section a').forEach(a => { a.innerText = '' })
    document.querySelector('.playlists-page').className = `playlists-page page ${!e ? 'center' : ''} loading`
    document.querySelector('.inset-playlist-posters-slider').innerHTML = slides
    await delay(50)
    if (e) {
        mvhot.destroy();
        mvhot = null
    } else {
        updateListSlider();
    }
}

const recentLoader = `
<div class="song-recent loader-song-lib">
    <div class="track-poster song-poster gradient-loader-main"></div>
    <section class="artist-title">
        <span class="gradient-loader-main"></span>
        <a class="gradient-loader-main"></a>
    </section>
</div>
`

const listLoader = `
<div class="playlist-component-square loader-song-list">
    <div class="perview-lists">
        <section><span class="gradient-loader-main"></span><span class="gradient-loader-main"></span><span class="gradient-loader-main"></span><span class="gradient-loader-main"></span></section>
    </div>
    <div class="playlist-description-square">
        <span class="gradient-loader-main"></span>
        <a class="gradient-loader-main"></a>
    </div>
    <div class="more-list"></div>
</div>
`
const artistLoaderLib = `
<div class="artist-card loader-artist">
    <span class="gradient-loader-main"></span>
    <a class="gradient-loader-main"></a>
</div>
`

const liveCardLoad = `
<div class="live-card loading-live">      
                            <div class="live-description-info">
                                <span></span>
                                <a></a>
                            </div>
                            <div class="users-joined-info">
                                <div class="avatars-live">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <a></a>
                                </div>
                            </div>
                            <div class="song-hosted-live">
                                <div class="song-live-poster"></div>
                                <section>
                                    <text></text>
                                    <a></a>
                                </section>
                                <div class="join-live-btn"><span></span></div>
                            </div>
                            
                        </div>
`


function resetLib() {

    try {

        let artists = ''
        let lists = ''
        let recents = ''
        for (i = 0; i < 5; i++) {
            recents += recentLoader
            lists += listLoader
            artists += artistLoaderLib
        }

        document.querySelector('.libraries-lists-container').classList.remove('hidden')
        document.querySelector('.saved-tracks-container').classList.remove('hidden')
        document.querySelector('.recent-library').classList.remove('hidden')
        document.querySelector('.features-artists-lib').classList.remove('hidden')

        document.querySelector('.library-body .inset-recently-played').innerHTML = recents
        document.querySelector('.library-body .inset-playlists-slider-square').innerHTML = lists
        document.querySelector('.library-body .inset-artists').innerHTML = artists
    } catch (e) {
        console.error(e)
    }
}


function resetArtist() {
    let loaderSongs = ''
    let artists = ''
    let recents = ''
    for (i = 0; i < 10; i++) {
        loaderSongs += songLoaderEffect
        artists += artistLoaderLib
        recents += recentLoader
    }
    document.querySelector('.artist-popular').innerHTML = loaderSongs
    document.querySelector('.inset-albums-popular').innerHTML = loaderSongs
    document.querySelector('.similar-artist-artist').innerHTML = loaderSongs
}

function loadProfile() {

}

const touchPackage = `ontouchstart="op(this,true)" ontouchend="op(this)" ontouchmove="op(this)"`
const touchPackageV2 = `ontouchstart="ep(this,true)" ontouchend="ep(this)" ontouchmove="ep(this)"`
