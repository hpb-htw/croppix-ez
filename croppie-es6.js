/*************************
 * Croppie
 * Copyright 2019
 * Foliotek
 * Version: 2.6.5
 *
 * Copyright 2025
 * Hong-Phuc Bui
 * Version: 3.0.0
 *************************/

import {css, setAttributes} from "./vanilla-css.js";
import {CSS_TRANS_ORG, CSS_TRANSFORM, TransformOrigin, Transform, CSS_USERSELECT} from "./css-transform.js";
import {debounce, dispatchChange} from "./debounce.js";
import {drawCanvas, fix, getExifOrientation, loadImage, naturalImageDimensions, num} from "./dyn-image.js";
import {clone, deepExtend} from "./clone.js";

const RESULT_DEFAULTS = {
        type: 'canvas',
        format: 'png',
        quality: 1
    },
    RESULT_FORMATS = ['jpeg', 'webp', 'png'];

export class Croppie {
    element;
    options;

    constructor(element, opts = {}) {
        if (element.classList.contains('croppie-container')) {
            throw new Error("Croppie: Can't initialize croppie more than once");
        }
        this.element = element;
        this.options = deepExtend(clone(Croppie.defaults), opts);

        if (this.element.tagName.toLowerCase() === 'img') {
            const origImage = this.element;
            //addClass(origImage, 'cr-original-image');
            origImage.classList.add('cr-original-image');
            setAttributes(origImage, {'aria-hidden' : 'true', 'alt' : '' });
            const replacementDiv = document.createElement('div');
            this.element.parentNode.appendChild(replacementDiv);
            replacementDiv.appendChild(origImage);
            this.element = replacementDiv;
            this.options.url = this.options.url || origImage.src;
        }
        // selsame Funktionen
        this._debouncedOverlay = debounce(this._updateOverlay, 500);
        this._create();
        if (this.options.url) {
            const bindOpts = {
                url: this.options.url,
                points: this.options.points
            };
            delete this.options['url'];
            delete this.options['points'];
            this.bind(bindOpts);
        }
    }

    /**
     * Bind an image to the croppie.
     * Returns a promise to be resolved when the image has been loaded and the croppie has been initialized.
     *
     * @param {Object} options
     * @param options.url
     * @param options.points
     * @param options.zoom
     * @param options.orientation
     *
     * @param {Function} cb
     *
     * @return Promise
     * */
    bind(options, cb = undefined) {
        var url,
            points = [],
            zoom = null,
            hasExif = this._hasExif();

        if (typeof (options) === 'string') {
            url = options;
            options = {};
        }
        else if (Array.isArray(options)) {
            points = options.slice();
        }
        else if (typeof (options) === 'undefined' && this.data.url) { //refreshing
            this._updatePropertiesFromImage();
            this._triggerUpdate();
            return null;
        }
        else {
            url = options.url;
            points = options.points || [];
            zoom = typeof(options.zoom) === 'undefined' ? null : options.zoom;
        }

        this.data.bound = false;
        this.data.url = url || this.data.url;
        this.data.boundZoom = zoom;

        return loadImage(url, hasExif).then( (img) => {
            console.warn("Rewrite loadImage function to use async/await")
            this._replaceImage(img);
            if (!points.length) {
                var natDim = naturalImageDimensions(img);
                var rect = this.elements.viewport.getBoundingClientRect();
                var aspectRatio = rect.width / rect.height;
                var imgAspectRatio = natDim.width / natDim.height;
                var width, height;

                if (imgAspectRatio > aspectRatio) {
                    height = natDim.height;
                    width = height * aspectRatio;
                }
                else {
                    width = natDim.width;
                    height = natDim.height / aspectRatio;
                }

                var x0 = (natDim.width - width) / 2;
                var y0 = (natDim.height - height) / 2;
                var x1 = x0 + width;
                var y1 = y0 + height;
                this.data.points = [x0, y0, x1, y1];
            }
            else if (this.options.relative) {
                points = [
                    points[0] * img.naturalWidth / 100,
                    points[1] * img.naturalHeight / 100,
                    points[2] * img.naturalWidth / 100,
                    points[3] * img.naturalHeight / 100
                ];
            }

            this.data.orientation = options.orientation || 1;
            this.data.points = points.map(function (p) {
                return parseFloat(p);
            });
            if (this.options.useCanvas) {
                this._transferImageToCanvas(this.data.orientation);
            }
            this._updatePropertiesFromImage();
            this._triggerUpdate();
            cb && cb();
        });
    }

    /**
     * Get the crop points, and the zoom of the image.
     * @return Object
     * */
    get() {
        const data = this._get();
        const points = data.points;
        if (this.options.relative) {
            points[0] /= this.elements.img.naturalWidth / 100;
            points[1] /= this.elements.img.naturalHeight / 100;
            points[2] /= this.elements.img.naturalWidth / 100;
            points[3] /= this.elements.img.naturalHeight / 100;
        }
        return data;
    }

