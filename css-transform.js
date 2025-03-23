import {num} from "./dyn-image.js";

const cssPrefixes = ['Webkit', 'Moz', 'ms'];
const emptyStyles = typeof document !== 'undefined' ? document.createElement('div').style : {};

function vendorPrefix(prop) {
    if (prop in emptyStyles) {
        return prop;
    }

    const capProp = prop[0].toUpperCase() + prop.slice(1);
    let i = cssPrefixes.length;

    while (i--) {
        prop = cssPrefixes[i] + capProp;
        if (prop in emptyStyles) {
            return prop;
        }
    }
}

export const CSS_TRANSFORM = vendorPrefix('transform');
export const CSS_TRANS_ORG = vendorPrefix('transformOrigin');
export const CSS_USERSELECT = vendorPrefix('userSelect');
const TRANSLATE_OPTS = {
    'translate3d': {
        suffix: ', 0px'
    },
    'translate': {
        suffix: ''
    }
};
const globals = {
    translate: 'translate3d'
}

export class TransformOrigin {
    #x
    #y

    constructor(el) {
        if (!el || !el.style[CSS_TRANS_ORG]) {
            this.#x = 0;
            this.#y = 0;
            console.log({t:"TransformOrigin", x:this.#x, y:this.#y});
            return;
        }
        const css = el.style[CSS_TRANS_ORG].split(' ');
        this.#x = parseFloat(css[0]);
        this.#y = parseFloat(css[1]);
        console.log({t:"TransformOrigin", x:this.#x, y:this.#y});
    }

    get x() {return this.#x;}
    set x(x) {this.#x = x;}

    get y() {return this.#y;}
    set y(y) {this.#y = y;}

    toString() {
        return this.#x + 'px ' + this.#y + 'px';
    }
}

export class Transform {
    #x;
    #y;
    #scale;

    constructor (x, y, scale) {
        console.log({x, y, scale});
        this.#x = parseFloat(x);
        this.#y = parseFloat(y);
        this.#scale = parseFloat(scale);
    };

    toString () {
        const suffix = TRANSLATE_OPTS[globals.translate].suffix || '';
        //return Croppie.globals.translate + '(' + this.x + 'px, ' + this.y + 'px' + suffix + ') scale(' + this.scale + ')';
        const str = `${globals.translate}(${this.#x}px, ${this.#y}px ${suffix}) scale(${this.#scale})`;
        console.log(str);
        return str;
    };

    get x() {
        return this.#x;
    }

    set x(value) {
        this.#x = value;
        try {
            throw new Error("Set Transform.x outside of Transform");
        }catch (e) {
            console.error(e)
        }
    }

    get y() {
        return this.#y;
    }

    set y(value) {
        this.#y = value;
        try {
            throw new Error("Set Transform.y outside of Transform");
        }catch (e) {
            console.error(e)
        }
    }

    get scale() {
        return this.#scale;
    }

    set scale(value) {
        this.#scale = value;
        try {
            throw new Error("Set Transform.scale outside of Transform");
        }catch (e) {
            console.error(e)
        }
    }

    static parse (v) {
        if (v.style) {
            return Transform.parse(v.style[CSS_TRANSFORM]);
        }
        else if (v.indexOf('matrix') > -1 || v.indexOf('none') > -1) {
            return Transform.fromMatrix(v);
        }
        else {
            return Transform.fromString(v);
        }
    };

    static fromMatrix(v) {
        let vals = v.substring(7).split(',');
        if (!vals.length || v === 'none') {
            vals = [1, 0, 0, 1, 0, 0];
        }

        return new Transform(num(vals[4]), num(vals[5]), parseFloat(vals[0]));
    };

    static fromString (v) {
        const values = v.split(') '),
            //_translate = values[0].substring(Croppie.globals.translate.length + 1).split(','),
            _translate = values[0].substring(globals.translate.length + 1).split(','),
            scale = values.length > 1 ? values[1].substring(6) : 1,
            x = _translate.length > 1 ? _translate[0] : 0,
            y = _translate.length > 1 ? _translate[1] : 0;

        return new Transform(x, y, scale);
    };
}