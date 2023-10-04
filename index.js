#!/usr/bin/env node

const fs = require("node:fs/promises");
const {existsSync} = require("node:fs");
const path = require("node:path");
const React = require("react");
const {renderToStaticMarkup} = require("react-dom/server");
const runtime = require("react/jsx-runtime");
const matter = require("gray-matter");

// Register require hook for parsing jsx
require("@babel/require")({
    presets: [
        "@babel/preset-react",
    ],
});

const log = msg => console.log(`[redocus] ${msg}`);
const isFn = fn => typeof fn === "function";

const initialize = () => {
    const resolveConfig = () => {
        const configPath = path.join(process.cwd(), "redocus.config.js");
        if (!existsSync(configPath)) {
            log(`ERROR: configuration file '${configPath}' not found.`);
            process.exit(1);
        }
        // Import and resolve configuration
        const config = require(configPath);
        return Promise.resolve(config);
    };
    return Promise.all([
        import("@mdx-js/mdx"),
        resolveConfig(),
    ]);
};

initialize().then(initialData => {
    const [mdx, config] = initialData;
    log("Starting build...");
    const inputPath = path.resolve(process.cwd(), config.input || "./pages");
    const outputPath = path.resolve(process.cwd(), config.output || "./www");
    Promise.resolve(true)
        .then(() => {
            // Make sure the output folder exists
            if (!existsSync(outputPath)) {
                return fs.mkdir(outputPath, {recursive: true});
            }
            // Continue
            return true;
        })
        .then(() => {
            //Make sure inputPath folder exists
            if (!existsSync(inputPath)) {
                log(`ERROR: input folder '${inputPath}' does not exist`);
                return process.exit(1);
            }
            log(`Reading .mdx files from '${inputPath}'`);
            return fs.readdir(inputPath);
        })
        .then(files => files.filter(file => path.extname(file) === ".mdx"))
        .then(files => {
            return Promise.all(files.map(file => {
                return fs.readFile(path.join(docsFolder, file), "utf8")
                    .then(fileContent => {
                        const {data, content} = matter(fileContent);
                        return {
                            data: data,
                            content: content,
                            name: path.basename(file, ".mdx"),
                            fileName: path.basename(file, ".mdx") + ".html",
                            url: path.join("./", path.basename(file, ".mdx")),
                        };
                    })
                    .then(page => {
                        return isFn(config.onPageCreate) ? config.onPageCreate(page) : page;
                    });
            }));
        })
        .then(pages =>  pages.flat().filter(page => !!page))
        .then(async pages => {
            const PageWrapper = isFn(config.pageWrapper) ? config.pageWrapper : p => p.element;
            for (let index = 0; index < pages.length; index++) {
                const page = pages[index];
                const pagePath = path.join(outputPath, page.fileName);
                const pageComponent = await mdx.evaluate(page.content, {...runtime});
                const PageContent = React.createElement(PageWrapper, {
                    site: config.siteMetadata || {},
                    page: page,
                    element: React.createElement(pageComponent.default, {
                        components: config.pageComponents || {},
                        site: config.siteMetadata || {},
                        page: page,
                        pages: pages,
                    }),
                    components: config.pageComponents || {},
                    pages: pages,
                });
                // Generate HTML string from page content
                const content = renderToStaticMarkup(PageContent);
                await fs.writeFile(pagePath, content, "utf8");
                log(`Saved file '${pagePath}'`);
            }
            return true;
        })
        .then(() => {
            log("Build finished.");
        });
});