    /**
     * Get the resulting crop of the image.
     *
     * @param {Object} options
     * @param options.type The type of result to return defaults to 'canvas'
     *          * 'base64' returns of the cropped image encoded in base64
     *          * 'html' returns html of the image positioned within an div of hidden overflow
     *          * 'blob' returns a blob of the cropped image
     *          * 'rawcanvas' returns the canvas element allowing you to manipulate prior to getting the resulted image
     * @param options.size The size of the cropped image defaults to 'viewport'
     *          * 'viewport' the size of the resulting image will be the same width and height as the viewport
     *          * 'original' the size of the resulting image will be at the original scale of the image
     *          * `{width, height}` an object defining the width and height. If only one dimension is specified, the other will be calculated using the viewport aspect ratio.
     * @param options.format Indicating the image format.
     *          * Default: 'png'
     *          * Valid values: 'jpeg'|'png'|'webp'
     * @param options.quality Number between 0 and 1 indicating image quality.
     *          * Default: 1
     * @param options.circle force the result to be cropped into a circle
     *          * Valid values: true, false
     *
     * @return Promise
     * */
    result(options) {
        var data = this._get(),
            opts = deepExtend(clone(RESULT_DEFAULTS), clone(options)),
            resultType = (typeof (options) === 'string' ? options : (opts.type || 'base64')),
            size = opts.size || 'viewport',
            format = opts.format,
            quality = opts.quality,
            backgroundColor = opts.backgroundColor,
            circle = typeof opts.circle === 'boolean' ? opts.circle : (this.options.viewport.type === 'circle'),
            vpRect = this.elements.viewport.getBoundingClientRect(),
            ratio = vpRect.width / vpRect.height;

        if (size === 'viewport') {
            data.outputWidth = vpRect.width;
            data.outputHeight = vpRect.height;
        } else if (typeof size === 'object') {
            if (size.width && size.height) {
                data.outputWidth = size.width;
                data.outputHeight = size.height;
            } else if (size.width) {
                data.outputWidth = size.width;
                data.outputHeight = size.width / ratio;
            } else if (size.height) {
                data.outputWidth = size.height * ratio;
                data.outputHeight = size.height;
            }
        }

        if (RESULT_FORMATS.indexOf(format) > -1) {
            data.format = 'image/' + format;
            data.quality = quality;
        }

        data.circle = circle;
        data.url = this.data.url;
        data.backgroundColor = backgroundColor;

        return new Promise((resolve) => {
            switch(resultType.toLowerCase())
            {
                case 'rawcanvas':
                    resolve( this._getCanvas(data));
                    break;
                case 'canvas':
                case 'base64':
                    resolve( this._getBase64Result(data));
                    break;
                case 'blob':
                    this._getBlobResult(data).then(resolve);
                    break;
                default:
                    resolve( this._getHtmlResult(data));
                    break;
            }
        });
    }

    refresh() {
        throw new Error("refresh is not implemented now");
    }

    /**
     * Set the zoom of a Croppie instance.
     * The value passed in is still restricted to the min/max set by Croppie.
     * @param {Number} v a floating point to scale the image within the croppie. Must be between a min and max value set by croppie.
     * */
    setZoom(v) {
        throw new Error("setZoom is not implemented now");
    }

    /**
     * Rotate the image by a specified degree amount.
     * Only works with enableOrientation option enabled (see 'Options').
     * @param {Number} deg Valid Values: 90, 180, 270, -90, -180, -270
     * */
    rotate(deg) {
        throw new Error("rotate is not implemented now");
    }

    /**
     * Destroy a croppie instance and remove it from the DOM
     * */
    destroy() {
        throw new Error("destroy is not implemented now");
    }

