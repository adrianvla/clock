import {Widget} from './widget.js';
import {getTime} from '../utils/time.js';
import {Image, Text, hsvToHex} from '../graphics/misc.js';
import {placepixel} from '../utils/driver.js';
import {getCurrentWeatherIcon} from './weather/weather.js';



export default class WeatherWidget extends Widget {
    constructor(x,y) {
        super(x,y);
        this.text = new Text("");
        this.icon = new Image([],0,0);
    }

    render(x, y, dt) {
        x += this.x;
        y += this.y;

        this.icon.setImage(getCurrentWeatherIcon()).moveTo(x,y);

        this.icon.drawAbsolute();
    }
    getBBox(){
        return {width: 8, height:8};
    }
}