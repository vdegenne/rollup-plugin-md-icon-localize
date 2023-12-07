// export const MD_ICON_REGEX = /(?!<md-icon>)([aA-zZ]+)(?=<\/md-icon>)/g;

import {Variant} from './font.js';

// export const MD_ICON_REGEX = /<md-icon(?:[^>]+)?>([^<]+)<\/md-icon\s*>/g;
// export const MD_ICON_REGEX =
// 	/(<md-icon[^>]*>)\s*([^<\s][^<]*[^<\s])\s*(<\/md-icon\s*>)/g;
export const MD_ICON_REGEX = /(<md-icon[^>]*>)\s*([a-z_]+)\s*(<\/md-icon\s*>)/g;

export const DEFAULT_INCLUDE = 'src/**/*.{js,ts,jsx,tsx,html}';
export const DEFAULT_VARIANT: Variant = 'OUTLINED';
export const DEFAULT_FONT_OUTPUT_DIRECTORY = 'public';
