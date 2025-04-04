import {CroppixEz} from "../lib/croppix-ez.js";
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

export function demo1CropRectangle() {
    // the container element for rending image
    const container = document.getElementById('demo1');
    const crop = new CroppixEz(container, {
            viewport: {width: 300, height: 300},
            boundary: {width: 500, height: 500},
            showZoomer: false,
            enableOrientation: true
        });
    crop.bind({
        url: './img/cat.jpg', // path to image file on server
        orientation: 4,       // rotate image upside-down (s. reference for more)
        zoom: 0               // initialize the size of the image to the size of the viewport
    });
    document.getElementById("demo1-btn").addEventListener('click', async (ev) => {
        const blob = await crop.result({type: 'blob'});
        popupResult({src:window.URL.createObjectURL(blob)});
    });
}


export function demo2CropCircle() {
    const center = {x:350, y:396};
    const size = {w:200,h:180};
    const factor = 0.85;
    const container = document.getElementById("demo2");
    const crop = new CroppixEz(container, {
        viewport: {width: 100, height: 100, type: 'circle'},
        boundary: {width: factor*992, height: factor*745},
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
    const zoom = document.getElementById('demo2-zoom');
    container.addEventListener('update', (ev)=>{
        zoom.textContent = `Zoom: ${ev.detail.zoom.toFixed(4)}`;
    });
    document.getElementById('demo2-btn').addEventListener('click', async (ev) => {
        const blob = await crop.result({type: 'canvas'});
        popupResult({src:blob});
    });
}

