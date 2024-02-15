const React = require("react");

// @private default logo renderer
const DefaultLogo = props => (
    <React.Fragment>
        <div className="font-black text-xl">
            <span>{props.theme?.siteTitle || props.site.title}</span>
        </div>
        {props.site.version && (
            <div className="flex items-center font-bold text-2xs bg-neutral-100 px-2 py-1 rounded-lg">
                <span>{props.site.version}</span>
            </div>
        )}
    </React.Fragment>
);

// @private default footer renderer
const DefaultFooter = props => (
    <div className="text-sm text-neutral-600">
        Designed by <a href="https://josemi.xyz" className="underline text-neutral-900 hover:text-neutral-950 font-medium">Josemi</a>. 
        Source code available on <a href={props.site.repository} className="underline text-neutral-900 hover:text-neutral-950 font-medium">GitHub</a>. 
    </div>
);

// @private navigation link
const NavLink = props => (
    <a href={props.link} className="flex items-center gap-2 text-neutral-900 px-3 py-2 rounded-md hover:bg-neutral-100 no-underline">
        <div className="flex items-center text-sm font-medium">
            <span>{props.text}</span>
        </div>
    </a>
);

// @private sidebar link
const SidebarLink = props => {
    const classList = [
        "block py-2 px-3 rounded-md no-underline mb-1",
        props.active && "bg-neutral-100 font-bold text-neutral-900",
        !props.active && "bg-white hover:bg-neutral-100 text-neutral-700 hover:text-neutral-800",
    ];
    return (
        <a href={props.link} className={classList.filter(Boolean).join(" ")}>
            <span className="text-sm">{props.text}</span>
        </a>
    );
};

// @private page navigation
const PageNavigation = props => {
    const prevPage = props.pages.find(p => p.url === props.page?.data?.prevPage);
    const nextPage = props.pages.find(p => p.url === props.page?.data?.nextPage);
    return (
        <div className="mt-12 w-full grid grid-cols-2 gap-4">
            <div className="w-full">
                {prevPage && (
                    <a href={prevPage.url} className="no-underline text-neutral-900 block p-4 rounded-md border border-solid border-neutral-200 hover:border-neutral-300">
                        <div className="text-xs text-neutral-700">Previous page</div>
                        <div className="font-medium">{prevPage.data.title}</div>
                    </a>
                )}
            </div>
            <div className="w-full">
                {nextPage && (
                    <a href={nextPage.url} className="no-underline text-neutral-900 block p-4 rounded-md border border-solid border-neutral-200 hover:border-neutral-300">
                        <div className="text-xs text-neutral-700 text-right">Next page</div>
                        <div className="font-medium text-right">{nextPage.data.title}</div>
                    </a>
                )}
            </div>
        </div>
    );
};

// @private documentation page layout
const DocsLayout = props => (
    <React.Fragment>
        <div className="hidden lg:block w-56 shrink-0">
            <div className="w-full py-12 flex flex-col gap-6 sticky top-0">
                {(props.theme?.sidebar || []).map(section => (
                    <div key={section.text} className="text-neutral-900">
                        <div className="font-bold mb-1 capitalize px-3">{section.text}</div>
                        {section?.items?.map(item => (
                            <SidebarLink
                                key={item.link}
                                active={props.page.url === item.link}
                                link={item.link}
                                text={item.text}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
        <div className="w-full max-w-3xl mx-auto py-10">
            {props.page?.data?.title && (
                <div className="mb-10">
                    <div className="text-4xl text-neutral-950 font-bold mb-1">{props.page.data.title}</div>
                    {props.page?.data?.description && (
                        <div className="text-lg text-neutral-800 font-medium leading-relaxed">
                            <span>{props.page.data.description}</span>
                        </div>
                    )}
                </div>
            )}
            {props.element}
            <PageNavigation {...props} />
        </div>
    </React.Fragment>
);

// @private common theme components
const themeComponents = {
    "blockquote": props => <blockquote className="border-l-2 border-neutral-600 text-neutral-600 pl-3">{props.children}</blockquote>,
    "h1": props => <h1 className="mt-8 mb-4 text-neutral-950 text-2xl font-bold">{props.children}</h1>,
    "h2": props => <h2 className="mt-8 mb-4 text-neutral-950 text-xl font-bold">{props.children}</h2>,
    "p": props => <p className="mt-6 mb-6">{props.children}</p>,
    "ul": props => <ul className="list-inside">{props.children}</ul>,
    "ol": props => <ol className="list-inside">{props.children}</ol>,
    "li": props => <li className="mb-3">{props.children}</li>,
    "code": props => <code className="font-mono text-sm">{props.children}</code>,
    "pre": props => <pre className="p-4 rounded-md bg-neutral-900 text-white overflow-auto mb-8">{props.children}</pre>,
    "a": props => (
        <a {...props} className={`underline text-neutral-950 font-medium ${props.className || ""}`}>
            {props.children}
        </a>
    ),
    Separator: () => <div className="my-8 h-px w-full bg-neutral-200" />,
    logo: DefaultLogo,
    footer: DefaultFooter,
};

// @private theme wrapper component
const ThemeWrapper = props => (
    <div className="text-base font-inter text-neutral-800 leading-normal">
        <div className="border-b-1 border-neutral-200 relative">
            <div className="w-full max-w-7xl h-16 px-6 mx-auto flex items-center justify-between">
                <a href="./" className="flex items-center gap-2 text-neutral-900 no-underline">
                    {props.components.logo(props)}
                </a>
                <div className="flex flex-row gap-1 items-center ">
                    {(props.theme?.nav || []).map(item => (
                        <NavLink key={item.link} {...item} />
                    ))}
                </div>
            </div>
        </div>
        <div className="flex w-full max-w-7xl mx-auto gap-4 px-6 pb-16">
            {(!props.page.data?.layout || props.page.data?.layout === "page") && (
                <div className="w-full">
                    {props.element}
                </div>
            )}
            {props.page.data?.layout === "doc" && (
                <DocsLayout {...props} />
            )}
        </div>
        <div className="w-full border-t-1 border-neutral-200">
            <div className="w-full max-w-7xl mx-auto px-6 pt-10 pb-20">
                {props.components.footer(props)}
            </div>
        </div>
    </div>
);

// Default theme configuration
module.exports = {
    defaultHtmlAttributes: {
        lang: "en",
    },
    defaultBodyAttributes: {
        className: "bg-white m-0 p-0 font-inter text-gray-800 leading-normal",
    },
    defaultHeadComponents: [
        <meta charSet="utf-8" />,
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no" />,
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" />,
        <link rel="stylesheet" href="./low.css" />,
    ],
    pageComponents: themeComponents,
    pageWrapper: ThemeWrapper,
};
