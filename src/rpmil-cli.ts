/**
 * @license
 * Copyright (c) 2023 Valentin Degenne
 * SPDX-License-Identifier: MIT
 */
import fetch from 'node-fetch';
import {
	UrlFontName,
	findIconNames,
	generateFontsUrl,
	getCodepointDocument,
	getCodepointMap,
} from './utils.js';
import {Variant} from './utils.js';
import {writeFile} from 'fs/promises';
import pathlib from 'path';

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

	let iconNames: string[];
	try {
		iconNames = await findIconNames(`${src}/**/*.(ts|js|html)`);
	} catch (err) {
		console.error(err.message);
		process.exit(1);
	}

	if (!variant) {
		variant = 'OUTLINED' as Variant;
	}
	variant = variant.toUpperCase();

	const doc = await getCodepointDocument(variant as Variant);
	const codepointMap = getCodepointMap(doc);

	const cssUrl = generateFontsUrl(
		UrlFontName[variant],
		iconNames.map((name) => codepointMap.get(name))
	);

	const headers = {
		'User-Agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36', // Mimic a Chrome browser user agent
		'Accept-Language': 'en-US,en;q=0.9',
	};
	const options = {
		method: 'GET',
		headers: headers,
	};
	console.log('=== Downloading css file...');
	const cssResponse = await fetch(cssUrl, options);
	let cssContent = await cssResponse.text();

	// Should download the font file in the css file
	const urlPattern = /src: url\((.*?)\) format\('woff2'\);/;
	let fontFileUrl: string;
	cssContent = cssContent.replace(urlPattern, (_, $1) => {
		fontFileUrl = $1;
		return "src: url('material-symbols.woff2') format('woff2');";
	});
	if (!fontFileUrl) {
		console.error('URL not found in downloaded css file.');
		process.exit(1);
	}

	console.log('=== Downloading font file...');
	const fontResponse = await fetch(fontFileUrl);
	await writeFile(
		pathlib.join(dest, 'material-symbols.woff2'),
		Buffer.from(await fontResponse.arrayBuffer())
	);
	await writeFile(pathlib.join(dest, 'material-symbols.css'), cssContent, {
		encoding: 'utf-8',
	});
}

await main();
