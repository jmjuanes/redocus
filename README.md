# Redocus

A Node.js tool that enables you to generate static sites using [React](https://react.dev). It allows you to easily convert `.jsx` files into static HTML pages with the ability to customize the rendering using React components and pass site metadata as props to the pages.

## Installation

You can install the package via npm:

```shell
npm install --save-dev redocus react react-dom
```

or using yarn:

```shell
yarn add --dev redocus react react-dom
```

## Configuration

To configure the static site generation, create a `redocus.config.js` file in the root of your project. Here's an example `redocus.config.js` file:

```javascript
const React = require("react");

module.exports = {
    input: "src/pages",
    output: "www",
    siteMetadata: {
        title: "My Static Site",
        description: "My amazing static site",
        author: "Your Name",
        // ...other site-specific metadata
    },
    pageComponents: {
        // Define your custom components here
    },
    pageWrapper: props => {
        // Wrap the page element into your custom layout
        return (
            <div>{props.element}</div>
        );
    }
    onPageCreate: ({page, actions}) => {
        // Perform actions on each created page
    },
};
```

The following configuration fields can be defined in this file:

### `input`

- Type: string
- Default: `"pages"`

The `input` field specifies the path of the folder containing the input `.jsx` files. By default, it assumes the folder is located at `"pages"`.

### `output`

- Type: string
- Default: `"www"`

The `output` field specifies the path where the generated `.html` files will be saved. By default, it assumes the folder is located at `"www"`.

### `siteMetadata`

- Type: object
- Default: `{}`

The `siteMetadata` field is an object that contains information about your site. This information will be passed as props to the pages components during rendering.

### `pageComponents`

- Type: object
- Default: `{}`

The `pageComponents` field is an object that contains custom components which will be passed to each page component as `props.components`.

### `pageWrapper`

- Type: React component
- Default: `null`

The `pageWrapper` field is a React component that will be used to wrap the entire generated page. You can use this component to provide a consistent layout or styling for all pages.

### `createPages`

- Type: function
- Default: `null`

The `createPages` field is a hook function that allows you to dynamically generate pages.

### `onInit`

- Type: function.
- Default: `null`

The `onInit` field is a hook function that will be triggered after the initialization of redocus and before start reading pages from your `input` folder.

### `onPageCreate`

- Type: function
- Default: `null`

The `onPageCreate` field is a hook function that will be triggered each time a page is found during the static site generation process. You can use this hook to perform additional actions or customizations for each page.

### `onPreBuild`

- Type: function
- Default: `null`

The `onPreBuild` field is a hook function that will be triggered after all `.jsx` files have been processed and before generating the final HTML pages.

### `onPostBuild`

- Type: function
- Default: `null`

The `onPostBuild` field is a hook function that will be triggered after the build process is finished and all HTML pages have been saved.


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

This will process the input Markdown files, apply the React components and layout, and generate the corresponding HTML files in the output directory.

That's it! You now have a static site generated using React.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvement, please open an issue or submit a pull request on the [GitHub repository](https://github.com/jmjuanes/redocus).

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
