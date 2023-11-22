/**
 * @license
 * Copyright (c) 2023 Valentin Degenne
 * SPDX-License-Identifier: MIT
 */
import {readFile} from 'fs/promises';
import {MD_ICON_REGEX} from './constants.js';
import {glob} from 'glob';

/**
 * Search files for md-icon text values.
 *
 * @param sources Glob of source files to search md-icon's in
 * @returns Array of distinct icon names
 */
export async function findMdIconNames(
	sources: string | string[] = 'src/**/*.{ts,html}'
) {
	const files = glob.sync(sources);

	if (files.length === 0) {
		return [];
	}

	let names: string[] = [];

	for (const file of files) {
		const contents = (await readFile(file)).toString();

		// Using replace for convenience
		contents.replace(MD_ICON_REGEX, (_, _openingTag, iconName, _closingTag) => {
			names.push(iconName);
			return iconName;
		});
	}

	// // const grepResultLines = shelljs.grep(MD_ICON_REGEX, files).stdout.split('\n');
	// const grepResultLines = grep(MD_ICON_REGEX, source);
	// const namesMap = new Set<string>();
	// grepResultLines.forEach((line) => {});

	// const names = [...namesMap.keys()];
	// if (names.length === 0) {
	// 	console.error(`No icons found in the sources.`);
	// }

	// Make names distinct
	names = [...new Set(names)];
	return names.sort();
}

export function arrayAreEquals(arr1: any[], arr2: any[]) {
	return arr1.every((i) => arr2.includes(i)) && arr1.length === arr2.length;
}
