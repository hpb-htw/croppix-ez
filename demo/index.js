import {demoCropRectangle, demoCropCircle, demoCropImgDom, demoAdjustableCropWindow} from './croppixez-demo.js';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
hljs.registerLanguage('javascript', javascript);

function runDemo() {
    demoCropRectangle();
    demoCropCircle();
    demoCropImgDom();
    demoAdjustableCropWindow();
}

async function showDemoCode() {
    const DEMO_SCRIPT = './croppixez-demo.js';
    const response = await fetch(DEMO_SCRIPT, {method: 'GET'});
    const text = await response.text();
    const demoExamples = parseText(text);
    for(const example of demoExamples) {
        showExampleCode(example);
    }
}

/**
 * @param {string} text
 * */
function parseText(text) {
    const example = [];
    let functionLines = [];
    const DEMO_INDICATOR = 'export function demo';
    const state = {
        inFunction: false,
        openCurly: 0,
        closeCurly: 0
    };
    for (const line of text.split('\n')) {
        if(line.startsWith(DEMO_INDICATOR)) {
            // recognize a new demo function
            state.inFunction = true;
        }
        if(state.inFunction) {
            functionLines.push(line);
            const {openCurly, closeCurly} = countCurly(line);
            state.openCurly += openCurly;
            state.closeCurly += closeCurly;
            if (state.openCurly === state.closeCurly) {
                // reset state
                console.log(state)
                state.inFunction = false;
                state.openCurly = 0;
                state.closeCurly = 0;
                example.push( parseCode(functionLines) );
                functionLines = []
            }
        }
    }
    return example;
}

function countCurly(line) {
    const length = line.length;
    const openCurly = length - (line.replaceAll('{','').length);
    const closeCurly = length - (line.replaceAll('}','').length);
    return {openCurly, closeCurly};
}


function parseCode(functionLines) {
    const HTML_INDICATOR = '// <';
    const FUNCTION_INDENT_SIZE = 4;

    const js = [];
    const html = [];
    const functionBodyLines = functionLines.slice(2, -1);
    if(functionBodyLines.length === 0) {
        js.push('/* function is minified */');
        html.push('<!-- function is minified -->')
    }
    for(const line of functionBodyLines ) {
        const chars = line.trim();
        if (chars.startsWith(HTML_INDICATOR) ) {
            html.push(chars.slice(HTML_INDICATOR.length-1));
        }else {
            js.push(line.slice(FUNCTION_INDENT_SIZE).trimEnd());
        }
    }
    const elId = parseElId(functionLines[1]);
    return {js: js.join('\n'), html: html.join('\n'), elId};
}


function parseElId(line) {
    line = line.trim();
    const EL_ID_INDICATOR = '// tag:';
    if(line.startsWith(EL_ID_INDICATOR)) {
        return line.slice(EL_ID_INDICATOR.length).trim();
    }
    throw new Error(`'${line}' not started with ${EL_ID_INDICATOR}`);
}

/**
 * @param {string} jsCode
 * @param {string} html
 * @param {string} elId
 * */
function showExampleCode({js, html, elId}) {
    const el = document.getElementById(elId);
    if(el) {
        const jsContainer = el.querySelector('code[class="language-javascript"]');
        const htmlContainer = el.querySelector('code[class="language-html"]');
        jsContainer.innerHTML = hljs.highlight(js, {language: 'javascript', ignoreIllegals: true}).value;
        htmlContainer.innerHTML = hljs.highlight(html, {language: 'javascript', ignoreIllegals: true}).value;
    }else {
        throw new Error(`Container element with id='${elId}' not found`);
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