    /* Private Methods */
    _create() {
        const contClass = 'croppie-container',
            customViewportClass = this.options.viewport.type ? 'cr-vp-' + this.options.viewport.type : null;
        let  boundary, img, viewport, overlay, bw, bh;

        this.options.useCanvas = this.options.enableOrientation || this._hasExif();
        // Properties on class
        this.data = {};
        this.elements = {};

        boundary = this.elements.boundary = document.createElement('div');
        viewport = this.elements.viewport = document.createElement('div');
        img = this.elements.img = document.createElement('img');
        overlay = this.elements.overlay = document.createElement('div');

        if (this.options.useCanvas) {
            this.elements.canvas = document.createElement('canvas');
            this.elements.preview = this.elements.canvas;
        }
        else {
            this.elements.preview = img;
        }

        boundary.classList.add('cr-boundary'); //addClass(boundary, 'cr-boundary');
        boundary.setAttribute('aria-dropeffect', 'none');
        bw = this.options.boundary.width;
        bh = this.options.boundary.height;
        css(boundary, {
            width: (bw + (isNaN(bw) ? '' : 'px')),
            height: (bh + (isNaN(bh) ? '' : 'px'))
        });

        viewport.classList.add('cr-viewport');//addClass(viewport, 'cr-viewport');
        if (customViewportClass) {
            viewport.classList.add(customViewportClass);//addClass(viewport, customViewportClass);
        }
        css(viewport, {
            width: this.options.viewport.width + 'px',
            height: this.options.viewport.height + 'px'
        });
        viewport.setAttribute('tabindex', 0);

        this.elements.preview.classList.add('cr-image');//addClass(this.elements.preview, 'cr-image');
        setAttributes(this.elements.preview, { 'alt': 'preview', 'aria-grabbed': 'false' });
        overlay.classList.add('cr-overlay');//addClass(overlay, 'cr-overlay');

        this.element.appendChild(boundary);
        boundary.appendChild(this.elements.preview);
        boundary.appendChild(viewport);
        boundary.appendChild(overlay);

        this.element.classList.add(contClass);//addClass(this.element, contClass);
        if (this.options.customClass) {
            this.element.classList.add(this.options.customClass);//addClass(this.element, this.options.customClass);
        }

        this._initDraggable(this);

        if (this.options.enableZoom) {
            this._initializeZoom();
        }

        // if (this.options.enableOrientation) {
        //     _initRotationControls.call(this);
        // }

        if (this.options.enableResize) {
            this._initializeResize();
        }
    }

    _updateCenterPoint(rotate) {
        var scale = this._currentZoom,
            data = this.elements.preview.getBoundingClientRect(),
            vpData = this.elements.viewport.getBoundingClientRect(),
            transform = Transform.parse(this.elements.preview.style[CSS_TRANSFORM]),
            pc = new TransformOrigin(this.elements.preview),
            top = (vpData.top - data.top) + (vpData.height / 2),
            left = (vpData.left - data.left) + (vpData.width / 2),
            center = {},
            adj = {};

        if (rotate) {
            var cx = pc.x;
            var cy = pc.y;
            var tx = transform.x;
            var ty = transform.y;

            center.y = cx;
            center.x = cy;
            transform.y = tx;
            transform.x = ty;
        }
        else {
            center.y = top / scale;
            center.x = left / scale;

            adj.y = (center.y - pc.y) * (1 - scale);
            adj.x = (center.x - pc.x) * (1 - scale);

            transform.x -= adj.x;
            transform.y -= adj.y;
        }

        const newCss = {};
        newCss[CSS_TRANS_ORG] = center.x + 'px ' + center.y + 'px';
        newCss[CSS_TRANSFORM] = transform.toString();
        css(this.elements.preview, newCss);
    }


