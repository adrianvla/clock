function overlayImageLooped(baseImage, overlayImage, x, y, opacity = 1) {
    const height = baseImage.length;
    const width = baseImage[0].length;
    const result = baseImage.map(row => row.slice());
    for (let i = 0; i < overlayImage.length; i++) {
        for (let j = 0; j < overlayImage[i].length; j++) {
            let oy = (y + i) % height;
            let ox = (x + j) % width;
            if (oy < 0) oy += height;
            if (ox < 0) ox += width;
            if (overlayImage[i][j] !== 0x000000) {
                const basePixel = result[oy][ox];
                const overlayPixel = overlayImage[i][j];
                // Blend overlayPixel with basePixel using opacity
                const br = (basePixel >> 16) & 0xFF;
                const bg = (basePixel >> 8) & 0xFF;
                const bb = basePixel & 0xFF;
                const ba = (basePixel >> 24) & 0xFF;
                const or = (overlayPixel >> 16) & 0xFF;
                const og = (overlayPixel >> 8) & 0xFF;
                const ob = overlayPixel & 0xFF;
                const oa = (overlayPixel >> 24) & 0xFF;
                const r = Math.round(or * opacity + br * (1 - opacity));
                const g = Math.round(og * opacity + bg * (1 - opacity));
                const b = Math.round(ob * opacity + bb * (1 - opacity));
                const a = Math.round(oa * opacity + ba * (1 - opacity));
                result[oy][ox] = (a << 24) | (r << 16) | (g << 8) | b;
            }
        }
    }
    return result;
}
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';


let icons = {};

// Snow particle system for BlowingSnow
const SNOW_PARTICLE_COUNT = 5;
const SNOW_WIDTH = 8;
const SNOW_HEIGHT = 8;
let snowParticles = Array.from({length: SNOW_PARTICLE_COUNT}, () => ({
    x: SNOW_WIDTH - 1,
    y: Math.random() * SNOW_HEIGHT,
    vx: -0.3,
    vy: 0.2 + Math.random() * 0.3
}));
let lastSnowUpdate = 0;
// Adjustable forces
export let snowForceX = -0.3;
export let snowForceY = 0.2;

// Global particle systems for all weather types with individual timers
let blizzardParticles = null;
let lastBlizzardUpdate = 0;
let lightRainParticles = null;
let lastLightRainUpdate = 0;
let moderateRainParticles = null;
let lastModerateRainUpdate = 0;
let heavyRainParticles = null;
let lastHeavyRainUpdate = 0;
let lightSleetParticles = null;
let lastLightSleetUpdate = 0;
let heavySleetParticles = null;
let lastHeavySleetUpdate = 0;
let lightSnowParticles = null;
let lastLightSnowUpdate = 0;
let moderateSnowParticles = null;
let lastModerateSnowUpdate = 0;
let heavySnowParticles = null;
let lastHeavySnowUpdate = 0;
let icePelletParticles = null;
let lastIcePelletUpdate = 0;
let thunderLightRainParticles = null;
let lastThunderLightRainUpdate = 0;
let thunderHeavyRainParticles = null;
let lastThunderHeavyRainUpdate = 0;
let thunderLightSnowParticles = null;
let lastThunderSnowUpdate = 0;
let thunderHeavySnowParticles = null;
let lastThunderHeavySnowUpdate = 0;
let lastLightning = 0;
let lastHeavyLightning = 0;
let lastSnowLightning = 0;
let lastHeavySnowLightning = 0;


