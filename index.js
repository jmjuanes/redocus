#!/usr/bin/env node

const fs = require("node:fs/promises");
const {existsSync} = require("node:fs");
const path = require("node:path");
const React = require("react");
const runtime = require("react/jsx-runtime");
const {renderToStaticMarkup} = require("react-dom/server");
const matter = require("gray-matter");

// Register require hook for parsing jsx
require("@babel/register")({
    presets: [
        "@babel/preset-react",
    ],
});

const log = msg => console.log(`[redocus] ${msg}`);

// Import ESM packages
const importPackages = () => {
    return Promise.all([
        import("@mdx-js/mdx"),
    ]);
};

const resolveConfig = (args = []) => {
    const resolveConfigurationFile = configFile => {
        const configPath = path.resolve(process.cwd(), configFile);
        if (!existsSync(configPath)) {
            log(`ERROR: configuration file '${configPath}' not found.`);
            process.exit(1);
        }
        // Import and resolve configuration
        const config = require(configPath);
        return Promise.resolve(config);
    };
    // Check if a configuration has been provided via args
    if (args.length === 2 && (args[0] === "--config" || args[0] === "-c")) {
        return resolveConfigurationFile(args[1]);
    }
    // Default: resolve 'redocus.config.js' 
    return resolveConfigurationFile("redocus.config.js");
};

const generateHtml = ({htmlAttributes, headComponents, bodyAttributes, content}) => {
    const element = React.createElement("html", {...htmlAttributes}, 
        React.createElement("head", {}, ...headComponents),
        React.createElement("body", {...bodyAttributes}, content),
    );
    return renderToStaticMarkup(element);
};

const build = async args => {
    const [mdx] = await importPackages();
    const config = await resolveConfig(args);
    log("build started");
    const ctx = {
        pages: [],
        inputPath: path.resolve(process.cwd(), config.input || "./pages"),
        outputPath: path.resolve(process.cwd(), config.output || "./www"),
    };
    // Tiny helper method to execute a hook with the additional argument
    const callHook = async (listenerName, extraArgs = {}) => {
        if (typeof config[listenerName] === "function") {
            await config[listenerName]({ctx, log, ...extraArgs});
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
            if (path.extname(file) === ".mdx") {
                await actions.createPageFromMarkdownFile(path.join(ctx.inputPath, file));
                const page = ctx.pages[ctx.pages.length - 1];
                await callHook("onPageCreate", {page, actions});
            }
        }
    }
    // Call the createPages method
    await callHook("createPages", {actions});
    // Filter pages to keep only valid pages
    ctx.pages = ctx.pages.filter(page => !!page);
    const PageWrapper = typeof config.pageWrapper === "function" ? config.pageWrapper : (p => p.element);
    await callHook("onPreBuild", {});
    for (let index = 0; index < ctx.pages.length; index++) {
        const page = ctx.pages[index];
        const pagePath = path.join(ctx.outputPath, page.path);
        const render = {
            htmlAttributes: {},
            bodyAttributes: {},
            headComponents: [],
            content: React.createElement(PageWrapper, {
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
            }),
        };
        // Call the onRender hook
        await callHook("onRender", {
            page: page,
            setHtmlAttributes: attr => Object.assign(render.htmlAttributes, attr),
            setBodyAttributes: attr => Object.assign(render.bodyAttributes, attr),
            setHeadComponents: components => render.headComponents = components,
        });
        // Generate HTML string from page content
        const content = generateHtml(render);
        await fs.writeFile(pagePath, content, "utf8");
        log(`saved file '${pagePath}'`);
    }
    await callHook("onPostBuild", {});
    log("build finished.");
};

build(process.argv?.slice(2));
