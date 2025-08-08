import {Widget} from './widget.js';
import {getTime} from '../utils/time.js';
import {Text, dimHex} from '../graphics/misc.js';
import {addZero} from '../utils/misc.js';
import {getCurrentTemperature} from './weather/weather.js';

export default class TemperatureWidget extends Widget {
    constructor(x,y) {
        super(x,y);
        this.text = new Text("");
    }

    render(x, y, dt) {
        x += this.x;
        y += this.y;

        this.text.set(getCurrentTemperature());
        this.text.draw(x+0, y+0, 0xFFFFFF);
    }

    getBBox(){
        return {width: 15, height:5};
    }
}