//let assert, Croppie;

import assert from 'node:assert/strict';
import {Croppie} from '../../croppie-es6.js';

import {window} from "./stubs/window.js";
const HTMLElement = window.document.createElement;

const document = window.document;
global.document = document

describe('Croppie', function () {
	let testCroppieObject, stubElement;

	beforeEach(function () {
		stubElement = new HTMLElement();
		stubElement.tagName = "IMG";
		testCroppieObject = new Croppie(stubElement);
	});

	describe('constructor', function () {
		it('should expose a reference to its bound element.', function () {
			assert.strictEqual(testCroppieObject.element, stubElement);
		});

		it('should use croppy defaults if no options are provided.', function () {
			function matchDefaults(actualOptionGroup, expectedOptionGroup, path) {
				path = path || 'options';

				Object
					.keys(expectedOptionGroup)
					.forEach(function (optionName) {
						const currentPath = [
							path,
							optionName
						].join('.');

						if (typeof expectedOptionGroup[optionName] === 'object') {
							matchDefaults(actualOptionGroup[optionName], expectedOptionGroup[optionName], currentPath);
						} else {
							assert.equal(actualOptionGroup[optionName], expectedOptionGroup[optionName], 'Matching ' + currentPath);
						}
					});
			}

			matchDefaults(testCroppieObject.options, Croppie.defaults);
		});

	});

});
