import {writeFile} from 'fs/promises';
import {
	UrlFontName,
	Variant,
	findIconNames,
	generateFontsUrl,
	getCodepointDocument,
	getCodepointMap,
} from './utils.js';
import pathlib from 'path';


// TODO: add the doc
export async function buildFontFiles(
	source: string | string[],
	destination: string,
	variant: Variant
) {
	let iconNames: string[];
	try {
		iconNames = await findIconNames(source);
	} catch (err) {
		console.error(err.message);
		process.exit(1);
	}
	// console.log(iconNames);

	if (!variant) {
		variant = 'OUTLINED';
	}

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
		pathlib.join(destination, 'material-symbols.woff2'),
		Buffer.from(await fontResponse.arrayBuffer())
	);
	await writeFile(
		pathlib.join(destination, 'material-symbols.css'),
		cssContent,
		{
			encoding: 'utf-8',
		}
	);
}
