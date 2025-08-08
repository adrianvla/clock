import {Widget} from './widget.js';
import {getTime} from '../utils/time.js';
import {placepixel} from '../utils/driver.js';
import {addZero} from '../utils/misc.js';

let active = 0xFFFFFF;
let deactive = 0x101010;
export default class BarsOfWeekWidget extends Widget {
    constructor(x,y) {
        super(x,y);
    }

    render(x, y, dt) {
        x += this.x;
        y += this.y;

        let time = getTime();
        let day = time.dayOfWeek;
        for(let i = 0; i < 7; i++) {
            let color = ((i + 1) === day) ? active : deactive;
            for(let j = 0; j < 2; j++) {
                placepixel(x + (i*3) + j, y, color);
            }
        }
    }

    getBBox(){
        return {width: 20, height:1};
    }
}