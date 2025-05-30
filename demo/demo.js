import {CroppixEz} from "../lib/croppix-ez.js";
import {$} from './node_modules/jquery/dist-module/jquery.module.min.js';
import './node_modules/sweetalert/dist/sweetalert.min.js';

import {EXIF} from "../node_modules/exif-es6/dist/exif-es6.js";

window.EXIF = EXIF; // expose EXIF to global scope

const JQUERY_BIND_NAME = 'croppie';

if (typeof $ !== 'undefined') {
    $.fn.croppixez = function (opts) {
        const ot = typeof opts;
        if (ot === 'string') {
            const args = Array.prototype.slice.call(arguments, 1);
            const singleInst = $(this).data(JQUERY_BIND_NAME);

            if (opts === 'get') {
                return singleInst.get();
            } else if (opts === 'result') {
                return singleInst.result.apply(singleInst, args);
            } else if (opts === 'bind') {
                return singleInst.bind.apply(singleInst, args);
            }

            return this.each(function () {
                const i = $(this).data(JQUERY_BIND_NAME);
                if (!i) return;

                const method = i[opts];
                if ($.isFunction(method)) {
                    method.apply(i, args);
                    if (opts === 'destroy') {
                        $(this).removeData(JQUERY_BIND_NAME);
                    }
                } else {
                    throw 'CroppixEz ' + opts + ' method not found';
                }
            });
        } else {
            return this.each(function () {
                const i = new CroppixEz(this, opts);
                i.$ = $;
                $(this).data(JQUERY_BIND_NAME, i);
            });
        }
    };
}


const Demo = (function () {
    function output(node) {

        var existing = $('#result .croppie-result');
        if (existing.length > 0) {
            existing[0].parentNode.replaceChild(node, existing[0]);
        }
        else {
            $('#result')[0].appendChild(node);
        }
    }

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

    function demoMain() {
        const mc = $('#cropper-1');
        mc.croppixez({
            viewport: {
                width: 150,
                height: 150,
                type: 'circle'
            },
            boundary: {
                width: 300,
                height: 300
            },
            // url: 'demo/demo-1.jpg',
            // enforceBoundary: false
            // mouseWheelZoom: false
        });
        mc.on('update.croppie', function (ev, data) {
            // console.log('jquery update', ev, data);
        });
        $('.js-main-image').on('click', function (ev) {
            mc.croppixez('result', {
                type: 'rawcanvas',
                circle: true,
                // size: { width: 300, height: 300 },
                format: 'png'
            }).then(function (canvas) {
                popupResult({
                    src: canvas.toDataURL()
                });
            });
        });
    }

    function demoBasic() {
        const basic = $('#demo-basic').croppixez({
            viewport: {
                width: 150,
                height: 200
            },
            boundary: {
                width: 300,
                height: 300
            }
        });
        basic.croppixez('bind', {
            url: './img/cat.jpg',
            points: [77,469,280,739]
        });

        $('.basic-result').on('click', function() {
            const $w = $('.basic-width'),
                $h = $('.basic-height');
            const w = parseInt($w.val(), 10),
                h = parseInt($h.val(), 10);
            let size = 'viewport';
            if (w || h) {
                size = { width: w, height: h };
            }
            basic.croppixez('result', {
                type: 'canvas',
                size: size,
                resultSize: {
                    width: 50,
                    height: 50
                }
            }).then(function (resp) {
                popupResult({
                    src: resp
                });
            });
        });
    }

    function demoVanilla() {
        const vEl = document.getElementById('vanilla-demo'),
            vanilla = new CroppixEz(vEl, {
                viewport: {width: 200, height: 100},
                boundary: {width: 300, height: 300},
                showZoomer: false,
                enableOrientation: true
            });
        vanilla.bind({
            url: './img/demo-2.jpg',
            orientation: 4,
            zoom: 0
        });
        vEl.addEventListener('update', function (ev) {
            //console.log('vanilla update', ev);
        });
        document.querySelector('.vanilla-result').addEventListener('click', function (ev) {
            vanilla.result({
                type: 'blob'
            }).then(function (blob) {
                popupResult({
                    src: window.URL.createObjectURL(blob)
                });
            });
        });

        $('.vanilla-rotate').on('click', function (ev) {
            vanilla.rotate(parseInt($(this).data('deg')));
        });
    }

    function demoResizer() {
        const vEl = document.getElementById('resizer-demo'),
            resize = new CroppixEz(vEl, {
                viewport: {width: 100, height: 100},
                boundary: {width: 300, height: 300},
                showZoomer: false,
                enableResize: true,
                enableOrientation: true,
                mouseWheelZoom: 'ctrl'
            });
        resize.bind({
            url: './img/demo-2.jpg',
            zoom: 0
        });
        vEl.addEventListener('update', function (ev) {
            console.log('resize update', ev);
        });
        document.querySelector('.resizer-result').addEventListener('click', function (ev) {
            resize.result({
                type: 'blob'
            }).then(function (blob) {
                popupResult({
                    src: window.URL.createObjectURL(blob)
                });
            });
        });
    }

    function demoUpload() {
        const $uploadCrop = $('#upload-demo').croppixez({
            viewport: {
                width: 100,
                height: 100,
                type: 'circle'
            },
            enableExif: true
        });

        function readFile(input) {
            console.warn("TODO: port to ES6");
             if (input.files && input.files[0]) {
                var reader = new FileReader();

                reader.onload = function (e) {
                    $('.upload-demo').addClass('ready');
                    $uploadCrop.croppixez('bind', {
                        url: e.target.result
                    }).then(function(){
                        console.log('jQuery bind complete');
                    });

                }
                reader.readAsDataURL(input.files[0]);
            }
            else {
                swal("Sorry - you're browser doesn't support the FileReader API");
            }
        }

        $('#upload').on('change', function () { readFile(this); });
        $('.upload-result').on('click', function (ev) {
            $uploadCrop.croppixez('result', {
                type: 'canvas',
                size: 'viewport'
            }).then(function (resp) {
                popupResult({
                    src: resp
                });
            });
        });

    }

    function demoHidden() {
        const $hid = $('#hidden-demo');

        $hid.croppixez({
            viewport: {
                width: 175,
                height: 175,
                type: 'circle'
            },
            boundary: {
                width: 200,
                height: 200
            }
        });
        $hid.croppixez('bind', './img/demo-3.jpg');
        $('.show-hidden').on('click', function () {
            $hid.toggle();
            $hid.croppixez('bind');
        });
    }

    function init() {
        demoMain();
        demoBasic();
        demoVanilla();
        demoResizer();
        demoUpload();
        demoHidden();
    }

    return {
        init: init
    };
})();


document.addEventListener("DOMContentLoaded", () => {
    Demo.init();
});
