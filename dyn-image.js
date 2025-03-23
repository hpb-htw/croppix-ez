export function loadImage(src, doExif) {
    if (!src) { throw 'Source image missing'; }

    const img = new Image();
    img.style.opacity = '0';
    return new Promise(function (resolve, reject) {
        function _resolve() {
            img.style.opacity = '1';
            setTimeout(function () {
                resolve(img);
            }, 1);
        }

        img.removeAttribute('crossOrigin');
        if (src.match(/^https?:\/\/|^\/\//)) {
            img.setAttribute('crossOrigin', 'anonymous');
        }

        img.onload = function () {
            if (doExif) {
                EXIF.getData(img, function () {
                    _resolve();
                });
            }
            else {
                _resolve();
            }
        };
        img.onerror = function (ev) {
            img.style.opacity = 1;
            setTimeout(function () {
                reject(ev);
            }, 1);
        };
        img.src = src;
    });
}

export function naturalImageDimensions(img, ornt) {
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    const orient = ornt || getExifOrientation(img);
    if (orient && orient >= 5) {
        var x= w;
        w = h;
        h = x;
    }
    return { width: w, height: h };
}

export function getExifOrientation (img) {
    return img.exifdata && img.exifdata.Orientation ? num(img.exifdata.Orientation) : 1;
}

export function drawCanvas(canvas, img, orientation) {
    var width = img.width,
        height = img.height,
        ctx = canvas.getContext('2d');

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.save();
    switch (orientation) {
        case 2:
            ctx.translate(width, 0);
            ctx.scale(-1, 1);
            break;

        case 3:
            ctx.translate(width, height);
            ctx.rotate(180*Math.PI/180);
            break;

        case 4:
            ctx.translate(0, height);
            ctx.scale(1, -1);
            break;

        case 5:
            canvas.width = height;
            canvas.height = width;
            ctx.rotate(90*Math.PI/180);
            ctx.scale(1, -1);
            break;

        case 6:
            canvas.width = height;
            canvas.height = width;
            ctx.rotate(90*Math.PI/180);
            ctx.translate(0, -height);
            break;

        case 7:
            canvas.width = height;
            canvas.height = width;
            ctx.rotate(-90*Math.PI/180);
            ctx.translate(-width, height);
            ctx.scale(1, -1);
            break;

        case 8:
            canvas.width = height;
            canvas.height = width;
            ctx.translate(0, width);
            ctx.rotate(-90*Math.PI/180);
            break;
    }
    ctx.drawImage(img, 0,0, width, height);
    ctx.restore();
}

export function fix(v, decimalPoints) {
    return parseFloat(v).toFixed(decimalPoints || 0);
}

export function num(v) {
    return parseInt(v, 10);
}
