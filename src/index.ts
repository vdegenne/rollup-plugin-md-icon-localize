import {createFilter} from '@rollup/pluginutils';
import {Plugin} from 'rollup';
import {Variant, getCodepointDocument, getCodepointMap} from './utils.js';
import {existsSync} from 'fs';
import {mkdir} from 'fs/promises';

export interface MdIconBundlerOptions {
	include: string | string[];
	variant: Variant;
}

async function mdIconLocalize(
	options: Partial<MdIconBundlerOptions> = {}
): Promise<Plugin> {
	// Ensure the defaults
	options = {
		...{
			include: '**/*.(ts|html)',
			variant: 'OUTLINED',
		},
		...options,
	};

	const filter = createFilter(options.include);

	if (!existsSync('.mdicon')) {
		await mkdir('.mdicon');
	}

	const codepointDocument = await getCodepointDocument(options.variant);
	const codepointMap = getCodepointMap(codepointDocument);

	const appIcons: string[] = [];

	return {
		name: 'md-icon-localize',
		async transform(code, id) {
			if (!filter(id)) {
				return null;
			}

			// let updatedCode = code;

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
				map: null, // You can provide a source map if needed
			};
		},
	};
}

export {mdIconLocalize};
export default mdIconLocalize;