    _initDraggable() {
        var isDragging = false,
            originalX,
            originalY,
            originalDistance,
            vpRect,
            transform;

        const assignTransformCoordinates = (deltaX, deltaY) => {
            const imgRect = this.elements.preview.getBoundingClientRect(),
                top = transform.y + deltaY,
                left = transform.x + deltaX;

            if (this.options.enforceBoundary) {
                if (vpRect.top > imgRect.top + deltaY && vpRect.bottom < imgRect.bottom + deltaY) {
                    transform.y = top;
                }

                if (vpRect.left > imgRect.left + deltaX && vpRect.right < imgRect.right + deltaX) {
                    transform.x = left;
                }
            }
            else {
                transform.y = top;
                transform.x = left;
            }
        }

        const toggleGrabState = (isDragging) => {
            this.elements.preview.setAttribute('aria-grabbed', isDragging);
            this.elements.boundary.setAttribute('aria-dropeffect', isDragging? 'move': 'none');
        }

        const keyDown = (ev) => {
            const LEFT_ARROW  = 37,
                UP_ARROW    = 38,
                RIGHT_ARROW = 39,
                DOWN_ARROW  = 40;
            const parseKeyDown = (key) => {
                switch (key) {
                    case LEFT_ARROW:
                        return [1, 0];
                    case UP_ARROW:
                        return [0, 1];
                    case RIGHT_ARROW:
                        return [-1, 0];
                    case DOWN_ARROW:
                        return [0, -1];
                }
            }

            if (ev.shiftKey && (ev.keyCode === UP_ARROW || ev.keyCode === DOWN_ARROW)) {
                var zoom;
                if (ev.keyCode === UP_ARROW) {
                    zoom = parseFloat(this.elements.zoomer.value) + parseFloat(this.elements.zoomer.step)
                }
                else {
                    zoom = parseFloat(this.elements.zoomer.value) - parseFloat(this.elements.zoomer.step)
                }
                this.setZoom(zoom);
            }
            else if (this.options.enableKeyMovement && (ev.keyCode >= 37 && ev.keyCode <= 40)) {
                ev.preventDefault();
                var movement = parseKeyDown(ev.keyCode);

                transform = Transform.parse(this.elements.preview);
                document.body.style[CSS_USERSELECT] = 'none';
                vpRect = this.elements.viewport.getBoundingClientRect();
                keyMove(movement);
            }
        }

        const keyMove = (movement) => {
            var deltaX = movement[0],
                deltaY = movement[1],
                newCss = {};

            assignTransformCoordinates(deltaX, deltaY);

            newCss[CSS_TRANSFORM] = transform.toString();
            css(this.elements.preview, newCss);
            this._updateOverlay(this);
            document.body.style[CSS_USERSELECT] = '';
            this._updateCenterPoint();
            this._triggerUpdate();
            originalDistance = 0;
        }

        const mouseDown = (ev) => {
            if (ev.button !== undefined && ev.button !== 0) return;

            ev.preventDefault();
            if (isDragging) return;
            isDragging = true;
            originalX = ev.pageX;
            originalY = ev.pageY;

            if (ev.touches) {
                var touches = ev.touches[0];
                originalX = touches.pageX;
                originalY = touches.pageY;
            }
            toggleGrabState(isDragging);
            transform = Transform.parse(this.elements.preview);
            window.addEventListener('mousemove', mouseMove);
            window.addEventListener('touchmove', mouseMove);
            window.addEventListener('mouseup', mouseUp);
            window.addEventListener('touchend', mouseUp);
            document.body.style[CSS_USERSELECT] = 'none';
            vpRect = this.elements.viewport.getBoundingClientRect();
        }

        const mouseMove = (ev) => {
            ev.preventDefault();
            var pageX = ev.pageX,
                pageY = ev.pageY;

            if (ev.touches) {
                var touches = ev.touches[0];
                pageX = touches.pageX;
                pageY = touches.pageY;
            }

            var deltaX = pageX - originalX,
                deltaY = pageY - originalY,
                newCss = {};

            if (ev.type === 'touchmove') {
                if (ev.touches.length > 1) {
                    var touch1 = ev.touches[0];
                    var touch2 = ev.touches[1];
                    var dist = Math.sqrt((touch1.pageX - touch2.pageX) * (touch1.pageX - touch2.pageX) + (touch1.pageY - touch2.pageY) * (touch1.pageY - touch2.pageY));

                    if (!originalDistance) {
                        originalDistance = dist / this._currentZoom;
                    }

                    var scale = dist / originalDistance;

                    this._setZoomerVal(scale);
                    dispatchChange(this.elements.zoomer);
                    return;
                }
            }

            assignTransformCoordinates(deltaX, deltaY);

            newCss[CSS_TRANSFORM] = transform.toString();
            css(this.elements.preview, newCss);
            this._updateOverlay();
            originalY = pageY;
            originalX = pageX;
        }

        const mouseUp = () => {
            isDragging = false;
            toggleGrabState(isDragging);
            window.removeEventListener('mousemove', mouseMove);
            window.removeEventListener('touchmove', mouseMove);
            window.removeEventListener('mouseup', mouseUp);
            window.removeEventListener('touchend', mouseUp);
            document.body.style[CSS_USERSELECT] = '';
            this._updateCenterPoint();
            this._triggerUpdate();
            originalDistance = 0;
        }

        this.elements.overlay.addEventListener('mousedown', mouseDown);
        this.elements.viewport.addEventListener('keydown', keyDown);
        this.elements.overlay.addEventListener('touchstart', mouseDown);
    }

    _updateOverlay() {
        if (!this.elements) return; // since this is debounced, it can be fired after destroy
        const boundRect = this.elements.boundary.getBoundingClientRect(),
            imgData = this.elements.preview.getBoundingClientRect();

        css(this.elements.overlay, {
            width: imgData.width + 'px',
            height: imgData.height + 'px',
            top: (imgData.top - boundRect.top) + 'px',
            left: (imgData.left - boundRect.left) + 'px'
        });
    }

    _triggerUpdate() {
        var data = this.get();

        if (!this._isVisible()) {
            return;
        }

        this.options.update.call(this, data);
        if (this.$ && typeof Prototype === 'undefined') {
            this.$(this.element).trigger('update.croppie', data);
        } else {
            var ev;
            if (window.CustomEvent) {
                ev = new CustomEvent('update', { detail: data });
            } else {
                ev = document.createEvent('CustomEvent');
                ev.initCustomEvent('update', true, true, data);
            }

            this.element.dispatchEvent(ev);
        }
    }

