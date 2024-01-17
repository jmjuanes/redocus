# @redocus/plugin-mdx

> MDX Plugin for Redocus

This plugin allows you to read and convert `.mdx` into HTML using Redocus.

## Installation

You can install the package via npm:

```shell
npm install --save-dev @redocus/plugin-mdx react @mdx-js/mdx
```

or using yarn:

```shell
yarn add --dev @redocus/plugin-mdx react @mdx-js/mdx
```

## Usage

Include this plugin in your `redocus.config.js`:

```javascript
const mdxPlugin = require("@redocus/plugin-mdx");

module.exports = {
    // ...other redocus configuration
    plugins: [
        mdxPlugin(),
    ],
};
```

## License

This project is licensed under the MIT License.
