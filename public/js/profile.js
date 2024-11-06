
let userData

async function getUserData(id) {

    if (userData && !id) {
        return userData
    }

    return await fetch(`https://api.onvo.me/music/user/${id ? id : 'info'}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getToken()}`
        }
    }).then(response => {
        return response.json();
    }).then(data => {
        if (!id) {
            userData = data
        }
        return data
    }).catch(e => {
        console.error(e)
        return e
    })
}

let profileTip
async function openProfile(id) {
    await closePages()
    const profile = document.querySelector('.profile')
    const oldData = localStorage.getItem('profile');
    if(currentSong.id && liveBody?.classList.contains('center')){
        minimizePlayer();
    }
    const isOwner = String(id) == localStorage.getItem('userid') || !id
    if (isOwner) {
        profile.classList.add('owner')
        if (oldData) {
            const json = JSON.parse(oldData)
            printProfile(json)
            currentProfile = json
        }
    } else {
        profile.classList.remove('owner')
    }

    profile.classList.add('center')
    const data = await getUserData(id)
    localStorage.setItem('profile', JSON.stringify(data))
    currentProfile = data
    printProfile(data)
    if (isOwner) {
        document.querySelector('.favorites').classList.remove('hidden')
        if (document.querySelectorAll('.favorites-components.active-favorites').length == 0 && !document.querySelector('.adding-fav')) {
            let fav = `<div class="favorites-components adding-fav" onclick="addFavorites()"><div class="song-poster"></div><span>Add favourites</span></div>`
            document.querySelector('.inset-favorites').insertAdjacentHTML('afterbegin', fav)
            if (!document.querySelector('.info-add-favs')) {
                document.querySelector('.inset-favorites').insertAdjacentHTML('beforeend', '<div class="info-add-favs"><span>Add your favourite tracks in your profile, you can add up to 10 tracks</span></div>')
            }
        } else {
            document.querySelector('.favorites').insertAdjacentHTML('afterbegin', '<div class="edit-favs" onclick="editFavs();"></div>')
        }
    }
}


function prepareLists(data) {
    console.log(data)
    let lists = printListsSquare(data.playlists)
    document.querySelector('.inset-playlists-slider-square').innerHTML = lists
}

function printLists(data) {
    let lists = ''
    data.forEach(list => {
        try {
            lists += `
            <div class="playlist-component" onclick="openPlaylist('${list.id}','wave')">
                <div class="imgs-colls-bv">
                    <section>${list?.perview?.map(img => { return `<span style="background-image: url('${pI(img)}')"></span>` }).join('')}</section>
                </div>
                <div class="playlist-description">
                    <span>${list.name}</span>
                    <a>${list.tracks_count} Tracks</a>
                </div>
                <div class="save-list"></div>
            </div>
            `
        } catch (e) {
            console.error(e)
        }
    })
    return lists
}

function printListsSquare(data) {
    let lists = ''
    data.forEach(list => {
        try {
            const perviews = list?.perview?.map(img => { return `<span style="background-image: url('${pI(img)}')"></span>` })
            if(perviews.length < 4){
                for(i=0; i < (6 - perviews.length); i++){
                    perviews.push('<span></span>')
                }
            }
            lists += `
            <div class="playlist-component-square" api="${list.api}" onclick="openPlaylist('${list.type == 'saved' ? 'saved' : list.playlist_id}','${list.api}'${list.type == 'saved' ? `,'${list.id}'` : ',null'},'${list.public_id}')">
                <div class="perview-lists">
                    <section>${perviews.join('')}</section>
                </div>
                <div class="playlist-description-square">
                    <span>${list.name}</span>
                    <a>${list.tracks_count} Tracks</a>
                </div>
                <div class="more-list"></div>
            </div>
            `
        } catch (e) {
            console.error(e)
        }
    })
    return lists
}

