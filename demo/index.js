import {demoCropRectangle, demoCropCircle, demoCropImgDom, demoAdjustableCropWindow} from './croppixez-demo.js';
import {showExampleCode, parseExampleFunctions} from "./node_modules/zmdc/dist/zmdc.js";

import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import html from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('html', html);
hljs.registerLanguage('bash', bash);

document.addEventListener("DOMContentLoaded", async () => {
    runDemo();
    const demoScript = './croppixez-demo.js';
    await showDemoCode(demoScript);
    hljs.highlightAll();
});

function runDemo() {
    demoCropRectangle();
    demoCropCircle();
    demoCropImgDom();
    demoAdjustableCropWindow();
}

async function showDemoCode(demoScript) {
    const response = await fetch(demoScript, {method: 'GET'});
    const text = await response.text();
    const demoExamples = parseExampleFunctions(text);
    for (const example of demoExamples) {
        showExampleCode(example);
    }
}