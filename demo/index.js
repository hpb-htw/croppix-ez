import {demo1CropRectangle, demo2CropCircle} from './croppixez-demo.js';

function runDemo() {
    demo1CropRectangle();
    demo2CropCircle();
}

function showExampleCode({fn, elId}) {
    const {js, html} = parseCode(fn.toString());
    const el = document.getElementById(elId);
    const jsContainer = el.querySelector('code[class="language-javascript"]');
    const htmlContainer = el.querySelector('code[class="language-html"]');
    jsContainer.textContent = js;
    htmlContainer.textContent = html;
    if(window.Prism) {
        window.Prism.highlightElement(jsContainer);
        window.Prism.highlightElement(htmlContainer);
    }
}

function parseCode(code) {
    const js = [];
    const html = [];
    const HTML_INDICATOR = '// <';
    const FUNCTION_INDENT_SIZE = 4;
    for(const line of code.split('\n').slice(1, -1) ) {
        const chars = line.trim();
        if (chars.startsWith(HTML_INDICATOR) ) {
            html.push(chars.slice(HTML_INDICATOR.length-1));
        }else {
            js.push(line.slice(FUNCTION_INDENT_SIZE).trimEnd());
        }
    }
    return {js: js.join('\n'), html: html.join('\n')};
}

function showDemoCode() {
    const demoExamples = [
        {fn: demo1CropRectangle, elId: "demo1-listing"},
        {fn: demo2CropCircle,    elId: "demo-circle-crop"}
    ];
    for(const example of demoExamples) {
        showExampleCode(example);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    runDemo();
    try {
        showDemoCode();
    }catch (e) {
        console.error(e);
    }
});
