import { startTransition, isInTransition, getState, isTransitionLocked, unlockTransition } from "../transitions/transition.js";
import { pushToScreen, silentClearScreen } from "../utils/driver.js";

let screens = {};
let screenNames = [];
let currentScreen = null;
let currentScreenIndex = 0;
let oldCurrentScreen = null;
let renderingInterval = null;
let inTransition = false;
let lastRenderTime = Date.now();
let brightnessFactor = 0.05;
let startTransitionFlag = false;
let changeScreenTime = 20000;

let lastTimeTransitionFired = Date.now();


function setBrightnessFactor(factor) {
    brightnessFactor = factor;
}

function getBrightnessFactor() {
    return brightnessFactor;
}


function registerScreen(screen){
    screens[screen.name] = screen;
    screenNames.push(screen.name);
    if(!currentScreen){
        currentScreen = screen.name;
        currentScreenIndex = 0;
        oldCurrentScreen = screen.name;
    }
}

function resetScreens(){
    screens = {};
    screenNames = [];
    currentScreen = null;
    currentScreenIndex = 0;
    oldCurrentScreen = null;
}

function changeToScreen(screenName){
    //change currentScreenIndex
    if(screenNames.includes(screenName)){
        currentScreenIndex = screenNames.indexOf(screenName);
        oldCurrentScreen = currentScreen;
        currentScreen = screenName;
        startTransitionFlag = false;
    }
}

function getScreenNameByWidgetType(type){
    for(let screenName of screenNames){
        for(let widget of screens[screenName].widgets){
            if(widget.getType() === type){
                return screenName;
            }
        }
    }
    console.error(`Screen with widget type ${type} not found`);
    return null;
}

function getScreenByName(name){
    if(screens[name]){
        return screens[name];
    } else {
        console.error(`Screen with name ${name} not found`);
        return null;
    }
}

function render(){
    if(!screens[currentScreen]){
        console.error("No current screen set or screen not registered");
        return;
    }
    const now = Date.now();
    const dt = now - lastRenderTime;
    lastRenderTime = now;

    
    if(oldCurrentScreen !== currentScreen && !startTransitionFlag){
        startTransition();
        lastTimeTransitionFired = now;
        startTransitionFlag = true;
        screens[oldCurrentScreen].calculateStaticElements(screens[currentScreen], true);
        screens[currentScreen].calculateStaticElements(screens[oldCurrentScreen], false);
    }
    if(isInTransition()){
        let state = getState();
        silentClearScreen();
        screens[oldCurrentScreen].render(state.old[0],state.old[1],dt, true);
        screens[currentScreen].render(state.new[0],state.new[1],dt, true);
        unlockTransition();
    }
    else {
        screens[currentScreen].render(0,0,dt);
        changeScreenTime = screens[currentScreen].duration;
    }
    pushToScreen();
    
    // if(!isInTransition() && (now - lastTimeTransitionFired) > changeScreenTime && screenNames.length > 1){
    //     console.log("Waiting to transition to next screen, locked: " + isTransitionLocked());
    // }
    if(!isInTransition() && (now - lastTimeTransitionFired) > changeScreenTime && screenNames.length > 1 && !isTransitionLocked()){
        currentScreenIndex++;
        if(currentScreenIndex >= screenNames.length) currentScreenIndex = 0;
        if(getScreenNameByWidgetType('RssFeedWidget')==screenNames[currentScreenIndex]) currentScreenIndex++; //skip RssFeedWidget screen
        if(currentScreenIndex >= screenNames.length) currentScreenIndex = 0;
        
        oldCurrentScreen = currentScreen;
        currentScreen = screenNames[currentScreenIndex];
        startTransitionFlag = false;
        unlockTransition();
    }
}

renderingInterval = setInterval(render, 1);


export {registerScreen, render, setBrightnessFactor, getBrightnessFactor, changeToScreen, getScreenNameByWidgetType, getScreenByName, resetScreens};