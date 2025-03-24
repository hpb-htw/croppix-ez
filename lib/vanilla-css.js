export const css = (el, styles, val) => {
    if (typeof (styles) === 'string') {
        const tmp = styles;
        styles = {};
        styles[tmp] = val;
    }

    for (var prop in styles) {
        el.style[prop] = styles[prop];
    }
}


export const setAttributes = (el, attrs) => {
    for (var key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
}