    _isVisible() {
        return this.elements.preview.offsetHeight > 0 && this.elements.preview.offsetWidth > 0;
    }

    _updatePropertiesFromImage() {
        const initialZoom = 1,
            img = this.elements.preview,
            //imgData,
            transformReset = new Transform(0, 0, initialZoom),
            originReset = new TransformOrigin(),
            isVisible = this._isVisible();

        if (!isVisible || this.data.bound) {// if the croppie isn't visible or it doesn't need binding
            return;
        }

        this.data.bound = true;
        const cssReset = {};
        cssReset[CSS_TRANSFORM] = transformReset.toString();
        cssReset[CSS_TRANS_ORG] = originReset.toString();
        cssReset['opacity'] = 1;
        css(img, cssReset);

        const imgData = this.elements.preview.getBoundingClientRect();

        this._originalImageWidth = imgData.width;
        this._originalImageHeight = imgData.height;
        this.data.orientation = this._hasExif() ? getExifOrientation(this.elements.img) : this.data.orientation;

        if (this.options.enableZoom) {
            this._updateZoomLimits(true);
        }
        else {
            this._currentZoom = initialZoom;
        }

        transformReset.scale = this._currentZoom;
        cssReset[CSS_TRANSFORM] = transformReset.toString();
        css(img, cssReset);

        if (this.data.points.length) {
            this._bindPoints(this.data.points);
        } else {
            this._centerImage();
        }

        this._updateCenterPoint();
        this._updateOverlay();
    }

    _setZoomerVal(v) {
        if (this.options.enableZoom) {
            const z = this.elements.zoomer,
                val = fix(v, 4);
            z.value = Math.max(parseFloat(z.min), Math.min(parseFloat(z.max), val)).toString();
        }
    }

    _initializeZoom() {
        const wrap = this.elements.zoomerWrap = document.createElement('div'),
            zoomer = this.elements.zoomer = document.createElement('input');

        wrap.classList.add('cr-slider-wrap');//addClass(wrap, 'cr-slider-wrap');
        zoomer.classList.add('cr-slider');//addClass(zoomer, 'cr-slider');
        zoomer.type = 'range';
        zoomer.step = '0.0001';
        zoomer.value = '1';
        zoomer.style.display = this.options.showZoomer ? '' : 'none';
        zoomer.setAttribute('aria-label', 'zoom');

        this.element.appendChild(wrap);
        wrap.appendChild(zoomer);

        this._currentZoom = 1;

        const change = () => {
            this._onZoom({
                value: parseFloat(zoomer.value),
                origin: new TransformOrigin(this.elements.preview),
                viewportRect: this.elements.viewport.getBoundingClientRect(),
                transform: Transform.parse(this.elements.preview)
            });
        }

        const scroll = (ev) => {
            var delta, targetZoom;

            if(this.options.mouseWheelZoom === 'ctrl' && ev.ctrlKey !== true){
                return 0;
            } else if (ev.wheelDelta) {
                delta = ev.wheelDelta / 1200; //wheelDelta min: -120 max: 120 // max x 10 x 2
            } else if (ev.deltaY) {
                delta = ev.deltaY / 1060; //deltaY min: -53 max: 53 // max x 10 x 2
            } else if (ev.detail) {
                delta = ev.detail / -60; //delta min: -3 max: 3 // max x 10 x 2
            } else {
                delta = 0;
            }

            targetZoom = this._currentZoom + (delta * this._currentZoom);

            ev.preventDefault();
            this._setZoomerVal(targetZoom);
            change.call(this);
        }

        this.elements.zoomer.addEventListener('input', change);// this is being fired twice on keypress
        this.elements.zoomer.addEventListener('change', change);

        if (this.options.mouseWheelZoom) {
            this.elements.boundary.addEventListener('mousewheel', scroll);
            this.elements.boundary.addEventListener('DOMMouseScroll', scroll);
        }
    }

