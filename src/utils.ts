/**
 * @license
 * Copyright (c) 2023 Valentin Degenne
 * SPDX-License-Identifier: MIT
 */
import {existsSync} from 'fs';
import {readFile, writeFile} from 'fs/promises';
import pathlib from 'path';
import fastGlob from 'fast-glob';
import shelljs from 'shelljs';

export const mdIconRegexp = /(?!<md-icon>)([aA-zZ]+)(?=<\/md-icon>)/g;

export const UrlFontName = {
	OUTLINED: 'Material+Symbols+Outlined',
	ROUNDED: 'Material+Symbols+Rounded',
	SHARP: 'Material+Symbols+Sharp',
} as const;

export type Variant = keyof typeof UrlFontName;
type UrlFontName = (typeof UrlFontName)[Variant];

type CodepointMap = Map<string, string>;

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
	if (!existsSync(codepointDocFilepath)) {
		codepointDocument = await fetchCodepointDocument(UrlFontName[variant]);
		writeFile(codepointDocFilepath, codepointDocument);
	} else {
		codepointDocument = String(await readFile(codepointDocFilepath));
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

export async function findIconNames(
	source: string | string[] = 'src/**/*.(ts|html)'
) {
	const files = await fastGlob(source, {absolute: true});
	if (files.length === 0) {
		throw new Error('No files to search.');
	}
	const grepResultLines = shelljs.grep(mdIconRegexp, files).stdout.split('\n');
	const namesMap = new Set<string>();
	grepResultLines.forEach((line) => {
		line.replace(mdIconRegexp, (_, $1) => {
			namesMap.add($1);
			return $1;
		});
	});

	const names = [...namesMap.keys()];
	if (names.length === 0) {
		console.error(`No icons found in the sources.`);
	}

	return names.sort();
}

export const generateFontsUrl = (
	font: UrlFontName,
	codepoints: string[] = []
) => {
	let text = codepoints.length ? '&text=' : '';

	codepoints.forEach((codepoint) => {
		text += encodeURIComponent(String.fromCharCode(parseInt(codepoint, 16)));
	});

	return `https://fonts.googleapis.com/css2?family=${font}:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200${text}`;
};
