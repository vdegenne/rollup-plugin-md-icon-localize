/**
 * @license
 * Copyright (c) 2023 Valentin Degenne
 * SPDX-License-Identifier: MIT
 */
import fs from 'fs';
import {arrayAreEquals, findMdIconNames} from './utils.js';
import pathlib from 'path';
import {DEFAULT_FONT_OUTPUT_DIRECTORY, DEFAULT_VARIANT} from './constants.js';
import {MdIconLocalizeOptions} from './index.js';
import {
	CACHED_DIRNAME,
	CACHED_ICON_NAMES_FILENAME,
	getLastBuildIconNamesList,
	updateCachedIconNames,
} from './cache.js';

export const FONT_FILENAME = 'material-symbols.woff2';
export const FONT_CSS_FILENAME = 'material-symbols.css';

export const UrlFontName = {
	OUTLINED: 'Material+Symbols+Outlined',
	ROUNDED: 'Material+Symbols+Rounded',
	SHARP: 'Material+Symbols+Sharp',
} as const;

export type Variant = keyof typeof UrlFontName;
type UrlFontName = (typeof UrlFontName)[Variant];

type CodepointMap = Map<string, string>;

export function fontFilesAreAvailable() {
	return (
		fs.existsSync(pathlib.join(CACHED_DIRNAME, FONT_FILENAME)) &&
		fs.existsSync(pathlib.join(CACHED_DIRNAME, FONT_CSS_FILENAME))
	);
}

/**
 *
 * @param sources Glob of source files to search md-icon's in
 * @param destination
 * @param variant
 */
export async function buildFontFiles({
	include,
	outDir,
	variant = 'OUTLINED',
	additionalIconNames = [],
}: MdIconLocalizeOptions) {
	const iconNames = [
		...new Set((await findMdIconNames(include)).concat(additionalIconNames)),
	];
	// console.log(iconNames);

	// Compare with previous build
	const lastIconNames = await getLastBuildIconNamesList();
	if (arrayAreEquals(iconNames, lastIconNames)) {
		if (fontFilesAreAvailable()) {
			await copyFontFiles(outDir);
			return;
		}
	} else {
		await updateCachedIconNames(iconNames);
	}

	// If no icons, we save and return
	if (iconNames.length === 0) {
		return;
	}

	await downloadFontFiles(iconNames, variant);
	await copyFontFiles(outDir);
}

/**
 * Fetch font files from Google Font and cache them.
 *
 * @param iconNames Array of icon names (e.g. ["settings", "delete", ...])
 * @param variant The font variant to download
 */
export async function downloadFontFiles(iconNames: string[], variant: Variant) {
	const doc = await getCodepointDocument(variant);
	const codepointMap = getCodepointMap(doc);

	const cssUrl = generateFontsUrl(
		UrlFontName[variant],
		iconNames.map((iconName) => codepointMap.get(iconName))
	);

	const options = {
		method: 'GET',
		headers: {
			'User-Agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36', // Mimic a Chrome browser user agent
			'Accept-Language': 'en-US,en;q=0.9',
		},
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
	await fs.promises.writeFile(
		pathlib.join(CACHED_DIRNAME, FONT_FILENAME),
		Buffer.from(await fontResponse.arrayBuffer())
	);
	await fs.promises.writeFile(
		pathlib.join(CACHED_DIRNAME, FONT_CSS_FILENAME),
		cssContent,
		{
			encoding: 'utf-8',
		}
	);
}

export async function fetchCodepointDocument(font: UrlFontName) {
	const res = await fetch(
		`https://raw.githubusercontent.com/google/material-design-icons/master/variablefont/${font.replaceAll(
			'+',
			''
		)}%5BFILL%2CGRAD%2Copsz%2Cwght%5D.codepoints`
	);
	const text = await res.text();
	return text;
}

export async function getCodepointDocument(variant: Variant) {
	const codepointDocFilepath = pathlib.join('.mdicon', `${variant}.codepoints`);
	let codepointDocument;
	if (!fs.existsSync(codepointDocFilepath)) {
		codepointDocument = await fetchCodepointDocument(UrlFontName[variant]);
		fs.promises.writeFile(codepointDocFilepath, codepointDocument);
	} else {
		codepointDocument = String(
			await fs.promises.readFile(codepointDocFilepath)
		);
	}

	return codepointDocument;
}

export function getCodepointMap(codepointDocument: string) {
	const lines = codepointDocument.split('\n');
	const codepointMap: CodepointMap = new Map();
	lines.forEach((line) => {
		const [name, codepoint] = line.split(' ');
		codepointMap.set(name, codepoint);
	});

	return codepointMap;
}

export function generateFontsUrl(font: UrlFontName, codepoints: string[] = []) {
	let text = codepoints.length ? '&text=' : '';

	codepoints.forEach((codepoint) => {
		text += encodeURIComponent(String.fromCharCode(parseInt(codepoint, 16)));
	});

	return `https://fonts.googleapis.com/css2?family=${font}:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200${text}`;
}

/**
 * Copy cached font files to destination.
 *
 * @param destination Where to copy the cached font files
 */
export async function copyFontFiles(
	destination: string = DEFAULT_FONT_OUTPUT_DIRECTORY
) {
	const fontFilepath = pathlib.join(CACHED_DIRNAME, FONT_FILENAME);
	const cssFilepath = pathlib.join(CACHED_DIRNAME, FONT_CSS_FILENAME);

	try {
		await fs.promises.copyFile(
			fontFilepath,
			pathlib.join(destination, FONT_FILENAME)
		);
	} catch (e) {}
	try {
		await fs.promises.copyFile(
			cssFilepath,
			pathlib.join(destination, FONT_CSS_FILENAME)
		);
	} catch (e) {}
}
