import {Widget} from './widget.js';
import {getTime} from '../utils/time.js';
import {Image, Text, hsvToHex} from '../graphics/misc.js';
import {placepixel} from '../utils/driver.js';
import {addZero} from '../utils/misc.js';

let w = 0xFFFFFF;
export default class CalendarWidget extends Widget {
    constructor(x,y) {
        super(x,y);
        this.text = new Text("");
        this.background = new Image([],0,0);
    }

    render(x, y, dt) {
        x += this.x;
        y += this.y;
        
        let now = Date.now();
        let r = hsvToHex(((now/50) % 360),100,50);
        let calendar = [[r,r,r,r,r,r,r,r,r],[r,r,r,r,r,r,r,r,r],[w,w,w,w,w,w,w,w,w],[w,w,w,w,w,w,w,w,w],[w,w,w,w,w,w,w,w,w],[w,w,w,w,w,w,w,w,w],[w,w,w,w,w,w,w,w,w],[w,w,w,w,w,w,w,w,w]];
        this.background.setImage(calendar).moveTo(x,y);


        let time = getTime();
        this.text.set(addZero(time.date));
        this.background.drawAbsolute();
        this.text.drawWithoutBackground(x+1,y+2, 0x000000);
    }
    
    getBBox(){
        return {width: 9, height:8};
    }
}