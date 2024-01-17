#!/usr/bin/env node

const fs = require("node:fs/promises");
const {existsSync} = require("node:fs");
const path = require("node:path");
const React = require("react");
const {renderToStaticMarkup} = require("react-dom/server");

// Register require hook for parsing jsx
require("@babel/register")({
    presets: [
        "@babel/preset-react",
    ],
});

const log = msg => console.log(`[redocus] ${msg}`);
const isFn = fn => typeof fn === "function";

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

const generateHtml = ({htmlAttributes, headComponents, bodyAttributes, content}) => {
    return React.createElement("html", {...htmlAttributes}, 
        React.createElement("head", {}, ...headComponents),
        React.createElement("body", {...bodyAttributes}, content),
    );
};

const build = async () => {
    const config = await resolveConfig();
    log("build started");
    const ctx = {
        siteMetadata: config.siteMetadata || {},
        components: config.pageComponents || {},
        wrapper: isFn(config.pageWrapper) ? config.pageWrapper : p => p.element,
        pages: [],
        inputPath: path.resolve(process.cwd(), config.input || "./pages"),
        outputPath: path.resolve(process.cwd(), config.output || "./www"),
        plugins: [
            config,
            ...(Array.isArray(config.plugins) ? config.plugins : []),
        ],
    };
    // Call plugins
    const callHook = async (listenerName, extraArgs = {}) => {
        for (let i = 0; i < ctx.plugins.length; i++) {
            if (isFn(ctx.plugins[i][listenerName])) {
                await ctx.plugins[i][listenerName]({ctx, actions, log, ...extraArgs});
            }
        }
    };
    // Initialize pages actions
    const actions = {
        createPage: page => {
            ctx.pages.push({
                ...page,
                data: page.data || {},
                name: page.name || path.basename(page.path, ".html"),
                url: page.url || path.join("./", path.basename(page.path, ".html")),
            });
        },
        deletePage: page => {
            ctx.pages = ctx.pages.filter(p => p !== page);
        },
    };
    // Call the onInit hook
    await callHook("onInit", {});
    // Make sure the output folder exists
    if (!existsSync(ctx.outputPath)) {
        await fs.mkdir(ctx.outputPath, {recursive: true});
    }
    // Read files from input path
    if (existsSync(ctx.inputPath)) {
        log(`reading files from '${ctx.inputPath}'`);
        const inputFiles = await fs.readdir(ctx.inputPath);
        for (let index = 0; index < inputFiles.length; index++) {
            const file = inputFiles[index];
            // We can process only '.jsx' files at this time
            if (path.extname(file) === ".jsx") {
                const filePath = path.join(ctx.inputPath, file);
                const component = require(filePath);
                actions.createPage({
                    component: component,
                    data: component?.pageData || {},
                    path: path.basename(filePath, ".jsx") + ".html",
                });
                // Call the onPageCreate hook
                await callHook("onPageCreate", {
                    page: ctx.pages[ctx.pages.length - 1],
                });
            }
        }
    }
    // Call the createPages method
    await callHook("createPages", {});
    // Filter pages to keep only valid pages
    ctx.pages = ctx.pages.filter(page => !!page);
    const PageWrapper = ctx.wrapper || (p => p.element);
    await callHook("onPreBuild", {});
    for (let index = 0; index < ctx.pages.length; index++) {
        const page = ctx.pages[index];
        const pagePath = path.join(ctx.outputPath, page.path);
        const renderOptions = {
            htmlAttributes: {},
            bodyAttributes: {},
            headComponents: [],
            content: React.createElement(PageWrapper, {
                site: ctx.siteMetadata,
                page: page,
                element: React.createElement(page.component, {
                    components: ctx.components,
                    site: ctx.siteMetadata,
                    page: page,
                    pages: ctx.pages,
                }),
                components: ctx.components,
                pages: ctx.pages,
            }),
        };
        // Call the onRender hook
        await callHook("onRender", {
            page: page,
            setHtmlAttributes: newAttributes => {
                renderOptions.htmlAttributes = newAttributes;
            },
            setBodyAttributes: newAttributes => {
                renderOptions.bodyAttributes = newAttributes;
            },
            setHeadComponents: newComponents => {
                renderOptions.headComponents = newComponents;
            },
        });
        // Generate HTML string from page content
        const content = renderToStaticMarkup(
            generateHtml(renderOptions)
        );
        await fs.writeFile(pagePath, content, "utf8");
        log(`saved file '${pagePath}'`);
    }
    await callHook("onPostBuild", {});
    log("build finished.");
};

build();
