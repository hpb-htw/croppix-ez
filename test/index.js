//import '../node_modules/qunit/qunit/qunit.js';
import {CroppixEz} from "../lib/croppix-ez.js";

const QUnit = window.QUnit;


QUnit.module('croppix-ez', function() {
    QUnit.test("crops image from a URL", async function (assert) {
        const done = assert.async();
        const container = document.getElementById('demo1');
        const crop = new CroppixEz(container, {
            viewport: {width: 300, height: 300},
            boundary: {width: 500, height: 500},
            showZoomer: false,
            enableOrientation: true
        });
        await crop.bind({
            // path to image file on server
            url: './img/cat.jpg',
            // rotate image upside-down (s. reference for more)
            orientation: 4,
            // zoom 0 set the size of the image to the size of the viewport
            zoom: 0
        });
        const blob = await crop.result({type: 'blob'});
        const img = window.URL.createObjectURL(blob);
        const imgEl = document.createElement('img');
        imgEl.src = img;

        imgEl.addEventListener('load', () => {
            const offset = 3;
            assert.true( Math.abs(imgEl.naturalHeight - 300) <= offset);
            assert.true( Math.abs(imgEl.naturalWidth - 300) <= offset);
            done();
        });
    });

    QUnit.test("crops image from an image", async function(assert){
        const done = assert.async();
        const img = document.getElementById('img-peacock.jpg');
        const crop = new CroppixEz(img,{
            viewport:{width: 300, height: 300},
            boundary:{width: 500, height: 400},
            showZoomer:false
        });

        const result = await crop.result({type: 'rawcanvas'});
        const croppedImg = document.createElement('img');
        croppedImg.src = result.toDataURL();
        croppedImg.addEventListener('load', () => {
            const offset = 3;
            assert.true( Math.abs(croppedImg.naturalWidth - 300) <= offset );
            assert.true( Math.abs(croppedImg.naturalHeight - 300) <= offset );
            done();
        })
    });
});

