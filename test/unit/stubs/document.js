import {HTMLElement} from './HTMLElement.js';

export const document = {
	createElement : function () {
		return new HTMLElement();
	}
};

