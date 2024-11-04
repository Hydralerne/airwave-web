async function requestUrl(dir, callback) {
    if (dir == 'gl') {
        var url = 'https://api.onvo.me/oauth/google.php';
    }
    if (dir == 'ap') {
        AppleID.auth.init({
            clientId: 'me.onvo.apple', // Your Service ID
            scope: 'name email',
            redirectURI: 'https://api.onvo.me/oauth/apple/',
            state: JSON.stringify({ token: localStorage.getItem('token'), callback: callback }),
            usePopup: false
        });
        AppleID.auth.signIn();
        return;
    }
    var key = dir + 'url';

    const response = await fetch(`${url}?${key}&callback=${callback}`, {
        headers: {
            'Authorization': `Bearer ${await getToken()}`,
        },
    })
    const data = await response.json()
    return data

}

document.querySelectorAll('.login-by').forEach(btn => {
    btn.addEventListener('click', async function () {
        if(this.classList.contains('disabled')){
            return;
        }
        if(this.classList.contains('apple')){
             interface('login')
            return
        }
        this.classList.add('disabled')
        const auth = await ONVO_Oauth(isApp ? 'oave' : null)
        const url = new URL(auth)
        const code = await requestUrl('gl', url.pathname.substring(1))
        interface('web', code.url)
        this.classList.remove('disabled')
    });
})

document.querySelector('.continue-onvo').addEventListener('click', async function () {
    if(this.classList.contains('disabled')){
        return;
    }
    this.classList.add('disabled')
    const auth = await ONVO_Oauth(isApp ? 'oave' : null)
    interface('web', auth)
    this.classList.remove('disabled')
})

var loginSwiper = new Swiper('.swiper-home-outlog', {
    effect: 'cube',
    pagination: {
        el: '.indecators-home',
        clickable: true,
    },
});

document.querySelector('#perview').load()
document.querySelector('#perview').play()

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
