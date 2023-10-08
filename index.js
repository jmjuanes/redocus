#!/usr/bin/env node

const fs = require("node:fs/promises");
const {existsSync} = require("node:fs");
const path = require("node:path");
const React = require("react");
const {renderToStaticMarkup} = require("react-dom/server");
const runtime = require("react/jsx-runtime");
const matter = require("gray-matter");

// Register require hook for parsing jsx
require("@babel/register")({
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

initialize().then(async initialData => {
    const [mdx, config] = initialData;
    log("Starting build...");
    const ctx = {
        pages: [],
        inputPath: path.resolve(process.cwd(), config.input || "./pages"),
        outputPath: path.resolve(process.cwd(), config.output || "./www"),
    };
    // Initialize pages actions
    const pagesActions = {
        createPage: page => {
            ctx.pages.push(page);
        },
        deletePage: page => {
            ctx.pages = ctx.pages.filter(p => p !== page);
        },
        createPageFromMarkdownFile: async filePath => {
            const fileContent = await fs.readFile(filePath, "utf8");
            const {data, content} = matter(fileContent);
            const component = await mdx.evaluate(content, {...runtime});
            ctx.pages.push({
                data: data,
                component: component.default,
                name: path.basename(filePath, ".mdx"),
                path: path.basename(filePath, ".mdx") + ".html",
                url: path.join("./", path.basename(filePath, ".mdx")),
            });
        },
    };
    // Make sure the output folder exists
    if (!existsSync(ctx.outputPath)) {
        await fs.mkdir(ctx.outputPath, {recursive: true});
    }
    // Read files from input path
    if (existsSync(ctx.inputPath)) {
        log(`Reading .mdx files from '${ctx.inputPath}'`);
        const inputFiles = await fs.readdir(ctx.inputPath);
        for (let index = 0; index < inputFiles.length; index++) {
            const file = inputFiles[index];
            // We can process only '.mdx' files at this time
            if (path.extname(file) === ".mdx") {
                const filePath = path.join(ctx.inputPath, file);
                await pagesActions.createPageFromMarkdownFile(filePath);
                // Check if a custom onPageCreate has been provided
                if (isFn(config.onPageCreate)) {
                    await config.onPageCreate({
                        page: ctx.pages[ctx.pages.length - 1],
                        actions: pagesActions,
                    });
                }
            }
        }
    }
    // Call the createPages method
    if (isFn(config.createPages)) {
        await config.createPages({
            actions: pagesActions,
        });
    }
    // Filter pages to keep only valid pages
    ctx.pages = ctx.pages.filter(page => !!page);
    const PageWrapper = isFn(config.pageWrapper) ? config.pageWrapper : p => p.element;
    for (let index = 0; index < ctx.pages.length; index++) {
        const page = ctx.pages[index];
        const pagePath = path.join(ctx.outputPath, page.path);
        const PageContent = React.createElement(PageWrapper, {
            site: config.siteMetadata || {},
            page: page,
            element: React.createElement(page.component, {
                components: config.pageComponents || {},
                site: config.siteMetadata || {},
                page: page,
                pages: ctx.pages,
            }),
            components: config.pageComponents || {},
            pages: ctx.pages,
        });
        // Generate HTML string from page content
        const content = renderToStaticMarkup(PageContent);
        await fs.writeFile(pagePath, content, "utf8");
        log(`Saved file '${pagePath}'`);
    }
    log("Build finished.");
});
