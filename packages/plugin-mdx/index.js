const fs = require("node:fs/promises");
const {existsSync} = require("node:fs");
const path = require("node:path");
const runtime = require("react/jsx-runtime");
const matter = require("gray-matter");

let mdxPackage = null;

const importMdx = async () => {
    if (!mdxPackage) {
        mdxPackage = await import("@mdx-js/mdx");
    }
    return mdxPackage;
};

const createMarkdownPage = async filePath => {
    const mdx = await importMdx();
    const fileContent = await fs.readFile(filePath, "utf8");
    const {data, content} = matter(fileContent);
    const component = await mdx.evaluate(content, {...runtime});
    return {
        data: data,
        component: component.default,
        name: path.basename(filePath, ".mdx"),
        path: path.basename(filePath, ".mdx") + ".html",
        url: path.join("./", path.basename(filePath, ".mdx")),
    };
};

module.exports = (options = {}) => ({
    onInit: async ({ctx}) => {
        Object.assign(ctx.components, options?.components || {});
    },
    createPages: async ({ctx, actions}) => {
        const folder = options?.input ? path.resolve(process.cwd(), options.input) : ctx.inputPath;
        if (existsSync(folder)) {
            const files = (await fs.readdir(folder)).filter(file => {
                return !!file && path.extname(file) === ".mdx";
            });
            // Parse each file
            for (let index = 0; index < files.length; index++) {
                const file = files[index];
                const filePath = path.join(folder, file);
                const page = await createMarkdownPage(filePath);
                actions.createPage(page);
            }
        }
    },
});

// Export utils
module.exports.createMarkdownPage = createMarkdownPage;
