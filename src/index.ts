import {createFilter} from '@rollup/pluginutils';
import {Plugin} from 'rollup';
import {Variant, getCodepointDocument, getCodepointMap} from './utils.js';
import {existsSync} from 'fs';
import {mkdir, writeFile} from 'fs/promises';
import fastGlob from 'fast-glob';
import {buildFontFiles} from './font.js';

export interface MdIconBundlerOptions {
	/**
	 * Files to include in the search for md-icon's names.
	 *
	 * default to all common files in src directory.
	 */
	include: string | string[];

	/**
	 * The output direction where the downloaded font files should go.
	 *
	 * @default public
	 */
	outDir: string;

	/**
	 * Variant used in the app.
	 * Possible values: outlined, rounded, sharp.
	 *
	 * @default outlined
	 */
	variant: Variant;
}

async function mdIconLocalize(
	options: Partial<MdIconBundlerOptions> = {}
): Promise<Plugin> {
	options = {
		// defaults
		...{
			include: 'src/**/*.(js|ts|jsx|tsx|html)',
			outDir: 'public',
			variant: 'OUTLINED',
		},
		// user
		...options,
	};

	options.include = [
		'node_modules/.vite/deps/**/*.(js|ts|jsx|tsx|html)',
		...(Array.isArray(options.include) ? options.include : [options.include]),
	];

	const filters = options.include.map((include) => {
		return createFilter(include + '*');
	});

	// if (!existsSync('.mdicon')) {
	// 	await mkdir('.mdicon');
	// }

	const codepointDocument = await getCodepointDocument(options.variant);
	const codepointMap = getCodepointMap(codepointDocument);

	const appIcons: string[] = [];

	return {
		name: 'md-icon-localize',

		async buildStart() {
			await buildFontFiles(options.include, options.outDir, options.variant);
		},

		async transform(code, id) {
			if (!filters.some((filter) => filter(id))) {
				return null;
			}
			// Regular expression to match <md-icon> tags
			const mdIconRegex = /(?!<md-icon>)([aA-zZ]+)(?=<\/md-icon>)/g;

			// Extract content from <md-icon> tags
			const updatedCode = code.replace(mdIconRegex, (_, $1) => {
				// Process the content as needed (e.g., log, modify, etc.)
				appIcons.push($1);

				// Replace the <md-icon> tag with its content
				return `&#x${codepointMap.get($1)};`;
			});

			return {
				code: updatedCode,
				map: null,
			};
		},
	};
}

export {mdIconLocalize};
export default mdIconLocalize;
