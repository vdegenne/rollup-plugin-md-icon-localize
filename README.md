<div align=left>
	<img src="./logo.png" width="364px">
</div>

## Why?

If you use `<md-icon>` element from [Material Web 3](https://github.com/material-components/material-web) you probably noticed that there are two inconvenients:

- You don't have the font file locally.
- The requested font file is rather big and include all Material Symbols (around 3.5MB)

This rollup plugin can be used to download the font file that includes only the icons found in your source code.

## Installation

```
npm i -D rollup-plugin-md-icon-localize
```

## Usage

Just import the module and add it to the plugins list

```javascript
import {mdIconLocalize} from 'rollup-plugin-md-icon-localize';

export default {
	plugins: [mdIconLocalize()],
};
```

Here are the background steps that the plugin goes through:

- Scans the source code and builds a list of all icons found.
- Downloads minimum size font file for your code. 2 files are created:
  - `material-symbols.woff2`: The font file itself.
  - `material-symbols.css` : The stylesheet importing the font and defining the icon class.
    You need to import this file somewhere in your code to resolve the codepoints.
- Replaces all found icon names in your code with their appropriate codepoint.

In the end your code will have codepoints for names and a size shortened local font file.
That's really all about it.

## Caveats

When using Vite in dev/watch mode you will have to restart vite server everytime you add a new icon name.

## Contributing

If you find some problems or want to propose an improvement, please open an issue to report and PR's are warmly welcomed.

## License

MIT (c) 2023 Valentin Degenne.
