import {Fonts} from './fonts.js';
import {colors, placepixel, getPixelColor} from '../utils/driver.js';
import {lerp} from '../utils/misc.js';

function toHex(r,g,b){
    return (r<<16) | (g<<8) | b;
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
class Image{
    constructor(img, x, y, c){
        this.img = img;
        this.x=x;
        this.y=y;
        this.c=c;
    }
    draw(){
        let img = this.img, x=this.x, y=this.y, c=this.c;
        let w = img[0].length,h = img.length;
        for(let yy=0;yy<h;yy++){
            for(let xx=0;xx<w;xx++){
                placepixel(xx+x,yy+y,img[yy][xx] & c);
            }
        }
        return this;
    }
    drawAbsolute(){
        let img = this.img, x=this.x, y=this.y, c=this.c;
        let w = img[0].length,h = img.length;
        for(let yy=0;yy<h;yy++){
            for(let xx=0;xx<w;xx++){
                placepixel(xx+x,yy+y,img[yy][xx]);
            }
        }
        return this;
    }
    drawWithoutBackground(){
        let img = this.img, x=this.x, y=this.y, c=this.c;
        let w = img[0].length,h = img.length;
        for(let yy=0;yy<h;yy++){
            for(let xx=0;xx<w;xx++){
                if(img[yy][xx])
                    placepixel(xx+x,yy+y,img[yy][xx] & c);
            }
        }
        return this;
    }
    setImage(img){
        this.img = img;
        return this;
    }
    moveTo(x,y){
        this.x = x;
        this.y = y;
        return this;
    }
}
class Text{
    constructor(txt,font=Fonts["3x5"],gap=1,spaces = 3, height=-1){
        this.txt=txt;
        this.gap=gap;
        this.font = font;
        this.height = height;
        this.spaces = spaces;
    }
    set(txt){
        this.txt=txt;
        return this;
    }
    draw(x,y,c){
        let txt = this.txt.split('');
        let gap = this.gap;
        let offset = 0;
        for(let i = 0;i < txt.length;i++){
            if(txt[i]==" "){
                x+=this.spaces;
            }else{
                if(!(txt[i] in this.font)) continue;
                if(this.height > 0 && this.font[txt[i]].length < this.height) offset = (this.height - this.font[txt[i]].length);
                let o = new Image(this.font[txt[i]],x,y+offset,c);
                o.draw();
                x+=(gap+this.font[txt[i]][0].length);
            }
        }
        return this;
    }
    drawWithoutBackground(x,y,c){
        let txt = this.txt.split('');
        let gap = this.gap;
        let offset = 0;
        for(let i = 0;i < txt.length;i++){
            if(txt[i]==" "){
                x+=this.spaces;
            }else{
                if(!(txt[i] in this.font)) continue;
                if(this.height > 0 && this.font[txt[i]].length < this.height) offset = (this.height - this.font[txt[i]].length);
                let o = new Image(this.font[txt[i]],x,y+offset,c);
                o.drawWithoutBackground();
                x+=(gap+this.font[txt[i]][0].length);
            }
        }
        return this;
    }
    getWidth(){
        let txt = this.txt.split('');
        let gap = this.gap;
        let width = 0;
        for(let i = 0;i < txt.length;i++){
            if(txt[i]==" "){
                width+=this.spaces;
            }else{
                try{
                    width+=(gap+this.font[txt[i]][0].length);
                }catch(e){
                    console.error("Font not found for character: " + txt[i]);
                }
            }
        }
        return width;
    }
}

function drawVignette(vignetteWidth = 6, intensity = 0.3){
        const screenWidth = 32;
        const screenHeight = 8;
        for (let yy = 0; yy < screenHeight; yy++) {
            // Left vignette
            for (let xx = 0; xx < vignetteWidth; xx++) {
                const factor = lerp(1-intensity,1,(xx / vignetteWidth)); // 1 to 0.2
                const origColor = getPixelColor(xx, yy);
                placepixel(xx, yy, dimHex(origColor, factor));
            }
            // Right vignette
            for (let xx = screenWidth - vignetteWidth; xx < screenWidth; xx++) {
                const dist = xx - (screenWidth - vignetteWidth);
                const factor = lerp(1-intensity,1,1 - dist / vignetteWidth); // 1 to 0.2
                const origColor = getPixelColor(xx, yy);
                placepixel(xx, yy, dimHex(origColor, factor));
            }
        }
}
export {toHex, hsvToHex, dimHex, Image, Text, drawVignette};