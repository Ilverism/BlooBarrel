// src/routes/+layout.js
/** @type {import('./$types').LayoutLoad} */
export const load = ({ url }) => {
    const origin = url.origin;
    const canonical = `${origin}${url.pathname}`.replace(/\/+$/, '');

    return {
        title: 'BlooBarrel — GitHub Downloads Made Easy',
        description: "BlooBarrel is a tool for making the experience of downloading files from GitHub repositories easier and more user-friendly by recommending the best release asset based on the user's platform.",
        keywords: 'BlooBarrel,GitHub,Downloads,Releases,Assets,Platform Detection,User-Friendly,Open Source,Software Distribution,Repository Management',
        canonical,
        image: `${origin}/web-app-manifest-512x512.png`,
        structuredData: {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'BlooBarrel',
            applicationCategory: 'Tool, Web Application',
            genre: 'Software, Web, Utility',
            keywords: 'BlooBarrel,GitHub,Downloads,Releases,Assets,Platform Detection,User-Friendly,Open Source,Software Distribution,Repository Management',
            thumbnailUrl: `${origin}/web-app-manifest-512x512.png`,
            screenshot: [`${origin}/screenshot.png`],
            url: origin + '/',
            inLanguage: 'en',
            isAccessibleForFree: true,
            operatingSystem: 'Web',
            description:
                "BlooBarrel is a tool for making the experience of downloading files from GitHub repositories easier and more user-friendly by recommending the best release asset based on the user's platform.",
        }
    };
};

export const prerender = false;