    _onZoom(ui) {
        const transform = ui ? ui.transform : Transform.parse(this.elements.preview),
            vpRect = ui ? ui.viewportRect : this.elements.viewport.getBoundingClientRect(),
            origin = ui ? ui.origin : new TransformOrigin(this.elements.preview);

        const applyCss = () => {
            const transCss = {};
            transCss[CSS_TRANSFORM] = transform.toString();
            transCss[CSS_TRANS_ORG] = origin.toString();
            css(this.elements.preview, transCss);
        }

        this._currentZoom = ui ? ui.value : this._currentZoom;
        transform.scale = this._currentZoom;
        this.elements.zoomer.setAttribute('aria-valuenow', this._currentZoom);
        applyCss();

        if (this.options.enforceBoundary) {
            const boundaries = this._getVirtualBoundaries(vpRect),
                transBoundaries = boundaries.translate,
                oBoundaries = boundaries.origin;

            if (transform.x >= transBoundaries.maxX) {
                origin.x = oBoundaries.minX;
                transform.x = transBoundaries.maxX;
            }

            if (transform.x <= transBoundaries.minX) {
                origin.x = oBoundaries.maxX;
                transform.x = transBoundaries.minX;
            }

            if (transform.y >= transBoundaries.maxY) {
                origin.y = oBoundaries.minY;
                transform.y = transBoundaries.maxY;
            }

            if (transform.y <= transBoundaries.minY) {
                origin.y = oBoundaries.maxY;
                transform.y = transBoundaries.minY;
            }
        }
        applyCss();
        this._debouncedOverlay();
        this._triggerUpdate();
    }

    _getVirtualBoundaries(viewport) {
        const scale = this._currentZoom,
            vpWidth = viewport.width,
            vpHeight = viewport.height,
            centerFromBoundaryX = this.elements.boundary.clientWidth / 2,
            centerFromBoundaryY = this.elements.boundary.clientHeight / 2,
            imgRect = this.elements.preview.getBoundingClientRect(),
            curImgWidth = imgRect.width,
            curImgHeight = imgRect.height,
            halfWidth = vpWidth / 2,
            halfHeight = vpHeight / 2;

        const maxX = ((halfWidth / scale) - centerFromBoundaryX) * -1;
        const minX = maxX - ((curImgWidth * (1 / scale)) - (vpWidth * (1 / scale)));

        const maxY = ((halfHeight / scale) - centerFromBoundaryY) * -1;
        const minY = maxY - ((curImgHeight * (1 / scale)) - (vpHeight * (1 / scale)));

        const originMinX = (1 / scale) * halfWidth;
        const originMaxX = (curImgWidth * (1 / scale)) - originMinX;

        const originMinY = (1 / scale) * halfHeight;
        const originMaxY = (curImgHeight * (1 / scale)) - originMinY;

        return {
            translate: {
                maxX: maxX,
                minX: minX,
                maxY: maxY,
                minY: minY
            },
            origin: {
                maxX: originMaxX,
                minX: originMinX,
                maxY: originMaxY,
                minY: originMinY
            }
        };
    }

    _hasExif() {
        return this.options.enableExif && window.EXIF;
    }

    _initializeResize () {
        var wrap = document.createElement('div');
        var isDragging = false;
        var direction;
        var originalX;
        var originalY;
        var minSize = 50;
        var maxWidth;
        var maxHeight;
        var vr;
        var hr;

        wrap.classList.add('cr-resizer');//addClass(wrap, 'cr-resizer');
        css(wrap, {
            width: this.options.viewport.width + 'px',
            height: this.options.viewport.height + 'px'
        });

        if (this.options.resizeControls.height) {
            vr = document.createElement('div');
            vr.classList.add('cr-resizer-vertical');//addClass(vr, 'cr-resizer-vertical');
            wrap.appendChild(vr);
        }

        if (this.options.resizeControls.width) {
            hr = document.createElement('div');
            hr.classList.add('cr-resizer-horisontal');//addClass(hr, 'cr-resizer-horisontal');
            wrap.appendChild(hr);
        }

        const mouseDown = (ev) => {
            if (ev.button !== undefined && ev.button !== 0) return;

            ev.preventDefault();
            if (isDragging) {
                return;
            }

            var overlayRect = this.elements.overlay.getBoundingClientRect();

            isDragging = true;
            originalX = ev.pageX;
            originalY = ev.pageY;
            direction = ev.currentTarget.className.indexOf('vertical') !== -1 ? 'v' : 'h';
            maxWidth = overlayRect.width;
            maxHeight = overlayRect.height;

            if (ev.touches) {
                var touches = ev.touches[0];
                originalX = touches.pageX;
                originalY = touches.pageY;
            }

            window.addEventListener('mousemove', mouseMove);
            window.addEventListener('touchmove', mouseMove);
            window.addEventListener('mouseup', mouseUp);
            window.addEventListener('touchend', mouseUp);
            document.body.style[CSS_USERSELECT] = 'none';
        }

        const mouseMove = (ev) => {
            var pageX = ev.pageX;
            var pageY = ev.pageY;

            ev.preventDefault();

            if (ev.touches) {
                var touches = ev.touches[0];
                pageX = touches.pageX;
                pageY = touches.pageY;
            }

            var deltaX = pageX - originalX;
            var deltaY = pageY - originalY;
            var newHeight = this.options.viewport.height + deltaY;
            var newWidth = this.options.viewport.width + deltaX;

            if (direction === 'v' && newHeight >= minSize && newHeight <= maxHeight) {
                css(wrap, {
                    height: newHeight + 'px'
                });

                this.options.boundary.height += deltaY;
                css(this.elements.boundary, {
                    height: this.options.boundary.height + 'px'
                });

                this.options.viewport.height += deltaY;
                css(this.elements.viewport, {
                    height: this.options.viewport.height + 'px'
                });
            }
            else if (direction === 'h' && newWidth >= minSize && newWidth <= maxWidth) {
                css(wrap, {
                    width: newWidth + 'px'
                });

                this.options.boundary.width += deltaX;
                css(this.elements.boundary, {
                    width: this.options.boundary.width + 'px'
                });

                this.options.viewport.width += deltaX;
                css(this.elements.viewport, {
                    width: this.options.viewport.width + 'px'
                });
            }

            this._updateOverlay();
            this._updateZoomLimits();
            this._updateCenterPoint();
            this._triggerUpdate();
            originalY = pageY;
            originalX = pageX;
        }

        const mouseUp = () => {
            isDragging = false;
            window.removeEventListener('mousemove', mouseMove);
            window.removeEventListener('touchmove', mouseMove);
            window.removeEventListener('mouseup', mouseUp);
            window.removeEventListener('touchend', mouseUp);
            document.body.style[CSS_USERSELECT] = '';
        }

        if (vr) {
            vr.addEventListener('mousedown', mouseDown);
            vr.addEventListener('touchstart', mouseDown);
        }

        if (hr) {
            hr.addEventListener('mousedown', mouseDown);
            hr.addEventListener('touchstart', mouseDown);
        }

        this.elements.boundary.appendChild(wrap);
    }

