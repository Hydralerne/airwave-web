
let draggableSubscripe
async function subscripe(type, el) {
    dialog(
        'Upcoming Features',
        'Thank you for your interest in our app! Please note that this is a beta version. We are currently preparing payment methods, and you will receive a free trial of the features. Stay tuned for updates!'
    );
    return
    document.querySelector('.switcher-plus-container').classList.remove('hidden')
    await delay(50)
    document.querySelector('.switcher-plus-body').classList.add('center-flex')
    document.querySelector('.plus-subs-btn').setAttribute('type', type)
    document.querySelector('.plus-subs-btn').setAttribute('price', el.getAttribute('price'))
    document.querySelector('.right-handed-product span').innerText = `${el.getAttribute('price')} EGP`
    document.querySelector('.plus-subs-btn span').innerText = `Subscripe & pay ${el.getAttribute('price')} EGP`
    document.querySelector('.left-handed-product span').innerText = `Premium ${type}`
    document.querySelector('.left-handed-product a').innerText = type == 'mini' ? '1 week' : '1 month'

    if (draggableSubscripe) {
        draggableSubscripe.update()
    } else {
        draggableSubscripe = new DraggableMenu('.switcher-plus-body', '.switcher-plus-back');
    }
}

document.querySelectorAll('.subscipe-button').forEach(div => {
    div.addEventListener('click', function () {
        subscripe(this.getAttribute('type'), this)
    })
})

document.querySelector('.switcher-plus-back').addEventListener('click', function () {
    document.querySelector('.switcher-plus-body').classList.remove('center-flex');
    document.querySelector('.switcher-plus-body').removeAttribute('style');
    setTimeout(() => {
        document.querySelector('.switcher-plus-container').classList.add('hidden');
    }, 200)
})

document.querySelectorAll('.payment-method').forEach(btn => {
    btn.addEventListener('click', function () {
        if (this.classList.contains('selected')) {
            return
        }
        document.querySelectorAll('.payment-method').forEach(el => { el.classList.remove('selected') })
        this.classList.add('selected')
        document.querySelector('.plus-subs-btn').setAttribute('method', this.getAttribute('method'))
    })
})

function payNative(method,type){
    if(method == 'google'){
        let id = '';
        switch(type){
            case 'mini':
                id = 'mini-subs'
            break;
            case 'individual':
                id = 'personal-plan'
            break;
            case 'duo':
                id = 'personal-plan'
            break;
            case 'family':
                id = 'family-play'
            break;
        }
        Android.subscribe('weekly_subscription',id)
        return;
    }
    if(method == 'apple'){
    
        window.webkit.messageHandlers.pay.postMessage(type)

        return;
    }
}

async function pay(el) {
    if (el.classList.contains('disabled')) {
        return;
    }
    const parentMain = document.querySelector('.switcher-plus-body');
    if (el.classList.contains('back')) {
        el.querySelector('span').innerText = `Subscripe & pay ${el.getAttribute('price')} EGP`
        el.classList.remove('back')
        parentMain.classList.remove('waiting')
        return
    }
    el.insertAdjacentHTML('beforeend', roller);
    el.classList.add('loading');
    el.classList.add('disabled');
    const type = el.getAttribute('type');
    const method = el.getAttribute('method');
    if(method == 'apple' || method == 'google'){
        payNative(method,type)
        el.classList.remove('disabled');

        return;
    }
    const data = await fetch('https://api.onvo.me/plus/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${await getToken()}`
        },
        body: new URLSearchParams({ pay_link: 'true', type: type, method: method }).toString()
    }).then(response => {
        return response.json();
    }).catch(error => {
        el.classList.remove('disabled');
        el.classList.remove('loading');
        el.querySelector('.lds-roller-main')?.remove();
        console.error(error);
    });
    el.classList.remove('disabled');
    el.classList.remove('loading');
    el.querySelector('.lds-roller-main')?.remove();
    console.log(data)
    if (data.status == 'intended') {
        el.classList.add('back')
        el.querySelector('span').innerText = 'Change payment method'
        interface('open', data.paymentLink);
        parentMain.classList.add('waiting');
    }
}

document.querySelector('.promocode').addEventListener('click', async function () {
    const attr = document.querySelector('.promo-code');
    attr.classList.add('loading');
    attr.insertAdjacentHTML('beforeend', roller);
    const code = document.querySelector('.inner-promo-code input').value;
    const data = await fetch('https://api.onvo.me/plus/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: new URLSearchParams({ cobone: 'true', code: code }).toString()
    }).then(response => {
        return response.json();
    }).catch(error => {
        attr.classList.remove('loading');
        attr.querySelector('.lds-roller-main')?.remove();
        console.error(error);
    });

    console.log(data);
});

