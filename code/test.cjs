const ws281x = require('rpi-ws281x-native');
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
function placepixel(x,y,c){
    x++;
    colors[x%2==0 ? (x<<3)-y-1 : ((x-1)<<3) + y] = c;
}
function hsvToHex(h,s,v){
    h = h % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    v = Math.max(0, Math.min(100, v)) / 100;
    
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    
    let r, g, b;
    if (h < 60) {
        r = c; g = x; b = 0;
    } else if (h < 120) {
        r = x; g = c; b = 0;
    } else if (h < 180) {
        r = 0; g = c; b = x;
    } else if (h < 240) {
        r = 0; g = x; b = c;
    } else if (h < 300) {
        r = x; g = 0; b = c;
    } else {
        r = c; g = 0; b = x;
    }
    
    return ((Math.round((r + m) * 255) & 0xFF) << 16) |
    ((Math.round((g + m) * 255) & 0xFF) << 8) |
    (Math.round((b + m) * 255) & 0xFF);
}

function dimHex(hex, factor){
    const r = (hex >> 16) & 0xFF;
    const g = (hex >> 8) & 0xFF;
    const b = hex & 0xFF;
    
    const dimmedR = Math.max(0, Math.min(255, Math.round(r * factor)));
    const dimmedG = Math.max(0, Math.min(255, Math.round(g * factor)));
    const dimmedB = Math.max(0, Math.min(255, Math.round(b * factor)));
    
    return (dimmedR << 16) | (dimmedG << 8) | dimmedB;
}
let t = 0;

let x = 0;
let y = 0;

setInterval(() => {
    //make a snake
    // for (let i = 0; i < colors.length; i++) {
    //   if (i === t) {
    //     colors[i] = 0x100000; // Red color
    //   }
    //   else if (i === (t + 1) % colors.length) {
    //     colors[i] = 0x001000; // Green color
    //   }
    //   else if (i === (t + 2) % colors.length) {
    //     colors[i] = 0x000010; // Blue color
    //   } else {
        //     colors[i] = 0x000000; // Off
    //   }
    // }
    
    //make horizontal lines using placepixel
    placepixel(x, y, dimHex(hsvToHex((++t)%360, 100,50),0.1)); // Red
    if (x === 31)
    {
        x = 0;
        y = (y + 1) & 0x7; // Move to next row
    }
    else
        x++;
    
//    t = (t + 1) % colors.length;
    ws281x.render();
},1);

ws281x.render();