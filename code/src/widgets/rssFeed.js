import {Widget} from './widget.js';
import {Text, dimHex, drawVignette} from '../graphics/misc.js';
import {placepixel, clearArea, getPixelColor} from '../utils/driver.js';
import {addZero, lerp} from '../utils/misc.js';
import {Fonts} from '../graphics/fonts.js';
import {getCurrentHeadline} from './rssFeed/rss.js';
import {lockTransition, unlockTransition, isTransitionLocked} from '../transitions/transition.js';



export default class RssFeedWidget extends Widget {
    constructor(x,y) {
        super(x,y);
        this.text = new Text("", Fonts["8x8"], 0, 4, 8);
        this.initialTime = Date.now();
        this.initialFlag = true; // Flag to check if this is the first render
    }

    render(x, y, dt) {
        x += this.x;
        y += this.y;

        if(!isTransitionLocked() && this.initialFlag) {
            this.initialTime = Date.now();
            this.initialFlag = false;
        }
        lockTransition();

        clearArea(x,y, x + 31, y + 7);
        let stringToRender = getCurrentHeadline();
        let gap = -3; // Default gap
        if (/[\u0400-\u04FF]/.test(stringToRender)) {
            gap = -1; // Russian characters
        } else if (/[\u3040-\u30FF\u4E00-\u9FFF]/.test(stringToRender)) {
            gap = 0; // Japanese characters
        }
        this.text.gap = gap;
    
        this.text.set(stringToRender);
        const width = this.text.getWidth();
        //make it scroll
        let now = Date.now() - this.initialTime;
        const offset = Math.floor((now / 50) % (width+32))-33;
        if(offset+3 > width) {
            unlockTransition();
            this.initialFlag = true;
        }


        this.text.draw(x - offset, y, 0xFFFFFF);
        drawVignette();
    }

    getBBox(){
        return {width: 32, height:8};
    }
}