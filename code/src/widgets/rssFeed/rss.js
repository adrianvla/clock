import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';
import { changeToScreen, getScreenNameByWidgetType, getScreenByName } from '../../graphics/render.js';
let providers = [<PUT YOUR PROVIDERS HERE>];


function parseRSS(xml) {
    // Returns array of items [{title, pubDate, ...}]
    return parseStringPromise(xml)
        .then(result => {
            const channel = result.rss?.channel?.[0];
            if (!channel || !channel.item) return [];
            return channel.item.map(item => ({
                title: item.title?.[0] || '',
                pubDate: item.pubDate?.[0] || '',
                link: item.link?.[0] || '',
                description: item.description?.[0] || '',
                author: item.author?.[0] || '',
                category: item.category?.[0] || '',
                guid: item.guid?.[0] || ''
            }));
        })
        .catch(() => []);
}

let latestItem = null;
let previousHeadline = null;

function changeScreenToRSS() {
    const screenName = getScreenNameByWidgetType('RssFeedWidget');
    console.log("Changing screen to RSS: " + screenName);
    if (screenName) {
        changeToScreen(screenName);
        let screen = getScreenByName(screenName);
        for(const widget of screen.widgets) 
            if (widget.getType() === 'RssFeedWidget')  // Scroll text to 0
                widget.initialTime = Date.now();
    } else {
        console.error("RSS screen not found");
    }
}

async function fetchRSS() {
    let allItems = [];
    console.log("Fetching RSS feeds...");
    for (const url of providers) {
        try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const xml = await res.text();
            const items = await parseRSS(xml);
            allItems = allItems.concat(items);
        } catch (e) {
            // Ignore errors for individual feeds
            console.error(`Error fetching RSS from ${url}:`, e);
        }
    }
    // Find the item with the latest pubDate
    allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    const newLatestItem = allItems[0] || null;
    if (newLatestItem && (!latestItem || newLatestItem.title !== latestItem.title)) {
        // New headline detected
        changeScreenToRSS();
    }
    latestItem = newLatestItem;
}

setInterval(fetchRSS, 5 * 60 * 1000);
fetchRSS();

export function getCurrentHeadline(){
    return latestItem ? latestItem.title : 'No headlines available';
}
