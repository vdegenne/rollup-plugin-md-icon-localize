import fs from 'fs';
import {createFilter} from '@rollup/pluginutils';
import {type Plugin} from 'rollup';
import {
	Variant,
	buildFontFiles,
	getCodepointDocument,
	getCodepointMap,
} from './font.js';
import {
	DEFAULT_FONT_OUTPUT_DIRECTORY,
	DEFAULT_INCLUDE,
	DEFAULT_VARIANT,
	MD_ICON_REGEX,
} from './constants.js';

export interface MdIconLocalizeOptions {
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

	/**
	 * List of additional icon name to include in the font.
	 * Particularly useful when the analyzer can't detect dynamically
	 * built md-icon elements.
	 */
	additionalIconNames: string[];
}

async function mdIconLocalize(
	options: Partial<MdIconLocalizeOptions> = {}
): Promise<Plugin> {
	const _options: MdIconLocalizeOptions = {
		// defaults
		...{
			include: DEFAULT_INCLUDE,
			outDir: DEFAULT_FONT_OUTPUT_DIRECTORY,
			variant: DEFAULT_VARIANT,
			additionalIconNames: [],
		},
		// user
		...options,
	};

	_options.include = [
		'node_modules/.vite/deps/**/*.{js,ts,jsx,tsx,html}',
		...(Array.isArray(_options.include)
			? _options.include
			: [_options.include]),
	];

	const filters = _options.include.map((include) => {
		return createFilter(include + '*');
	});

	if (!fs.existsSync('.mdicon')) {
		await fs.promises.mkdir('.mdicon');
	}

	const codepointDocument = await getCodepointDocument(_options.variant);
	const codepointMap = getCodepointMap(codepointDocument);

	return {
		name: 'md-icon-localize',

		async buildStart() {
			await buildFontFiles(_options);
		},

		transform(code, id) {
			if (!filters.some((filter) => filter(id))) {
				return null;
			}

			// Replace icon names with codepoint
			code = code.replace(
				MD_ICON_REGEX,
				(_, openingTag, iconName, closingTag) =>
					`${openingTag}&#x${codepointMap.get(iconName)};${closingTag}`
			);

			return code;
		},
	};
}

export {mdIconLocalize};
export default mdIconLocalize;
