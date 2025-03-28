// Credits to : Andrew Dupont - http://andrewdupont.net/2009/08/28/deep-extending-objects-in-javascript/
export function deepExtend(destination, source) {
    destination = destination || {};
    for (const property in source) { // for-in is necessary
        if (source[property] && source[property].constructor && source[property].constructor === Object) {
            destination[property] = destination[property] || {};
            deepExtend(destination[property], source[property]);
        } else {
            destination[property] = source[property];
        }
    }
    return destination;
}

export function clone(object) {
    return deepExtend({}, object);
}