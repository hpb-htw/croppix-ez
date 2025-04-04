import {CroppixEz} from "../dist/croppix-ez.es.js";
import {$} from './node_modules/jquery/dist-module/jquery.module.min.js';
import './node_modules/sweetalert/dist/sweetalert.min.js';

import {EXIF} from "../node_modules/exif-es6/dist/exif-es6.js";

window.EXIF = EXIF; // expose EXIF to global scope

function popupResult(result) {
    let html;
    if (result.html) {
        html = result.html;
    }
    if (result.src) {
        html = '<img src="' + result.src + '" />';
    }
    swal({
        title: '',
        html: true,
        text: html,
        allowOutsideClick: true
    });
    setTimeout(function () {
        $('.sweet-alert').css('margin', function () {
            const top = -1 * ($(this).height() / 2),
                left = -1 * ($(this).width() / 2);

            return top + 'px 0 0 ' + left + 'px';
        });
    }, 1);
}

export function demoCropRectangle() {
    // tag:demo-basic
    // the container element for rending image
    // <div id="demo1"></div>
    const container = document.getElementById('demo1');
    const crop = new CroppixEz(container, {
            viewport: {width: 300, height: 300},
            boundary: {width: 500, height: 500},
            showZoomer: false,
            enableOrientation: true
        });
    crop.bind({
        // path to image file on server
        url: './img/cat.jpg',
        // rotate image upside-down (s. reference for more)
        orientation: 4,
        // initialize the size of the image to the size of the viewport
        zoom: 1
    });
    // <button id="demo1-btn">Get Result</button>
    document.getElementById("demo1-btn")
        .addEventListener('click', async (ev) => {
            const blob = await crop.result({type: 'blob'});
            popupResult({src:window.URL.createObjectURL(blob)});
    });
}

export function demoCropCircle() {
    // tag:demo-circle-crop
    const center = {x:350, y:396};
    const size = {w:200,h:180};
    const imageSize = {w:992, h:745};
    const factor = 0.45;
    const boundary = {width:imageSize.w*factor, height:imageSize.h*factor};
    // <div id="demo2"></div>
    const container = document.getElementById("demo2");
    const crop = new CroppixEz(container, {
        viewport: {width: 100, height: 100, type: 'circle'},
        boundary: boundary,
        showZoomer: false
    });
    const points = [
        center.x - size.w/2,
        center.y - size.h/2,
        center.x + size.w/2,
        center.y + size.h/2
    ];
    crop.bind({
        url: 'img/jaguar.jpg',
        points
    });
    // update zoom
    // <span id="demo2-zoom"></span>
    const zoom = document.getElementById('demo2-zoom');
    container.addEventListener('update', (ev)=>{
        zoom.textContent = `Zoom: ${ev.detail.zoom.toFixed(4)}`;
    });
    // <button id="demo2-btn">Get Result</button>
    document.getElementById('demo2-btn')
        .addEventListener('click', async (ev) => {
            const blob = await crop.result({type: 'canvas'});
            popupResult({src:blob});
    });
}

export function demoCropImgDom() {
    // tag: demo-image-dom-listing
    // <img id="img-peacock.jpg" src="img/peacock.jpg">
    const img = document.getElementById('img-peacock.jpg');
    const crop = new CroppixEz(img,{
        viewport:{width: 300, height: 300},
        boundary:{width: 500, height: 400},
        showZoomer:false
    });
    // <button id="image-dom-btn">Get Result</button>
    document.getElementById('image-dom-btn')
        .addEventListener('click', async (ev) => {
            const result = await crop.result({type: 'rawcanvas'});
            popupResult({src: result.toDataURL()});
        });
}

export function demoAdjustableCropWindow() {
    // tag: adjustable-crop-window-listing
    // <div id="adjustable-demo"></div>
    const container = document.getElementById("adjustable-demo");
    const crop = new CroppixEz(container, {
        viewport: {width: 300, height: 300},
        boundary: {width: 500, height: 400},
        showZoomer: false,
        enableResize: true
    });
    crop.bind({
        url: './img/peacock.jpg',
        zoom: 0
    });
    // <input id="adjustable-size-width" type="text" placeholder="width" />
    const widthEl = document.getElementById('adjustable-size-width');
    // <input id="adjustable-size-height" type="text" placeholder="height" />
    const heightEl = document.getElementById('adjustable-size-height');
    container.addEventListener('update', (ev) => {
        const [topLeftX, topLeftY, bottomRightX, bottomRightY] = ev.detail.points;
        const width = Math.abs(bottomRightX - topLeftX);
        const height = Math.abs(bottomRightY - topLeftY);
        widthEl.value = width;
        heightEl.value = height;
    });
    // <button id="adjustable-result-btn">Get Result</button>
    document.getElementById("adjustable-result-btn")
        .addEventListener('click', async (ev) => {
            const width = parseInt(widthEl.value, 10) ;
            const height = parseInt(heightEl.value, 10) ;
            let size = 'viewport';
            if(width || height) { size = {width, height}; }
            const result = await crop.result({
                type: 'base64',
                size
            });
            popupResult({src: result});
        });
}