function backPlus() {
    if (document.querySelector('.switcher-plus-body').classList.contains('waiting')) {
        console.log('running shit')
        dialog()
        return
    }
    document.querySelector('.switcher-plus-back').click()
}

function upperFirst(str) {
    if (!str) return str; // handle empty strings
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Usage
let callbackBillSuccess;
async function handleBillingCall(data) {
    if (data.success == true) {
        if (callbackBillSuccess) {
            return
        }
        callbackBillSuccess = true
        document.querySelector('.switcher-plus-back').click()
        await delay(200)
        document.querySelector('.container-vvs').classList.add('hidden')
        const body = document.querySelector('.premium-explain').outerHTML;
        document.querySelector('.container-vvs').remove()
        const html = `
            <div class="subsciption-control">
                <div class="welcome-subscriptions">
                    <div class="back-welcome">
                        <div class="video-ssvp">
                            <video autoplay="" loop="" playsinline="" muted="" src="/assets/v/3.mp4"></video>
                        </div>
                    </div>
                    <div class="welcome-badge">
                        <div class="payment-success-badge"><span></span></div>
                        <div class="payment-success-text container">
                            <span>Payment success!</span>
                            <a>Congratulations, enjoy your journey with Airwave premium</a>
                        </div>
                        ${body}
                    </div>
                    <div class="view-subscription-btn container" onclick="closePremium();getPlanDetails()"><span>View subscription details</span></div>
                </div>
            </div>
            `;
        document.querySelector('.subscriptions').insertAdjacentHTML('beforeend', html)
        await delay(50)
        document.querySelector('.video-ssvp video').load()
        document.querySelector('.video-ssvp video').play()
        document.querySelector('.welcome-subscriptions .header-pexplain span').innerText = 'You are now enjoying'
    }
}

function closePremium(){

}

function paymentSource(e) {
    const type = e.toLowerCase()
    switch (type) {
        case 'wallet':
            return '<span style="background-image: url(https://logos-world.net/wp-content/uploads/2020/09/Vodafone-Symbol.png);background-size: 25px;"></span>'
        case 'mastercard':
            return '<span style="background-image: url(https://brand.mastercard.com/etc/designs/mccom/debit/jcr:content/global/logo.img.png/1616622953822.png);"></span>'
        case 'apple':
            return '<span class="apple-logo" style="background-image: url(https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/976px-Apple_logo_black.svg.png);"></span>'
        case 'google':
            return '<span></span>'
        case 'visa':
            return '<span style="background-image: url(https://usa.visa.com/dam/VCOM/regional/ve/romania/blogs/hero-image/visa-logo-800x450.jpg);background-size: cover;"></span>'
    }
    return '<span></span>'
}

let planDetailsInitialized;
async function showPremiumDetails(data) {
    const body = document.querySelector('.premium-explain').outerHTML;
    let html = `
        <div class="subscriptions-details page" style="z-index: 9999999">
        <div class="back-premium" onclick="this.closest('.subscriptions-details').classList.remove('center')"></div>
        <div class="manage-subscription">
            <div class="manage-subsback"></div>
            <div class="manage-subsbody container welcome-badge">
                <div class="plan-info plan-container">
                    <div class="more-plan-action"></div>
                    <div class="premimu-tag">
                        <span>Premium</span>
                    </div>
                    <div class="info-sets-plab">
                        <span>Airwave ${data.plan} plan</span>
                        <section><a>${upperFirst(data.frequency)}</a>
                            <p>renews at ${data.renew} for ${data.amount}</p>
                        </section>
                    </div>
                    <div class="payment-plan-info">
                   <div class="flex-payment-icons"> ${data.owner.id == localStorage.getItem('userid') ? paymentSource(data.payment?.name) : '<span class="member-plan"></span>'}</div>
                        <section>
                            ${data.owner.id == localStorage.getItem('userid') ? `<a>Subscribed using <text>${upperFirst(data.payment?.name)}</text> ends by <text>${data.payment?.number}</text>, Payment renews and secured by <text>${data.payment?.provider}</text></a>` : `<a>You are hosted on ${data.owner.fullname} premium plan, to get your own plan <text onclick="" style="text-decoration: underline;" onclick="showPremiumPage()">Tap here</text></a>`}
                        </section>
                    </div>
                </div>
                <div class="favorites-head">
                    <span>Plan members</span>
                </div>
                <div class="users-members-plan">
                    <div class="user-member-plan">
                        <span style="background-image: url(${data.owner.image});"></span>
                        <section><a>${data.owner.fullname}</a>
                            <p>Plan holder</p>
                        </section>
                        <div class="settings-user-plan"></div>
                    </div>
                    ${printCoupons(data.cobones)}
                </div>
                <div class="favorites-head">
                    <span>Plan details</span>
                </div>
                ${body}
                <div class="view-subscription-btn" onclick="showPremiumPage()" style="position: relative;margin-top: 20px"><span>View other plans</span></div>
            </div>
        </div>
    </div>`;
    if (!planDetailsInitialized) {
        document.querySelector('.subscriptions-section').insertAdjacentHTML('beforeend', html)
        await delay(50)
    }
    document.querySelector('.subscriptions-details .header-pexplain span').innerText = 'You plan includes'
    document.querySelector('.subscriptions-details .premium-explain').classList.remove('container')
    document.querySelector('.subscriptions-details').classList.add('center')
    planDetailsInitialized = true

}

function printCoupons(data) {
    let html = ''
    data?.forEach(coupon => {
        if (coupon.status == 'unused') {
            html += `
                <div class="user-member-plan copoun" owner="${coupon.owner}" dataid="${coupon.id}">
                    <span></span>
                    <section><a>${coupon.code}</a></section>
                    <div class="settings-user-plan share"></div>
                    <div class="settings-user-plan" onclick="copyCoupone(this)"></div>
                </div>`
        } else {
            html += `
                <div class="user-member-plan" dataid="${coupon.id}" userid="${coupon.user?.id}">
                    <span style="background-image: url(${coupon.user?.image});"></span>
                    <section>
                        <a>${coupon.user?.fullname}</a>
                        <p>Plan member</p>
                    </section>
                    <div class="settings-user-plan" onclick="editUserSubscription(this,'${coupon.owner}')"></div>
                </div>`
        }
    })
    return html
}

function editUserSubscription(el, owner) {
    const root = el.closest('.user-member-plan')
    let html = `
   <div class="outer-manage-users">
   ${root.outerHTML}
    <div class="subscription-option" onclick="document.querySelector('.back-replyer-switching').click();setTimeout(() => {removeUserFromPlan('${root.getAttribute('dataid')}');},200)"><span style="
    -webkit-mask-image: url(https://s3-iconly.sfo3.digitaloceanspaces.com/png-icons/remove%20user-35-1658436042.png);
    background: #fd8282;
    "></span><a style="
    color: #fd8282;
    ">Remove user</a></div>
    <div class="subscription-option" onclick="document.querySelector('.back-replyer-switching').click();setTimeout(() => {openProfile('${root.getAttribute('userid')}');},200);"><span style="
    -webkit-mask-image: url(https://s3-iconly.sfo3.digitaloceanspaces.com/png-icons/user-104-1662817494.png);
    "></span><a>View user profile</a></div>
    </div>
    `
    drag('options', html)
}

async function removeUserFromPlan(id){
    const data = await fetch('https://api.onvo.me/plus/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: new URLSearchParams({ remove_cobone: 'true', id: id }).toString()
    }).then(response => {
        return response.json();
    }).catch(error => {
        console.error(error);
    });
    document.querySelector('.user-member-plan[dataid="'+id+'"]')?.remove();
    const html = printCoupons([{status: 'unused',owner: localStorage.getItem('userid'),id: id,code: data.new_cobone}])
    document.querySelector('.users-members-plan').insertAdjacentHTML('beforeend',html)
}

function copyCoupone(el) {
    if (el.classList.contains('copied')) {
        return
    }
    el.classList.add('copied')
    const text = el.closest('.user-member-plan').querySelector('section a').innerText
    setTimeout(() => {
        el.classList.remove('copied')
    }, 4000)
    navigator.clipboard.writeText(text, (error) => {

    })
}

async function getPlanDetails() {
    fetch('https://api.onvo.me/music/plus/details', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getToken()}`
        }
    }).then(response => {
        return response.json();
    }).then(data => {
        showPremiumDetails(data)
    }).catch(e => {
        console.error(e)
    })
}

document.querySelector('.pobup-back')?.addEventListener('click', function () {
    document.querySelector('.pop-up').classList.add('hidden');
});
document.querySelectorAll('.select-plan').forEach(element => {
    element.addEventListener('click', function () {
        document.querySelector('.pop-up').classList.remove('hidden');
        const price = this.getAttribute('price');
        const type = this.getAttribute('type');
        document.querySelector('.pay-button').setAttribute('type', type);
        document.querySelector('.pay-button a').innerText = price;
    });
});