function getHexPixels(imagePath) {
    // console.log("Loading ", imagePath);
    const buffer = fs.readFileSync(imagePath);
    const png = PNG.sync.read(buffer);
    const { width, height, data } = png;

    let imageName = imagePath.split(".")[0];
    imageName = imageName.split("/");
    imageName = imageName[imageName.length - 1];
    // console.log(imageName);

    // If image is <= 8x8, just load as normal
    if (width <= 8 && height <= 8) {
        const hexPixels = [];
        let allBlack = true;
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = data[idx + 3];
                let hex;
                if (a === 255) {
                    hex = (r << 16) | (g << 8) | b;
                } else {
                    // If you want to use alpha, you can pack it as 0xAARRGGBB or ignore it
                    hex = (a << 24) | (r << 16) | (g << 8) | b;
                }
                row.push(hex);
                if (hex !== 0x000000) allBlack = false;
            }
            hexPixels.push(row);
        }
        if (!allBlack) {
            icons[imageName] = hexPixels;
        }
        return hexPixels;
    } else {
        // Sprite sheet: extract every 8x8 sprite
        const sprites = [];
        let spriteIndex = 0;
        for (let sy = 0; sy < height; sy += 8) {
            for (let sx = 0; sx < width; sx += 8) {
                const sprite = [];
                let allBlack = true;
                for (let y = 0; y < 8; y++) {
                    const row = [];
                    for (let x = 0; x < 8; x++) {
                        const px = sx + x;
                        const py = sy + y;
                        let hex = 0x000000;
                        if (px < width && py < height) {
                            const idx = (py * width + px) * 4;
                            const r = data[idx];
                            const g = data[idx + 1];
                            const b = data[idx + 2];
                            const a = data[idx + 3];
                            if (a === 255) {
                                hex = (r << 16) | (g << 8) | b;
                            } else {
                                hex = (a << 24) | (r << 16) | (g << 8) | b;
                            }
                        }
                        row.push(hex);
                        if (hex !== 0x000000) allBlack = false;
                    }
                    sprite.push(row);
                }
                if (!allBlack) {
                    const spriteName = `${imageName}-${spriteIndex}`;
                    icons[spriteName] = sprite;
                    sprites.push(sprite);
                }
                spriteIndex++;
            }
        }
        return sprites;
    }
}

function getImageFiles(dir) {
    return fs.readdirSync(dir)
    .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.png'].includes(ext);
    })
    .map(file => path.join(dir, file)); // Full path
}
// console.log("Image Files", getImageFiles('./src/assets/icons'));
Promise.all(
    getImageFiles('./src/assets/icons').map(getHexPixels)
).then(r=>{});

const apiKey = 'ca2d07457d4c4e199d5130051250508';
const city = 'Geneva';

let weatherData = null;
let astronomyData = null;
let weatherAlerts = null;

async function fetchWeather() {
    const currentWeatherRequestURL = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&aqi=no`;
    const astronomyRequestURL = `http://api.weatherapi.com/v1/astronomy.json?key=${apiKey}&q=${city}`;
    const alertsRequestURL = `http://api.weatherapi.com/v1/alerts.json?key=${apiKey}&q=${city}`;
    try {
        // Fetch current weather
        const weatherRes = await fetch(currentWeatherRequestURL);
        if (weatherRes.ok) {
            weatherData = await weatherRes.json();
        } else {
            weatherData = null;
        }
        // Fetch astronomy
        const astronomyRes = await fetch(astronomyRequestURL);
        if (astronomyRes.ok) {
            astronomyData = await astronomyRes.json();
        } else {
            astronomyData = null;
        }
        // Fetch alerts
        const alertsRes = await fetch(alertsRequestURL);
        if (alertsRes.ok) {
            weatherAlerts = await alertsRes.json();
        } else {
            weatherAlerts = null;
        }
        // console.log('Weather, astronomy, and alerts updated', weatherData, astronomyData, weatherAlerts);
    } catch (e) {
        console.error('Error fetching weather data:', e);
        weatherData = null;
        astronomyData = null;
        weatherAlerts = null;
    }
}

// Fetch weather at startup
fetchWeather();
// Fetch weather every 10 minutes
setInterval(fetchWeather, 10 * 60 * 1000);

export function getCurrentTemperature() {
    return weatherData ? Math.round(weatherData.current.temp_c) + "°C" : "NULL";
}

function overlayImage(baseImage, overlayImage, x, y, opacity = 1) {
    const result = baseImage.map(row => row.slice());
    for (let i = 0; i < overlayImage.length; i++) {
        for (let j = 0; j < overlayImage[i].length; j++) {
            const oy = y + i;
            const ox = x + j;
            if (overlayImage[i][j] !== 0x000000) { // Only overlay non-black pixels
                if (oy < 0 || oy >= result.length || ox < 0 || ox >= result[0].length) continue; // Skip out of bounds pixels
                const basePixel = result[oy][ox];
                const overlayPixel = overlayImage[i][j];
                // Blend overlayPixel with basePixel using opacity
                const br = (basePixel >> 16) & 0xFF;
                const bg = (basePixel >> 8) & 0xFF;
                const bb = basePixel & 0xFF;
                const ba = (basePixel >> 24) & 0xFF;
                const or = (overlayPixel >> 16) & 0xFF;
                const og = (overlayPixel >> 8) & 0xFF;
                const ob = overlayPixel & 0xFF;
                const oa = (overlayPixel >> 24) & 0xFF;
                // Simple alpha blend (ignoring alpha channel for now)
                const r = Math.round(or * opacity + br * (1 - opacity));
                const g = Math.round(og * opacity + bg * (1 - opacity));
                const b = Math.round(ob * opacity + bb * (1 - opacity));
                // Optionally blend alpha channel
                const a = Math.round(oa * opacity + ba * (1 - opacity));
                result[oy][ox] = (a << 24) | (r << 16) | (g << 8) | b;
            }
        }
    }
    return result;
}
function dimImage(image, factor) {
    return image.map(row => row.map(pixel => {
        const r = (pixel >> 16) & 0xFF;
        const g = (pixel >> 8) & 0xFF;
        const b = pixel & 0xFF;
        const a = (pixel >> 24) & 0xFF;
        return ((a << 24) | ((r * factor) << 16) | ((g * factor) << 8) | (b * factor));
    }));
}

