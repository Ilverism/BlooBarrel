<script lang="ts">
    import "../app.css";
    import '@fortawesome/fontawesome-free/css/all.min.css'
    
    import Seo from 'sk-seo';

    let {
        children,
        data
    } = $props();

    type LayoutData = {
        title?: string;
        description?: string;
        keywords?: string;
        image?: string;
        canonical?: string;
        robots?: string;
        structuredData?: Record<string, unknown>;
    };
    const layoutData = data as LayoutData;


    const jsonLd = layoutData.structuredData
        ? JSON.stringify(layoutData.structuredData).replace(/</g, '\\u003c')
        : null;
 

    const seo = {
        title: layoutData.title ?? 'BlooBarrel — GitHub Downloads Made Easy',
        description: layoutData.description ?? "BlooBarrel is a tool for making the experience of downloading files from GitHub repositories easier and more user-friendly by recommending the best release asset based on the user's platform.",
        keywords: layoutData.keywords ?? 'GitHub, downloads, repository, management',
        image: layoutData.image,
        canonical: layoutData.canonical,
        robots: layoutData.robots ?? 'index,follow',
        twitterCard: 'summary_large_image',
        themeColor: '#e9fcff'
    };


</script>


<svelte:head>
    <title>BlooBarrel</title>
    {#if jsonLd}
        {@html `<script type="application/ld+json">${jsonLd}</script>`}
    {/if}
</svelte:head>

<!-- Render the SEO -->
<Seo {...seo} />


{@render children()}