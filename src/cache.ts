import fs from 'fs';
import pathlib from 'path';

export const CACHED_DIRNAME = '.mdicon';
export const CACHED_ICON_NAMES_FILENAME = 'icon-names.json';

export async function getLastBuildIconNamesList(): Promise<string[]> {
	try {
		const contents = (
			await fs.promises.readFile(
				pathlib.join(CACHED_DIRNAME, CACHED_ICON_NAMES_FILENAME)
			)
		).toString();
		return JSON.parse(contents);
	} catch (e) {
		return [];
	}
}

export async function updateCachedIconNames(icons: string[]) {
	try {
		await fs.promises.writeFile(
			pathlib.join(CACHED_DIRNAME, CACHED_ICON_NAMES_FILENAME),
			JSON.stringify(icons)
		);
	} catch (e) {}
}