function oscillate(){
    const now = Date.now();
    const oscillation = Math.floor(((now / 400) % 2));
    return oscillation;
}


const iconFunctions = {
    1000: function Sunny(){
        return icons['weather-1'];
    },
    1003: function PartlyCloudy(){
        return overlayImage(overlayImage(icons['weather-3'],  icons['weather-2'], Math.floor(((Date.now()/400) % 16) - 8), 0, 0.2), icons['weather-4'], 0, 0, 0.2);
    },
    1006: function Cloudy(){
        return icons['weather-12'];
    },
    1009: function Overcast(){
        return overlayImage(dimImage(icons['weather-9'], 0.1), icons['weather-2'], 0,0, 0.2);
    },
    1030: function Mist(){
        return icons['weather-9'];
    },
    1063: function PatchyRainPossible(){
        return overlayImage(overlayImage(overlayImage(icons['weather-3'],  icons['weather-2'], Math.floor(((Date.now()/400) % 16) - 8), -3, 0.3), icons['weather-4'], 0, 0, 0.2), icons['weather-13'],0,0, 0.7);
    },
    1066: function PatchySnowPossible(){
        return overlayImage(overlayImage(overlayImage(icons['weather-3'],  icons['weather-2'], Math.floor(((Date.now()/400) % 16) - 8), -3, 0.3), icons['weather-4'], 0, 0, 0.2), icons['weather-14'],0,0, 0.7);
    },
    1069: function PatchySleetPossible(){
        return overlayImage(overlayImage(overlayImage(icons['weather-3'],  icons['weather-2'], Math.floor(((Date.now()/400) % 16) - 8), -3, 0.3), icons['weather-4'], 0, 0, 0.2), icons['weather-16'],0,0, 0.7);
    },
    1072: function PatchyFreezingDrizzlePossible(){
        return overlayImage(icons['weather-17'], icons['weather-2'], 0, -3, 1);
    },
    1087: function ThunderyOutbreaksPossible(){
        return overlayImage(overlayImage(overlayImage(icons['weather-3'],  icons['weather-2'], Math.floor(((Date.now()/400) % 16) - 8), -3, 0.3), icons['weather-4'], 0, 0, 0.2), icons['weather-18'],0,0, 0.7);
    },
    1114: function BlowingSnow(){
        // Update snow particles only every 300ms
        const now = Date.now();
        if (now - lastSnowUpdate > 200) {
            lastSnowUpdate = now;
            for (let p of snowParticles) {
                p.x += p.vx;
                p.y += p.vy;
                // Add some randomness to y movement
                p.y += (Math.random() - 0.5) * 0.1;
                // Respawn if out of bounds
                if (p.x <= 0 || p.y < 0 || p.y >= SNOW_HEIGHT) {
                    p.x = SNOW_WIDTH - 1;
                    p.y = Math.random() * SNOW_HEIGHT;
                    p.vx = snowForceX + (Math.random() - 0.5) * 0.1;
                    p.vy = snowForceY + (Math.random() - 0.5) * 0.1;
                }
            }
        }
        // Draw snow particles
        let snowImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0x000000));
        for (let p of snowParticles) {
            const px = Math.round(p.x);
            const py = Math.round(p.y);
            if (px >= 0 && px < SNOW_WIDTH && py >= 0 && py < SNOW_HEIGHT) {
                snowImage[py][px] = 0xFFFFFF;
            }
        }
        return snowImage;
    },
    1117: function Blizzard(){
        // Blizzard: more particles falling from top to bottom with accumulation
        const BLIZZARD_PARTICLE_COUNT = 10;
        const now = Date.now();
        if (now - lastBlizzardUpdate > 150) {
            lastBlizzardUpdate = now;
            if (!blizzardParticles) {
                blizzardParticles = Array.from({length: BLIZZARD_PARTICLE_COUNT}, () => ({
                    x: Math.random() * SNOW_WIDTH,
                    y: 0,
                    vx: (Math.random() - 0.5) * 0.2,
                    vy: 0.5 + Math.random() * 0.3
                }));
            }
            for (let p of blizzardParticles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.y >= SNOW_HEIGHT || p.x < 0 || p.x >= SNOW_WIDTH) {
                    p.x = Math.random() * SNOW_WIDTH;
                    p.y = 0;
                    p.vx = (Math.random() - 0.5) * 0.2;
                    p.vy = 0.5 + Math.random() * 0.3;
                }
            }
        }
        let blizzardImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0x000000));
        // Add bottom accumulation
        for (let x = 0; x < SNOW_WIDTH; x++) {
            blizzardImage[SNOW_HEIGHT - 1][x] = 0xFFFFFF;
        }
        // Draw falling particles
        if (blizzardParticles) {
            for (let p of blizzardParticles) {
                const px = Math.round(p.x);
                const py = Math.round(p.y);
                if (px >= 0 && px < SNOW_WIDTH && py >= 0 && py < SNOW_HEIGHT) {
                    blizzardImage[py][px] = 0xFFFFFF;
                }
            }
        }
        return blizzardImage;
    },
    1150: function PatchyLightDrizzle(){
        return overlayImage(icons['weather-13'], icons['weather-2'], 0, -3, 1);
    },
    1183: function LightRain(){
        // Light rain: 3 blue particles falling from top to bottom
        const RAIN_PARTICLE_COUNT = 3;
        const now = Date.now();
        if (now - lastLightRainUpdate > 200) {
            lastLightRainUpdate = now;
            if (!lightRainParticles) {
                lightRainParticles = Array.from({length: RAIN_PARTICLE_COUNT}, () => ({
                    x: Math.random() * SNOW_WIDTH,
                    y: 0,
                    vy: 1.0 + Math.random() * 0.4
                }));
            }
            for (let p of lightRainParticles) {
                p.y += p.vy;
                if (p.y >= SNOW_HEIGHT) {
                    p.x = Math.random() * SNOW_WIDTH;
                    p.y = 0;
                    p.vy = 1.0 + Math.random() * 0.4;
                }
            }
        }
        let rainImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0x000000));
        if (lightRainParticles) {
            for (let p of lightRainParticles) {
                const px = Math.round(p.x);
                const py = Math.round(p.y);
                if (px >= 0 && px < SNOW_WIDTH && py >= 0 && py < SNOW_HEIGHT) {
                    rainImage[py][px] = 0x0066FF; // Blue color
                }
            }
        }
        return rainImage;
    },
    1186: function ModerateRainAtTimes(){
        // Moderate rain: 5 blue particles falling from top to bottom
        const RAIN_PARTICLE_COUNT = 5;
        const now = Date.now();
        if (now - lastModerateRainUpdate > 150) {
            lastModerateRainUpdate = now;
            if (!moderateRainParticles) {
                moderateRainParticles = Array.from({length: RAIN_PARTICLE_COUNT}, () => ({
                    x: Math.random() * SNOW_WIDTH,
                    y: Math.random() * SNOW_HEIGHT,
                    vy: 1.2 + Math.random() * 0.5
                }));
            }
            for (let p of moderateRainParticles) {
                p.y += p.vy;
                if (p.y >= SNOW_HEIGHT) {
                    p.x = Math.random() * SNOW_WIDTH;
                    p.y = 0;
                    p.vy = 1.2 + Math.random() * 0.5;
                }
            }
        }
        let rainImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0x000000));
        if (moderateRainParticles) {
            for (let p of moderateRainParticles) {
                const px = Math.round(p.x);
                const py = Math.round(p.y);
                if (px >= 0 && px < SNOW_WIDTH && py >= 0 && py < SNOW_HEIGHT) {
                    rainImage[py][px] = 0x0066FF; // Blue color
                }
            }
        }
        return rainImage;
    },
    1192: function HeavyRainAtTimes(){
        // Heavy rain: 7 blue particles falling from top to bottom
        const RAIN_PARTICLE_COUNT = 7;
        const now = Date.now();
        if (now - lastHeavyRainUpdate > 100) {
            lastHeavyRainUpdate = now;
            if (!heavyRainParticles) {
                heavyRainParticles = Array.from({length: RAIN_PARTICLE_COUNT}, () => ({
                    x: Math.random() * SNOW_WIDTH,
                    y: Math.random() * SNOW_HEIGHT,
                    vy: 1.5 + Math.random() * 0.6
                }));
            }
            for (let p of heavyRainParticles) {
                p.y += p.vy;
                if (p.y >= SNOW_HEIGHT) {
                    p.x = Math.random() * SNOW_WIDTH;
                    p.y = 0;
                    p.vy = 1.5 + Math.random() * 0.6;
                }
            }
        }
        let rainImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0x000000));
        if (heavyRainParticles) {
            for (let p of heavyRainParticles) {
                const px = Math.round(p.x);
                const py = Math.round(p.y);
                if (px >= 0 && px < SNOW_WIDTH && py >= 0 && py < SNOW_HEIGHT) {
                    rainImage[py][px] = 0x0066FF; // Blue color
                }
            }
        }
        return rainImage;
    },
    1204: function LightSleet(){
        // Light sleet: 3 particles that are white and blue (alternating)
        const SLEET_PARTICLE_COUNT = 3;
        const now = Date.now();
        if (now - lastLightSleetUpdate > 200) {
            lastLightSleetUpdate = now;
            if (!lightSleetParticles) {
                lightSleetParticles = Array.from({length: SLEET_PARTICLE_COUNT}, (_, i) => ({
                    x: Math.random() * SNOW_WIDTH,
                    y: Math.random() * SNOW_HEIGHT,
                    vy: 0.8 + Math.random() * 0.3,
                    color: i % 2 === 0 ? 0xFFFFFF : 0x0066FF
                }));
            }
            for (let p of lightSleetParticles) {
                p.y += p.vy;
                if (p.y >= SNOW_HEIGHT) {
                    p.x = Math.random() * SNOW_WIDTH;
                    p.y = 0;
                    p.vy = 0.8 + Math.random() * 0.3;
                }
            }
        }
        let sleetImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0x000000));
        if (lightSleetParticles) {
            for (let p of lightSleetParticles) {
                const px = Math.round(p.x);
                const py = Math.round(p.y);
                if (px >= 0 && px < SNOW_WIDTH && py >= 0 && py < SNOW_HEIGHT) {
                    sleetImage[py][px] = p.color;
                }
            }
        }
        return sleetImage;
    },
    1206: function ModerateOrHeavySleet(){
        // Moderate/heavy sleet: 5 particles that are white and blue (alternating)
        const SLEET_PARTICLE_COUNT = 5;
        const now = Date.now();
        if (now - lastHeavySleetUpdate > 150) {
            lastHeavySleetUpdate = now;
            if (!heavySleetParticles) {
                heavySleetParticles = Array.from({length: SLEET_PARTICLE_COUNT}, (_, i) => ({
                    x: Math.random() * SNOW_WIDTH,
                    y: Math.random() * SNOW_HEIGHT,
                    vy: 1.0 + Math.random() * 0.4,
                    color: i % 2 === 0 ? 0xFFFFFF : 0x0066FF
                }));
            }
            for (let p of heavySleetParticles) {
                p.y += p.vy;
                if (p.y >= SNOW_HEIGHT) {
                    p.x = Math.random() * SNOW_WIDTH;
                    p.y = 0;
                    p.vy = 1.0 + Math.random() * 0.4;
                }
            }
        }
        let sleetImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0x000000));
        if (heavySleetParticles) {
            for (let p of heavySleetParticles) {
                const px = Math.round(p.x);
                const py = Math.round(p.y);
                if (px >= 0 && px < SNOW_WIDTH && py >= 0 && py < SNOW_HEIGHT) {
                    sleetImage[py][px] = p.color;
                }
            }
        }
        return sleetImage;
    },
    1213: function LightSnow(){
        // Light snow: 3 white particles falling from top to bottom
        const SNOW_PARTICLE_COUNT = 3;
        const now = Date.now();
        if (now - lastLightSnowUpdate > 250) {
            lastLightSnowUpdate = now;
            if (!lightSnowParticles) {
                lightSnowParticles = Array.from({length: SNOW_PARTICLE_COUNT}, () => ({
                    x: Math.random() * SNOW_WIDTH,
                    y: 0,
                    vy: 0.3 + Math.random() * 0.2
                }));
            }
            for (let p of lightSnowParticles) {
                p.y += p.vy;
                if (p.y >= SNOW_HEIGHT) {
                    p.x = Math.random() * SNOW_WIDTH;
                    p.y = 0;
                    p.vy = 0.3 + Math.random() * 0.2;
                }
            }
        }
        let snowImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0x000000));
        if (lightSnowParticles) {
            for (let p of lightSnowParticles) {
                const px = Math.round(p.x);
                const py = Math.round(p.y);
                if (px >= 0 && px < SNOW_WIDTH && py >= 0 && py < SNOW_HEIGHT) {
                    snowImage[py][px] = 0xFFFFFF;
                }
            }
        }
        return snowImage;
    },
    1219: function ModerateSnow(){
        // Moderate snow: 5 white particles falling from top to bottom
        const SNOW_PARTICLE_COUNT = 5;
        const now = Date.now();
        if (now - lastModerateSnowUpdate > 200) {
            lastModerateSnowUpdate = now;
            if (!moderateSnowParticles) {
                moderateSnowParticles = Array.from({length: SNOW_PARTICLE_COUNT}, () => ({
                    x: Math.random() * SNOW_WIDTH,
                    y: Math.random() * SNOW_HEIGHT,
                    vy: 0.4 + Math.random() * 0.2
                }));
            }
            for (let p of moderateSnowParticles) {
                p.y += p.vy;
                if (p.y >= SNOW_HEIGHT) {
                    p.x = Math.random() * SNOW_WIDTH;
                    p.y = 0;
                    p.vy = 0.4 + Math.random() * 0.2;
                }
            }
        }
        let snowImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0x000000));
        if (moderateSnowParticles) {
            for (let p of moderateSnowParticles) {
                const px = Math.round(p.x);
                const py = Math.round(p.y);
                if (px >= 0 && px < SNOW_WIDTH && py >= 0 && py < SNOW_HEIGHT) {
                    snowImage[py][px] = 0xFFFFFF;
                }
            }
        }
        return snowImage;
    },
    1225: function HeavySnow(){
        // Heavy snow: 7 white particles falling from top to bottom
        const SNOW_PARTICLE_COUNT = 7;
        const now = Date.now();
        if (now - lastHeavySnowUpdate > 150) {
            lastHeavySnowUpdate = now;
            if (!heavySnowParticles) {
                heavySnowParticles = Array.from({length: SNOW_PARTICLE_COUNT}, () => ({
                    x: Math.random() * SNOW_WIDTH,
                    y: Math.random() * SNOW_HEIGHT,
                    vy: 0.5 + Math.random() * 0.3
                }));
            }
            for (let p of heavySnowParticles) {
                p.y += p.vy;
                if (p.y >= SNOW_HEIGHT) {
                    p.x = Math.random() * SNOW_WIDTH;
                    p.y = 0;
                    p.vy = 0.5 + Math.random() * 0.3;
                }
            }
        }
        let snowImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0x000000));
        if (heavySnowParticles) {
            for (let p of heavySnowParticles) {
                const px = Math.round(p.x);
                const py = Math.round(p.y);
                if (px >= 0 && px < SNOW_WIDTH && py >= 0 && py < SNOW_HEIGHT) {
                    snowImage[py][px] = 0xFFFFFF;
                }
            }
        }
        return snowImage;
    },
    1237: function IcePellets(){
        // Ice pellets: rare particles that are 2x2 cubes falling from top to bottom
        const ICE_PARTICLE_COUNT = 2;
        const now = Date.now();
        if (now - lastIcePelletUpdate > 400) {
            lastIcePelletUpdate = now;
            if (!icePelletParticles) {
                icePelletParticles = Array.from({length: ICE_PARTICLE_COUNT}, () => ({
                    x: Math.random() * (SNOW_WIDTH - 1),
                    y: 0,
                    vy: 0.8 + Math.random() * 0.4
                }));
            }
            for (let p of icePelletParticles) {
                p.y += p.vy;
                if (p.y >= SNOW_HEIGHT - 1) {
                    p.x = Math.random() * (SNOW_WIDTH - 1);
                    p.y = 0;
                    p.vy = 0.8 + Math.random() * 0.4;
                }
            }
        }
        let iceImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0x000000));
        if (icePelletParticles) {
            for (let p of icePelletParticles) {
                const px = Math.round(p.x);
                const py = Math.round(p.y);
                // Draw 2x2 cube
                for (let dy = 0; dy < 2; dy++) {
                    for (let dx = 0; dx < 2; dx++) {
                        const x = px + dx;
                        const y = py + dy;
                        if (x >= 0 && x < SNOW_WIDTH && y >= 0 && y < SNOW_HEIGHT) {
                            iceImage[y][x] = 0xCCCCCC; // Light gray for ice
                        }
                    }
                }
            }
        }
        return iceImage;
    },
    1273: function PatchyLightRainWithThunder(){
        // Light rain with occasional lightning flashes
        const RAIN_PARTICLE_COUNT = 3;
        const now = Date.now();
        if (now - lastThunderLightRainUpdate > 200) {
            lastThunderLightRainUpdate = now;
            if (!thunderLightRainParticles) {
                thunderLightRainParticles = Array.from({length: RAIN_PARTICLE_COUNT}, () => ({
                    x: Math.random() * SNOW_WIDTH,
                    y: Math.random() * SNOW_HEIGHT,
                    vy: 1.0 + Math.random() * 0.4
                }));
                lastLightning = 0;
            }
            for (let p of thunderLightRainParticles) {
                p.y += p.vy;
                if (p.y >= SNOW_HEIGHT) {
                    p.x = Math.random() * SNOW_WIDTH;
                    p.y = 0;
                    p.vy = 1.0 + Math.random() * 0.4;
                }
            }
        }
        let rainImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0x000000));
        
        // Lightning flash every 3-5 seconds
        const shouldLightning = now - lastLightning > 3000 + Math.random() * 2000;
        if (shouldLightning) {
            lastLightning = now;
            // Fill entire image with yellow flash
            rainImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0xFFFF00));
        } else if (thunderLightRainParticles) {
            // Normal rain particles
            for (let p of thunderLightRainParticles) {
                const px = Math.round(p.x);
                const py = Math.round(p.y);
                if (px >= 0 && px < SNOW_WIDTH && py >= 0 && py < SNOW_HEIGHT) {
                    rainImage[py][px] = 0x0066FF;
                }
            }
        }
        return rainImage;
    },
    1276: function ModerateOrHeavyRainWithThunder(){
        // Moderate/heavy rain with occasional lightning flashes
        const RAIN_PARTICLE_COUNT = 5;
        const now = Date.now();
        if (now - lastThunderHeavyRainUpdate > 150) {
            lastThunderHeavyRainUpdate = now;
            if (!thunderHeavyRainParticles) {
                thunderHeavyRainParticles = Array.from({length: RAIN_PARTICLE_COUNT}, () => ({
                    x: Math.random() * SNOW_WIDTH,
                    y: Math.random() * SNOW_HEIGHT,
                    vy: 1.3 + Math.random() * 0.5
                }));
                lastHeavyLightning = 0;
            }
            for (let p of thunderHeavyRainParticles) {
                p.y += p.vy;
                if (p.y >= SNOW_HEIGHT) {
                    p.x = Math.random() * SNOW_WIDTH;
                    p.y = 0;
                    p.vy = 1.3 + Math.random() * 0.5;
                }
            }
        }
        let rainImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0x000000));
        
        // Lightning flash every 2-4 seconds (more frequent than light rain)
        const shouldLightning = now - lastHeavyLightning > 2000 + Math.random() * 2000;
        if (shouldLightning) {
            lastHeavyLightning = now;
            // Fill entire image with yellow flash
            rainImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0xFFFF00));
        } else if (thunderHeavyRainParticles) {
            // Normal rain particles
            for (let p of thunderHeavyRainParticles) {
                const px = Math.round(p.x);
                const py = Math.round(p.y);
                if (px >= 0 && px < SNOW_WIDTH && py >= 0 && py < SNOW_HEIGHT) {
                    rainImage[py][px] = 0x0066FF;
                }
            }
        }
        return rainImage;
    },
    1279: function PatchyLightSnowWithThunder(){
        // Light snow with occasional lightning flashes
        const SNOW_PARTICLE_COUNT = 3;
        const now = Date.now();
        if (now - lastThunderSnowUpdate > 250) {
            lastThunderSnowUpdate = now;
            if (!thunderLightSnowParticles) {
                thunderLightSnowParticles = Array.from({length: SNOW_PARTICLE_COUNT}, () => ({
                    x: Math.random() * SNOW_WIDTH,
                    y: Math.random() * SNOW_HEIGHT,
                    vy: 0.3 + Math.random() * 0.2
                }));
                lastSnowLightning = 0;
            }
            for (let p of thunderLightSnowParticles) {
                p.y += p.vy;
                if (p.y >= SNOW_HEIGHT) {
                    p.x = Math.random() * SNOW_WIDTH;
                    p.y = 0;
                    p.vy = 0.3 + Math.random() * 0.2;
                }
            }
        }
        let snowImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0x000000));
        
        // Lightning flash every 4-6 seconds
        const shouldLightning = now - lastSnowLightning > 4000 + Math.random() * 2000;
        if (shouldLightning) {
            lastSnowLightning = now;
            // Fill entire image with yellow flash
            snowImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0xFFFF00));
        } else if (thunderLightSnowParticles) {
            // Normal snow particles
            for (let p of thunderLightSnowParticles) {
                const px = Math.round(p.x);
                const py = Math.round(p.y);
                if (px >= 0 && px < SNOW_WIDTH && py >= 0 && py < SNOW_HEIGHT) {
                    snowImage[py][px] = 0xFFFFFF;
                }
            }
        }
        return snowImage;
    },
    1282: function ModerateOrHeavySnowWithThunder(){
        // Moderate/heavy snow with occasional lightning flashes
        const SNOW_PARTICLE_COUNT = 5;
        const now = Date.now();
        if (now - lastThunderHeavySnowUpdate > 200) {
            lastThunderHeavySnowUpdate = now;
            if (!thunderHeavySnowParticles) {
                thunderHeavySnowParticles = Array.from({length: SNOW_PARTICLE_COUNT}, () => ({
                    x: Math.random() * SNOW_WIDTH,
                    y: Math.random() * SNOW_HEIGHT,
                    vy: 0.4 + Math.random() * 0.3
                }));
                lastHeavySnowLightning = 0;
            }
            for (let p of thunderHeavySnowParticles) {
                p.y += p.vy;
                if (p.y >= SNOW_HEIGHT) {
                    p.x = Math.random() * SNOW_WIDTH;
                    p.y = 0;
                    p.vy = 0.4 + Math.random() * 0.3;
                }
            }
        }
        let snowImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0x000000));
        
        // Lightning flash every 3-5 seconds
        const shouldLightning = now - lastHeavySnowLightning > 3000 + Math.random() * 2000;
        if (shouldLightning) {
            lastHeavySnowLightning = now;
            // Fill entire image with yellow flash
            snowImage = Array.from({length: SNOW_HEIGHT}, () => Array(SNOW_WIDTH).fill(0xFFFF00));
        } else if (thunderHeavySnowParticles) {
            // Normal snow particles
            for (let p of thunderHeavySnowParticles) {
                const px = Math.round(p.x);
                const py = Math.round(p.y);
                if (px >= 0 && px < SNOW_WIDTH && py >= 0 && py < SNOW_HEIGHT) {
                    snowImage[py][px] = 0xFFFFFF;
                }
            }
        }
        return snowImage;
    }
}
const duplicateIconFunctions = {
    1135: 1030, // Fog is a duplicate of Mist
    1147: 1030, // Freezing Fog is a duplicate of Mist
    1153: 1150, // Light Drizzle is a duplicate of Patchy Light Drizzle
    1168: 1150, // Freezing Drizzle is a duplicate of Patchy Light Drizzle
    1171: 1150, // Heavy Freezing Drizzle is a duplicate of Patchy Light Drizzle
    1180: 1063, // Patchy Light Rain is a duplicate of Patchy Rain Possible
    1189: 1186, // Moderate Rain is a duplicate of Moderate Rain At Times
    1195: 1192, // Heavy Rain is a duplicate of Heavy Rain at Times
    1198: 1183, // Light Freezing Rain is a duplicate of Light Rain
    1201: 1186, // Moderate or heavy freezing rain is a duplicate of Moderate Rain
    1210: 1213, // Patchy Light Snow is a duplicate of Light Snow
    1216: 1219, // Patchy Moderate Snow is a duplicate of Moderate Snow
    1222: 1225, // Patchy Heavy Snow is a duplicate of Heavy Snow
    1240: 1183, // Light Rain Shower is a duplicate of Light Rain
    1243: 1186, // Moderate or Heavy Rain Shower is a duplicate of Moderate Rain
    1246: 1192, // Torrential Rain Shower is a duplicate of Heavy Rain at Times
    1249: 1204, // Light Sleet Shower is a duplicate of Light Sleet
    1252: 1206, // Moderate or Heavy Sleet Shower is a duplicate of Moderate or Heavy Sleet
    1255: 1213, // Light Snow Shower is a duplicate of Light Snow
    1258: 1219, // Moderate or Heavy Snow Shower is a duplicate of Moderate or Heavy Snow
    1261: 1237, // Light showers of ice pellets is a duplicate of Ice Pellets
    1264: 1237, // Moderate or Heavy showers of ice pellets is a duplicate of Ice Pellets
}

export function getCurrentWeatherIcon(){
    let id = weatherData ? weatherData.current.condition.code : null;
    // Test mode: cycle through all available weather IDs every 5 seconds
    // const availableIds = Object.keys(iconFunctions).map(k => parseInt(k));
    // const cycleIndex = Math.floor(Date.now() / 5000) % availableIds.length;
    // id = availableIds[cycleIndex];
    if (id === null) return icons['weather-0']; // error icon
    if (id in iconFunctions) return iconFunctions[id]();
    if (id in duplicateIconFunctions) return iconFunctions[duplicateIconFunctions[id]]();
    return icons['weather-0']; // error icon
}