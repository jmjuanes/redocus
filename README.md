# Redocus

![npm version](https://badgen.net/npm/v/redocus?labelColor=1d2734&color=21bf81)
![license](https://badgen.net/github/license/jmjuanes/redocus?labelColor=1d2734&color=21bf81)

> **Redocus** is an experimental package. Its API is not stable and may change without notice. **Use it at your own risk.**

A Node.js tool that enables you to generate static sites using [React](https://react.dev) and [MDX](https://mdxjs.com). It allows you to easily convert `.mdx` files into static HTML pages with the ability to customize the rendering using React components and pass site metadata as props to the pages.

## Installation

You can install the package via npm:

```shell
npm install --save-dev redocus react react-dom @mdx-js/mdx
```

or using yarn:

```shell
yarn add --dev redocus react react-dom @mdx-js/mdx
```

## Usage

Once you have configured your `redocus.config.js` file, you can start generating your static site by running the following command:

```shell
$ redocus --config redocus.config.js
```

You can also add this command to the `scripts` section of your `package.json`:

```json
{
    "name": "my-package",
    "scripts": {
        "build-pages": "redocus --config redocus.config.js"
    }
}
```

This will process the input MDX files, apply the React components and layout, and generate the corresponding HTML files in the output directory.

That's it! You now have a static site generated using React.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvement, please open an issue or submit a pull request on the [GitHub repository](https://github.com/jmjuanes/redocus).

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
