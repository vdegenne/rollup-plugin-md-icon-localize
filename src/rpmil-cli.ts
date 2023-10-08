/**
 * @license
 * Copyright (c) 2023 Valentin Degenne
 * SPDX-License-Identifier: MIT
 */
import {UrlFontName} from './utils.js';
import {Variant} from './utils.js';
import {buildFontFiles} from './font.js';

async function main() {
	let [, , src, dest, variant] = process.argv;

	if (
		!src ||
		!dest ||
		(variant &&
			Object.keys(UrlFontName).includes(variant.toUpperCase()) === false)
	) {
		console.error(
			`
USAGE
	rpmil SRC DEST [VARIANT]

OPTIONS
	SRC Source directory where to search for md-icon tags.
	DEST Destination directory where to save the downloaded font files.
	VARIANT outlined, rounded or sharp (default to "outlined").

EXAMPLE
	rpmil src dist
	rpmil src dist rounded
		`.trim()
		);

		process.exit(1);
	}

	await buildFontFiles(
		`${src}/**/*.(ts|js|html)`,
		dest,
		variant.toUpperCase() as Variant
	);
}

await main();
