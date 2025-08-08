import { linear } from './eases.js';

let duration = 1000; // Duration of the transition in milliseconds
let startTime = null;
let isTransitioning = false;
let ease = linear;
let transitionLocked = false;


function startTransition(){
    isTransitioning = true;
    startTime = Date.now();
}
function stopTransition(){
    isTransitioning = false;
    startTime = null;
}
function isTransitionLocked(){
    return transitionLocked;
}
function lockTransition(){
    transitionLocked = true;
    // console.log("Transition locked");
}
function unlockTransition(){
    transitionLocked = false;
    // console.log("Transition unlocked");
}

function isInTransition(){
    return isTransitioning;
}

function transition(elapsed){ //TODO: implement custom dynamic transitions
    //return x,y coordinates based on elapsed time
    if (!isTransitioning) {
        return {old: [0,-8], new: [0,0]};
    }
    const progress = elapsed / duration;
    const easedProgress = ease(progress);
    const newX = 0; // Assuming a width of 32 pixels
    const newY = (easedProgress - 1) * 8; // Assuming a height of 8 pixels
    const oldX = 0; // Old position based on the remaining progress
    const oldY = easedProgress * 8; // Old position based
    return {"old": [Math.floor(oldX), Math.floor(oldY)], "new": [Math.floor(newX), Math.floor(newY)]};
}

function getState(){
    const elapsed = Date.now() - startTime;
    if (elapsed >= duration) {
        stopTransition();
    }
    return transition(elapsed);
}


export {startTransition, isInTransition, getState, stopTransition, transition, isTransitionLocked, lockTransition, unlockTransition};