    _get() {
        let imgData = this.elements.preview.getBoundingClientRect(),
            vpData = this.elements.viewport.getBoundingClientRect(),
            x1 = vpData.left - imgData.left,
            y1 = vpData.top - imgData.top,
            widthDiff = (vpData.width - this.elements.viewport.offsetWidth) / 2, //border
            heightDiff = (vpData.height - this.elements.viewport.offsetHeight) / 2,
            x2 = x1 + this.elements.viewport.offsetWidth + widthDiff,
            y2 = y1 + this.elements.viewport.offsetHeight + heightDiff;

        let scale = this._currentZoom;
        if (scale === Infinity || isNaN(scale)) {
            scale = 1;
        }

        const max = this.options.enforceBoundary ? 0 : Number.NEGATIVE_INFINITY;
        x1 = Math.max(max, x1 / scale);
        y1 = Math.max(max, y1 / scale);
        x2 = Math.max(max, x2 / scale);
        y2 = Math.max(max, y2 / scale);

        return {
            points: [fix(x1), fix(y1), fix(x2), fix(y2)],
            zoom: scale,
            orientation: this.data.orientation
        };
    }

    _getBlobResult(data) {
        return new Promise((resolve) => {
            this._getCanvas(data).toBlob((blob) => {
                resolve(blob);
            }, data.format, data.quality);
        });
    }

    _replaceImage(img) {
        if (this.elements.img.parentNode) {
            Array.prototype.forEach.call(this.elements.img.classList, function(c) { img.classList.add(c); });
            this.elements.img.parentNode.replaceChild(img, this.elements.img);
            this.elements.preview = img; // if the img is attached to the DOM, they're not using the canvas
        }
        this.elements.img = img;
    }

    _bindPoints(points) {
        if (points.length !== 4) {
            throw "Croppie - Invalid number of points supplied: " + points;
        }
        const pointsWidth = points[2] - points[0],
            // pointsHeight = points[3] - points[1],
            vpData = this.elements.viewport.getBoundingClientRect(),
            boundRect = this.elements.boundary.getBoundingClientRect(),
            vpOffset = {
                left: vpData.left - boundRect.left,
                top: vpData.top - boundRect.top
            },
            scale = vpData.width / pointsWidth,
            originTop = points[1],
            originLeft = points[0],
            transformTop = (-1 * points[1]) + vpOffset.top,
            transformLeft = (-1 * points[0]) + vpOffset.left,
            newCss = {};

        newCss[CSS_TRANS_ORG] = originLeft + 'px ' + originTop + 'px';
        newCss[CSS_TRANSFORM] = new Transform(transformLeft, transformTop, scale).toString();
        css(this.elements.preview, newCss);

        this._setZoomerVal(scale);
        this._currentZoom = scale;
    }

    _centerImage() {
        const imgDim = this.elements.preview.getBoundingClientRect(),
            vpDim = this.elements.viewport.getBoundingClientRect(),
            boundDim = this.elements.boundary.getBoundingClientRect(),
            vpLeft = vpDim.left - boundDim.left,
            vpTop = vpDim.top - boundDim.top,
            w = vpLeft - ((imgDim.width - vpDim.width) / 2),
            h = vpTop - ((imgDim.height - vpDim.height) / 2),
            transform = new Transform(w, h, this._currentZoom);

        css(this.elements.preview, CSS_TRANSFORM, transform.toString());
    }

