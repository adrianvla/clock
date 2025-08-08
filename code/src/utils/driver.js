import ws281x from 'rpi-ws281x-native';
import {dimHex} from '../graphics/misc.js';
import {getBrightnessFactor} from '../graphics/render.js';
const options = {
    dma: 10,
    freq: 800000,
    gpio: 18,
    invert: false,
    brightness: 255,
    stripType: ws281x.stripType.WS2812
};

const channel = ws281x(256, options);
const colors = channel.array;



const pushToScreen = ()=>{
    ws281x.render();
};

const clearScreen = ()=>{
    ws281x.reset();
}

const silentClearScreen = ()=>{
    for(let i = 0; i < colors.length; i++){
        colors[i] = 0x000000; // Clear all pixels
    }
}

const clearArea = (x1, y1, x2, y2) => {
    for(let x = x1; x <= x2; x++){
        for(let y = y1; y <= y2; y++){
            placepixel(x, y, 0x000000);
        }
    }
};

function placepixel(x, y, c) {
    if(x<0 || x>=32 || y<0 || y>=8) return; // Out of bounds
    x++;
    colors[x%2==0 ? (x<<3)-y-1 : ((x-1)<<3) + y] = dimHex(c, getBrightnessFactor());
}
function getPixelColor(x, y) {
    if(x<0 || x>=32 || y<0 || y>=8) return 0x000000; // Out of bounds
    x++;
    return colors[x%2==0 ? (x<<3)-y-1 : ((x-1)<<3) + y];
}

export {channel, colors, pushToScreen, placepixel, clearScreen, silentClearScreen, clearArea, getPixelColor};