async function printProfile(data) {
    if(data.live){
        document.querySelector('.profile-image').setAttribute('onclick',`joinParty('${data.live}')`)
        document.querySelector('.profile').classList.add('live')
    }else {
        document.querySelector('.profile').classList.remove('live')
    }
    document.querySelector('.profile-image').style.backgroundImage = `url(${data.image?.replace('/profile/', '/profile_large/')})`
    document.querySelectorAll('.profile-background span').forEach(span => {
        span.style.backgroundImage = `url(${data.image})`
    })
    document.querySelector('.top-profile-info span').innerText = data.fullname
    document.querySelector('.top-profile-info a').innerText = data.bio
    document.querySelector('.following-value').innerText = formatNumber(data.following)
    document.querySelector('.followers-value').innerText = formatNumber(data.followers)
    document.querySelector('.score-value').innerText = formatNumber(data.artists)
    if (currentPage !== 'profile') {
        // history.pushState({ page: 'profile',id: data.id,username: data.username }, `${data.fullname} (@${data.username}) • Airwave profile`,`/${data.username}`)
    }
    if (data.followed) {
        document.querySelector('.profile-button.follow-btn').classList.add('followed')
    } else {
        document.querySelector('.profile-button.follow-btn').classList.remove('followed')
    }
    getColors(data.image, 5).then(colors => {
        const shade = colors.shades[4]
        const color = colorEqualizer('#fec5eb', shade)
        document.querySelector('.profile-button.follow-btn').style.backgroundColor = color
    })
    if (!data.favorites || data.favorites?.length == 0) {
        document.querySelector('.favorites').classList.add('hidden')
    } else {
        document.querySelector('.favorites').classList.remove('hidden')
        let favorites = ''
        data.favorites.forEach(song => {
            favorites += printFavs(song);
        })
        document.querySelector('.inset-favorites').innerHTML = favorites
    }
    prepareLists(data)
}


