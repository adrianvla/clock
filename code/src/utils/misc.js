export function addZero(str){
    return str.length === 1 ? "0" + str : str;
}

export function lerp(start, end, factor) {
    return start + (end - start) * factor;
}