    _transferImageToCanvas(customOrientation) {
        const canvas = this.elements.canvas,
            img = this.elements.img,
            ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = img.width;
        canvas.height = img.height;

        const orientation = this.options.enableOrientation && customOrientation || getExifOrientation(img);
        drawCanvas(canvas, img, orientation);
    }

    _getCanvas(data) {
        const points = data.points,
            left = num(points[0]),
            top = num(points[1]),
            right = num(points[2]),
            bottom = num(points[3]),
            width = right-left,
            height = bottom-top,
            circle = data.circle,
            canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            startX = 0,
            startY = 0,
            canvasWidth = data.outputWidth || width,
            canvasHeight = data.outputHeight || height;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        if (data.backgroundColor) {
            ctx.fillStyle = data.backgroundColor;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }

        // By default assume we're going to draw the entire
        // source image onto the destination canvas.
        let sx = left,
            sy = top,
            sWidth = width,
            sHeight = height,
            dx = 0,
            dy = 0,
            dWidth = canvasWidth,
            dHeight = canvasHeight;

        //
        // Do not go outside of the original image's bounds along the x-axis.
        // Handle translations when projecting onto the destination canvas.
        //

        // The smallest possible source x-position is 0.
        if (left < 0) {
            sx = 0;
            dx = (Math.abs(left) / width) * canvasWidth;
        }

        // The largest possible source width is the original image's width.
        if (sWidth + sx > this._originalImageWidth) {
            sWidth = this._originalImageWidth - sx;
            dWidth =  (sWidth / width) * canvasWidth;
        }

        //
        // Do not go outside of the original image's bounds along the y-axis.
        //

        // The smallest possible source y-position is 0.
        if (top < 0) {
            sy = 0;
            dy = (Math.abs(top) / height) * canvasHeight;
        }

        // The largest possible source height is the original image's height.
        if (sHeight + sy > this._originalImageHeight) {
            sHeight = this._originalImageHeight - sy;
            dHeight = (sHeight / height) * canvasHeight;
        }

        // console.table({ left, right, top, bottom, canvasWidth, canvasHeight, width, height, startX, startY, circle, sx, sy, dx, dy, sWidth, sHeight, dWidth, dHeight });

        ctx.drawImage(this.elements.preview, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        if (circle) {
            ctx.fillStyle = '#fff';
            ctx.globalCompositeOperation = 'destination-in';
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
        }
        return canvas;
    }

    _updateZoomLimits (initial) {
        var minZoom = Math.max(this.options.minZoom, 0) || 0,
            maxZoom = this.options.maxZoom || 1.5,
            initialZoom,
            defaultInitialZoom,
            zoomer = this.elements.zoomer,
            scale = parseFloat(zoomer.value),
            boundaryData = this.elements.boundary.getBoundingClientRect(),
            imgData = naturalImageDimensions(this.elements.img, this.data.orientation),
            vpData = this.elements.viewport.getBoundingClientRect(),
            minW,
            minH;
        if (this.options.enforceBoundary) {
            minW = vpData.width / imgData.width;
            minH = vpData.height / imgData.height;
            minZoom = Math.max(minW, minH);
        }

        if (minZoom >= maxZoom) {
            maxZoom = minZoom + 1;
        }

        zoomer.min = fix(minZoom, 4);
        zoomer.max = fix(maxZoom, 4);

        if (!initial && (scale < zoomer.min || scale > zoomer.max)) {
            this._setZoomerVal(scale < zoomer.min ? zoomer.min : zoomer.max);
        }
        else if (initial) {
            defaultInitialZoom = Math.max((boundaryData.width / imgData.width), (boundaryData.height / imgData.height));
            initialZoom = this.data.boundZoom !== null ? this.data.boundZoom : defaultInitialZoom;
            this._setZoomerVal(initialZoom);
        }

        dispatchChange(zoomer);
    }
}


const defaultOptions = {
    viewport: {
        width: 100,
        height: 100,
        type: 'square'
    },
    boundary: { },
    orientationControls: {
        enabled: true,
        leftClass: '',
        rightClass: ''
    },
    resizeControls: {
        width: true,
        height: true
    },
    customClass: '',
    showZoomer: true,
    enableZoom: true,
    enableResize: false,
    mouseWheelZoom: true,
    enableExif: false,
    enforceBoundary: true,
    enableOrientation: false,
    enableKeyMovement: true,
    update: function () { }
};
Croppie.defaults = defaultOptions;



