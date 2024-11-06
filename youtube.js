
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

function filterYoutubeScrap(textData) {
    const regex = /data: '(.*?)'}\);/gs;
    const matches = [];
    let match;

    while ((match = regex.exec(textData)) !== null) {
        const extractedData = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
        matches.push(extractedData);
    }

    if (matches.length > 0) {
        return JSON.parse(matches[1]);
    } else {
        console.log('Data not found');
        return [];
    }
}

const getYotuubeMusicList = async (req, res) => {
    const url = decodeURIComponent(req.query.url)
    const response = await scrap(url)
    const html = await response.text();
    const data = filterYoutubeScrap(html)
    res.send(data)
}

module.exports = {
    getYotuubeMusicList
}