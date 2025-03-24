import {DOMTokenList} from './DOMTokenList.js'
import {EventTarget} from './EventTarget.js';

const HTMLElement = function HTMLElement() {
	EventTarget.apply(this, arguments);
	this.style = {};
	this.attributes = {};
	this.classList = new DOMTokenList();
	this.appendChild = function () {
	};
	this.setAttribute = function(key, value) {
		this.attributes[key] = value;
	}
};
HTMLElement.prototype = Object.create(EventTarget.prototype);

export {HTMLElement}