async function followUser(el, id) {
    if (el.classList.contains('disabled')) {
        return
    }
    el.classList.add('disabled')
    fetch('https://api.onvo.me/music/create-live', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getToken()}`
        }
    }).then(response => {
        return response.json();
    }).then(data => {
        if (data.status == 'success') {

        }
        el.classList.remove('disabled')
    }).catch(e => {
        el.classList.remove('disabled')
        console.error(e)
    })
}

async function closeSettings() {
    const parent = document.querySelector('.settings-page-body')
    parent.classList.remove('center')
    await delay(200)
    document.querySelector('.settings-page-container').remove();
}

async function showSettings() {
    const name = localStorage.getItem('fullname')
    const username = localStorage.getItem('username')
    const image = localStorage.getItem('image')
    const settingsPage = `
        <div class="settings-page-container hidden">
            <div class="settings-page-back" onclick="closeSettings()"></div>
            <div class="settings-page-body">
                <div class="slider-settings-section">
                    <div class="slide-first-shit">
                        <div class="settings-section-container">
                            <div class="section-setting subscriptions-settings" onclick="subsDT()" ${touchPackage}>
                                <span></span>
                                <section><a>Subscriptions</a><p>Manage your subscribtion</p></section>
                            </div>
                            <div class="section-setting account-settings" onclick="goAccount()" ${touchPackage}>
                                <span></span>
                                <section><a>Account</a><p>Account details and control</p></section>
                            </div>
                            <div class="section-setting audio-settings" onclick="goAudio();" ${touchPackage}>
                                <span></span>
                                <section><a>Audio &amp; playback</a><p>Manage audio settings &amp; quality</p></section>
                            </div>
                            <div class="section-setting messageing-settings" ${touchPackage}>
                                <span></span>
                                <section><a>Messaging</a><p>Manage profile messaginggs</p></section>
                            </div>
                        </div>
                        <div class="bottom-shit-sets container">
                            <div class="avatar-set-bottom" style="background-image: url('${image}')"></div>
                            <section><span>${name}</span><a>@${username}</a></section>
                            <div class="logout" onclick="logoutCheck()"></div>
                        </div>
                    </div>
                    <div class="secound-slid-shit">

                    </div>
                </div>
            </div>
        </div>
    `

    if (!document.querySelector('.settings-page-container')) {
        document.body.insertAdjacentHTML('beforeend', settingsPage)
    }
    const parent = document.querySelector('.settings-page-container')
    parent.classList.remove('hidden')
    await delay(50)
    document.querySelector('.settings-page-body').classList.add('center')
}

goAccount = async function () {
    const html = `
            <div class="account-main-container container">
                <div class="header-sets-assc">
                    <span>Edit information</span>
                    <p>To edit your account information, click button below to edit from ONVO account</p>
                </div><div class="edit-information edit-in-onvo" onclick="interface('web','https://onvo.me?token=${localStorage.getItem('token')}')"></div><div class="header-sets-assc">
                    <span>Delete account</span>
                    <p>This option will delete your account and all related data, saved tracks, playlists, everything</p>
                </div><div class="edit-information low-set" onclick="logoutCheck(true);"></div>
            </div>    
            <div class="back-main-settings" onclick="resetSets();"></div>`
    document.querySelector('.secound-slid-shit').innerHTML = html
    await delay(10);
    document.querySelector('.slider-settings-section').style.transform = 'translateX(100%)'
}

async function goAudio() {
    const html = `
        <div class="audio-settings-control container">
            <div class="audio-quality-section">
                <div class="head-audio-sets">
                    <span>Audio quality</span>
                </div>
                <div class="audios-sets-choose">
                    <section onclick="choseAudio(this)" data-audio="low"><span>Lowest</span><a>48 Kps</a></section>
                    <section onclick="choseAudio(this)" data-audio="medium"><span>Low</span><a>64 Kps</a></section>
                    <section onclick="choseAudio(this)" data-audio="heigh"><span>Heigh</span><a>128 Kps</a></section>
                    <section onclick="choseAudio(this)" data-audio="ultra"><span>Ultra</span><a>250 Kps</a></section>
                </div>
            </div>
            <div class="genral-settings-audio">
                <div class="head-audio-sets">
                    <span>Genral settings</span>
                </div>
                <div class="boxes-check">
                    <section onclick="toggleSwitchSets(this)" data-sets="audioMix"><span>Keep playing audio while other audio is running (Mix with others)</span><div class="box ${currentSettings.audioMix ? 'checked' : ''}"></div></section>
                    <section onclick="toggleSwitchSets(this)" data-sets="autoDownload"><span>Auto download tracks after saving</span><div class="box ${currentSettings.autoDownload ? 'checked' : ''}"></div></section>
                    <section onclick="toggleSwitchSets(this)" data-sets="autoShuffle"><span>Auto shuffle played songs from recommendations</span><div class="box ${currentSettings.autoShuffle ? 'checked' : ''}"></div></section>
                </div>
            </div>
        </div>
        <div class="back-main-settings" onclick="resetSets();"></div>`;
    document.querySelector('.secound-slid-shit').innerHTML = html
    await delay(10);
    document.querySelector('.slider-settings-section').style.transform = 'translateX(100%)'
    document.querySelector(`.audios-sets-choose section[data-audio="${currentSettings.audio || 'low'}"]`).classList.add('selected')
    
}

function toggleSwitchSets(el){
    const box = el.querySelector('.box')
    const key = el.getAttribute('data-sets');
    if(box.classList.contains('checked')){
        upSets(key,false)
        box.classList.remove('checked')
    }else {
        upSets(key,true)
        box.classList.add('checked')
    }
}

function upSets(key,value){
    const current = localStorage.getItem('settings')
    const json = current ? JSON.parse(current) : {}
    json[key] = value
    currentSettings[key] = value
    localStorage.setItem('settings',JSON.stringify(json))
}

function choseAudio(el){
    const value = el.getAttribute('data-audio');
    if(!isPlus()){
        if(value == 'ultra' || value == 'heigh'){
            showPremium('Join premium to <text>Play heigh quality</text>')
            return;
        }
    }
    document.querySelectorAll('.audios-sets-choose section').forEach(section => {section.classList.remove('selected')})
    el.classList.add('selected')
    upSets('audio',value)
}

async function resetSets() {
    document.querySelector('.slider-settings-section').style.transform = 'none'
    await delay(200)
    document.querySelector('.secound-slid-shit').innerHTML = ''
}

async function  confirmLogout(e) {
    const response = await fetch(`https://api.onvo.me/music/${e ? 'delete' : 'logout'}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getToken()}`
        }
    })
    const data = await response.json();
    localStorage.clear();
    if (data.status == 'success') {
        localStorage.removeItem('signed');
        window.location.assign('/?login=true')
    }
}


function logoutCheck(e) {
    if (e) {
        dialog('Are you sure?', 'Yo are about to delete your account permently, including your saved tracks, playlists, recomendations, etc', [
            `<button type="button" class="main" onclick="closeError();confirmLogout(true);"><span>Confirm delete</span></button>`,
            `<button type="button"><span>Cancel</span></button>`
        ])
        return
    }
    dialog('Are you sure?', 'You are about to log out from the app', [
        `<button type="button" class="main" onclick="closeError();confirmLogout();"><span>Log out</span></button>`,
        `<button type="button"><span>Cancel</span></button>`
    ])
}

async function subsDT() {
    await closeSettings();
    if (isPlus()) {
        getPlanDetails()
    } else {
        showPremiumPage()
    }
}