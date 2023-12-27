// import assert from 'assert';
import {MD_ICON_REGEX} from '../constants.js';
import {expect} from 'chai';

it('MD_ICON_REGEX catches multi lines icons', () => {
	const input = `
     <md-icon
     >settings</md-icon
     >
     `;

	const match = input.match(MD_ICON_REGEX);
	expect(match[2]).equals('settingss');
});
