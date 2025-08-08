import {Widget} from './widget.js';
import {getTime} from '../utils/time.js';
import {Text, dimHex} from '../graphics/misc.js';
import {addZero} from '../utils/misc.js';

export default class DigitalTimeWidget extends Widget {
    constructor(x,y) {
        super(x,y);
        this.hours = new Text("");
        this.minutes = new Text("");
        this.dots = new Text(":");
    }

    render(x, y, dt) {
        x += this.x;
        y += this.y;

        let now = Date.now();
        let time = getTime();
        this.hours.set(addZero(time.hours == "24" ? "00" : time.hours)); // Handle 24-hour format
        this.minutes.set(addZero(time.minutes));
        this.hours.draw(x+0, y+0, 0xFFFFFF);
        this.minutes.draw(x+10, y+0, 0xFFFFFF);

        const seconds = now / 1000;
        const flicker = (Math.sin(2 * Math.PI * seconds) * 0.375) + 0.625;
        this.dots.draw(x+7, y+0, dimHex(0xFFFFFF, flicker));
    }

    getBBox(){
        return {width: 17, height:5};
    }
}