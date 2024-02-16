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
    // Exclude all content from node_modules that is not redocus/theme, because this file
    // contains the default theme configuration
    ignore: [
        filePath => filePath.includes("node_modules") && !filePath.includes("redocus/theme")
    ],
});

const log = msg => console.log(`[redocus] ${msg}`);

// Import ESM packages
const importPackages = pkgs => {
    return Promise.all(pkgs.map(pkgName => import(pkgName)));
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
    return resolveConfigurationFile("./redocus.config.js");
};

const generateHtml = ({htmlAttributes, headComponents, bodyAttributes, content}) => {
    const element = React.createElement("html", {...htmlAttributes}, 
        React.createElement("head", {}, ...(headComponents.filter(Boolean))),
        React.createElement("body", {...bodyAttributes}, content),
    );
    return renderToStaticMarkup(element);
};

const build = async args => {
    const [mdx] = await importPackages(["@mdx-js/mdx"]);
    const config = await resolveConfig(args);
    log("build started");
    const sourcePath = path.resolve(process.cwd(), config.source || config.input || "./pages");
    const outputPath = path.resolve(process.cwd(), config.output || "./www");
    const site = {
        title: config.title || "",
        description: site.description || "",
        data: site.data || {},
        pages: [],
    };
    // Tiny helper method to execute a hook with the additional argument
    const callHook = async (listenerName, extraArgs = {}) => {
        if (typeof config[listenerName] === "function") {
            await config[listenerName]({site, inputPath, outputPath, ...extraArgs});
        }
    };
    // Initialize pages actions
    const actions = {
        createPage: page => site.pages.push(page),
        createPageFromMarkdownFile: async filePath => {
            const fileContent = await fs.readFile(filePath, "utf8");
            const {data, content} = matter(fileContent);
            const component = await mdx.evaluate(content, {...runtime});
            site.pages.push({
                data: data,
                component: component.default,
                name: path.basename(filePath, ".mdx"),
                path: path.basename(filePath, ".mdx") + ".html",
                url: "./" + path.basename(filePath, ".mdx"),
            });
        },
        deletePage: page => {
            site.pages = site.pages.filter(p => p !== page);
        },
    };
    // Call the onInit hook
    await callHook("onInit", {});
    // Make sure the output folder exists
    if (!existsSync(outputPath)) {
        await fs.mkdir(outputPath, {recursive: true});
    }
    // Read files from source path
    if (existsSync(sourcePath)) {
        log(`reading files from '${sourcePath}'`);
        const inputFiles = await fs.readdir(sourcePath);
        for (let index = 0; index < inputFiles.length; index++) {
            const file = inputFiles[index];
            if (path.extname(file) === ".mdx") {
                await actions.createPageFromMarkdownFile(path.join(sourcePath, file));
                const page = site.pages[site.pages.length - 1];
                await callHook("onPageCreate", {page, actions});
            }
        }
    }
    // Call the createPages method
    await callHook("createPages", actions);
    // Filter pages to keep only valid pages
    site.pages = site.pages.filter(page => !!page);
    const PageWrapper = config?.extends?.pageWrapper || config?.pageWrapper || (p => p.element);
    const pageComponents = {
        ...config?.extends?.pageComponents,
        ...config?.pageComponents,
    };
    await callHook("onPreBuild", {});
    for (let index = 0; index < site.pages.length; index++) {
        const page = site.pages[index];
        const pagePath = path.join(outputPath, page.path);
        const render = {
            htmlAttributes: {
                lang: config?.lang || "en",
            },
            bodyAttributes: {},
            headComponents: [
                site.title && React.createElement("meta", {name: "title", content: site.title}),
                site.description && React.createElement("meta", {name: "description", content: site.description}),
                ...(config?.extends?.headComponents || []),
                ...(config?.headComponents || []),
            ],
            content: React.createElement(PageWrapper, {
                site: site,
                theme: config.themeConfig || {},
                page: page,
                element: React.createElement(page.component, {
                    components: pageComponents,
                    site: site,
                    theme: config.themeConfig || {},
                    page: page,
                }),
                components: pageComponents,
            }),
        };
        // Call the onRender hook
        await callHook("onRender", {
            page: page,
            setHtmlAttributes: attr => Object.assign(render.htmlAttributes, attr),
            setBodyAttributes: attr => Object.assign(render.bodyAttributes, attr),
            setHeadComponents: components => {
                render.headComponents = [...render.headComponents, ...components];
            },
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
