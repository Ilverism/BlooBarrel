<script module lang="ts">


    type FileType = {
        fullName?: string;  // e.g. 'Executable Installer'
        extension?: string; // e.g. '.exe'
        icon: string;       // e.g. 'fa-solid fa-file-exe'
    }

    import { type GitHub } from '$lib/github';

    export type Asset = GitHub.Asset & {
        fileType?: FileType;
        platform: Platform;
        isRecommended?: boolean;
    };

</script>

<script lang="ts">

    import { fade, fly, scale, slide, blur } from 'svelte/transition';
    import { page } from '$app/state';
    import { Toggle } from "flowbite-svelte";
    import { base } from '$app/paths';
    import type { Platform } from './releases/Platform';
    import { localStore } from '$lib/localStore.svelte';

    let data:any = $state({
        releases: [],
        fromCache: true
    });

    import { onMount, untrack } from 'svelte';
    import LatestReleasePanel from './LatestReleasePanel.svelte';
    import RepoInformationPanel from './RepoInformationPanel.svelte';
    import ReleaseInformationPanel from './ReleaseInformationPanel.svelte';


    const os = navigator.userAgent;
    const userPlatform =
            /Win/.test(os) ? 'win'
        :   /Mac/.test(os) ? 'mac'
        :   /Linux/.test(os) ? 'linux'
        : null;


    let searchPanelText = $state("");
    let searchPanelOpen = $state(true);
    function searchPanelToggle() {

        searchPanelOpen = !searchPanelOpen;
        console.log("Search panel toggled to new state: ", searchPanelOpen);

    }

    let owner = $state('');
    let repo = $state('');

    let repoMeta = $state(undefined);
    let readme = $state<string | null>(null);
    let topics = $state<string[]>([]);

    const fileTypes: FileType[] = [
        {
            fullName: 'Executable Installer',
            extension: '.exe',
            icon: 'fa-solid fa-file-exe'
        },
        {
            fullName: 'Text File',
            extension: '.txt',
            icon: 'fa-solid fa-file-lines'
        },
        {
            fullName: 'Unknown',
            extension: undefined,
            icon: 'fa-solid fa-question'
        }
    ];

    const platforms: Platform[] = [
        {
            name: 'Windows',
            icon: 'fa-brands fa-windows',
            extensions: ['.exe', '.msi'],
            patterns: [/win/i]
        },
        {
            name: 'macOS',
            icon: 'fa-brands fa-apple',
            extensions: ['.dmg', '.pkg'],
            patterns: [/mac|osx/i]
        },
        {
            name: 'Linux',
            icon: 'fa-brands fa-linux',
            extensions: ['.AppImage', '.deb', '.rpm', '.tar.gz'],
            patterns: [/linux|ubuntu|debian|appimage/i]
        },
        {
            name: 'Android',
            icon: 'fa-brands fa-android',
            extensions: ['.apk'],
            patterns: [/android/i]
        },
        {
            name: 'iOS',
            icon: 'fa-brands fa-apple',
            extensions: ['.ipa'],
            patterns: [/ios/i]
        },
        {
            name: 'Web',
            icon: 'fa-solid fa-globe',
            extensions: ['.html'],
            patterns: [/web/i]
        },
        {
            name: 'Other',
            icon: 'fa-solid fa-question'
        }
    ];



    console.log("User platform:", userPlatform);
    const userPlatformDetected:Platform|null = $state(
        platforms.find((p: { name: string; }) => p.name.toLowerCase().includes(userPlatform??''))
        ??
        platforms.find((p: { name: string; }) => p.name === 'Other')
        ?? null
    );
    let userPlatformFull:Platform|null = $state(userPlatformDetected);



    let newUserPlatformName = $derived.by(() => {
        return userPlatformFull?.name ?? 'Unknown';
    });

    function userPlatformSet(event: Event) {

        /*
            Set the user platform based on the selected option.
            This will be used to filter the assets.
        */

        const select = event.target as HTMLSelectElement;
        const selectedPlatformName = select.value;

        //Find the platform by name
        userPlatformFull = platforms.find((p: Platform) => p.name === selectedPlatformName) ?? null;

        console.log("User platform set to:", userPlatformFull);

    }

    let showInformationPanels = $state(false);

    let filteredAssets = $derived.by(() => {

        console.log("Filtering assets...");

        if (!data.releases.length || !userPlatformFull) {

            console.warn("No releases found or user platform not set.");
            return [];

        }

        const release = data.releases[0];

        let assetsOut = release.assets.map((asset: any) => {

            let matchedPlatforms: Platform[] = [];

            platforms.forEach(platform => {

                const matchesExt = platform.extensions?.some(ext =>
                    asset.name.toLowerCase().endsWith(ext)
                );

                const matchesPattern = platform.patterns?.some(p =>
                    p.test(asset.name)
                );

                 if (matchesExt || matchesPattern)
                    matchedPlatforms.push(platform);

            });

            const primaryPlatform = matchedPlatforms[0] ?? platforms.find(p => p.name === 'Other');

            const extension = asset.name.includes('.')
                ? '.' + asset.name.split('.').pop()?.toLowerCase()
                : null;

            const fileType: FileType =
                fileTypes.find(ft => ft.extension?.toLowerCase() === extension)
                ?? fileTypes.find(ft => ft.fullName === 'Unknown')!;

            console.log("Asset:", asset.name, "Matched platforms:", matchedPlatforms, "Primary platform:", primaryPlatform, "Extension:", extension, "File type:", fileType);

            return {
                ...asset,
                platform: primaryPlatform!,
                isRecommended: matchedPlatforms.some(p => p.name === userPlatformFull?.name),
                extension: extension,
                fileType
            };


        });

        /*
            Sort the assets based on this priority:
            1. Recommended for the current platform
            2. The asset's extension
            3. The asset's name
        */

        let assetsOutRecommended = assetsOut.filter((asset: Asset) => asset.isRecommended);
        let assetsOutNotRecommended = assetsOut.filter((asset: Asset) => !asset.isRecommended);

        assetsOutRecommended.sort((a: Asset, b: Asset) => {

            if (a.fileType?.extension && b.fileType?.extension)
                return a.fileType?.extension.localeCompare(b.fileType?.extension);

            return a.name.localeCompare(b.name);

        });

        assetsOutNotRecommended.sort((a: Asset, b: Asset) => {

            if (a.fileType?.extension && b.fileType?.extension)
                return a.fileType?.extension.localeCompare(b.fileType?.extension);

            return a.name.localeCompare(b.name);

        });

        assetsOut = [...assetsOutRecommended, ...assetsOutNotRecommended];

        console.log("Filtered assets:", assetsOut);

        //Set the latest release and assets
        return assetsOut;

    });

    let assetTopRecommended = $derived.by(() => {

        /*
            Find the first asset that is recommended for the current platform.
            This will be used to highlight the recommended asset in the UI.

            Default to the first asset if no recommended asset is found.

            Use null if no assets are found.

            Here is the logic:
                1. If there are no assets, return null.
                2. Prioritize assets for the current platform.
                3. Prioritize the asset with the most downloads.
                4. If no assets are found, return null.
        */

        //No assets found, return null
        if (!filteredAssets.length) {
            console.warn("No assets found for the latest release.");
            return null;
        }

        let recommendedAssetOut = null;

        //Get assets for the detected/target platform
        const assetsForDetectedPlatform = filteredAssets.filter((asset: Asset) =>
            (asset.platform.name === userPlatformFull?.name)
        );

        if (assetsForDetectedPlatform.length) {

            //Sort by downloads, descending
            assetsForDetectedPlatform.sort((a: Asset, b: Asset) => {
                return (b.download_count ?? 0) - (a.download_count ?? 0);
            });

            //Take the first asset
            recommendedAssetOut = assetsForDetectedPlatform[0];

        } else {

            //No assets for the detected platform, take the first asset
            recommendedAssetOut = filteredAssets[0];

        }

        console.log("Top recommended asset:", recommendedAssetOut);
        return recommendedAssetOut;


    });

    let latestRelease = $derived.by(() => {
        return data.releases[0] ?? null;
    });

    let assetsByPlatform = $derived.by(() => {
        return filteredAssets;
    });


    const RATE_LIMIT_WARNING = 5;
    const REQUESTS_PER_FETCH =  4;

    let rateLimitMax = $state(0);
    let rateLimitRemaining = $state(0);
    let rateLimitResetEpoch = $state(0);
    let rateLimitResetTime = $state(new Date(0));
    let rateLimitResetTimeString = $state('??');
    let performedRateLimitFetch = $state(false);
    function extractRateInfo(res: Response) {

        rateLimitMax        = +res.headers.get('x-ratelimit-limit')! / REQUESTS_PER_FETCH;
        rateLimitRemaining  = +res.headers.get('x-ratelimit-remaining')! / REQUESTS_PER_FETCH;
        rateLimitResetEpoch = +res.headers.get('x-ratelimit-reset')!;

        rateLimitResetTime = new Date(rateLimitResetEpoch * 1_000); //Convert to milliseconds
        rateLimitResetTimeString = rateLimitResetTime.toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'medium',
            timeZone: 'UTC'
        });

        performedRateLimitFetch = true;

    }


    async function fetchRateInfo() {

        /*
            Similar to extractRateInfo, but fetches the rate limit info
            from the GitHub API directly.
        */

        const headers = {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        };

        const response = await fetch('https://api.github.com/rate_limit', { headers });
        if (!response.ok) {
            console.error("Failed to fetch rate limit info:", response.statusText);
            return;
        }

        const rateLimitData = await response.json();
        const coreRateLimit = rateLimitData.rate;
        if (!coreRateLimit) {
            console.error("No rate limit data found in response:", rateLimitData);
            return;
        }

        rateLimitMax = coreRateLimit.limit / REQUESTS_PER_FETCH;
        rateLimitRemaining = coreRateLimit.remaining / REQUESTS_PER_FETCH;
        rateLimitResetEpoch = coreRateLimit.reset;
        rateLimitResetTime = new Date(rateLimitResetEpoch * 1_000); //Convert to milliseconds
        rateLimitResetTimeString = rateLimitResetTime.toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'medium',
            timeZone: 'UTC'
        });

        performedRateLimitFetch = true;

        console.log("Rate limit info fetched:", {
            rateLimitMax,
            rateLimitRemaining,
            rateLimitResetEpoch,
            rateLimitResetTime,
            rateLimitResetTimeString
        });

    }

    onMount(() => {

        /*
            Fetch the rate limit info on page load.
            This will be used to display the rate limit status.
        */

        console.log("Page mounted, fetching rate limit info...");
        fetchRateInfo();

    });


    let isFetching = $state(false);
    let fetchedURL:string|null = $state(null);
    let performedFirstFetch = $state(false);
    let displayInstructions = $state(true);
    async function fetchFromURL(urlOverride: string|null=null) {

        /*
            Fetch the releases from the GitHub API using the URL
            provided in the search bar.

            Alternatively, use the URL provided in the parameters.
        */

        console.log("Fetching releases from URL...");

        //Mark as fetching
        isFetching = true;

        async function fetchHandle(urlOverride:string|null) {

            //Extract 'owner' and 'repo' from the URL
            const URL = urlOverride ?? (document.querySelector('.search-bar') as HTMLInputElement | null)?.value;
            const regex = /https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)/;
            const match = URL?.match(regex);

            //Failed to extract 'owner' and 'repo'
            if (!match) {
                isFetching = false;
                console.error(`...Invalid URL! ('${URL ? URL : '<Empty URL!>'}')`);
                return;
            }

            owner = match[1];
            repo = match[2];

            console.log(`...Got owner and repo: '${owner}', '${repo}'...`);

            const apiRoot = `https://api.github.com/repos/${owner}/${repo}`;
            const headers = {
                Accept: 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            };

            const releasesRes  = fetch(`${apiRoot}/releases?per_page=1`, { headers });
            const repoRes      = fetch(apiRoot, { headers });
            const readmeRes    = fetch(`${apiRoot}/readme`, {headers: { ...headers, Accept: 'application/vnd.github.raw' }});
            const topicsRes    = fetch(`${apiRoot}/topics`,          { headers });


            // kick them all off in parallel
            const [relResp, repoResp, readmeResp, topicsResp] = await Promise.all([
                releasesRes, repoRes, readmeRes, topicsRes
            ]);


            const rateInfo = extractRateInfo(relResp);
            console.log('Rate-limit: ', rateInfo);

            // hydrate the same reactive stores you already have
            const [_releases, _repoMeta, _readmeText, _topicsJson] = await Promise.all([
                relResp.json(),
                repoResp.json(),
                readmeResp.ok ? readmeResp.text() : null,
                topicsResp.json()
            ]);

            data.releases = _releases;
            repoMeta      = _repoMeta;
            readme        = _readmeText;
            topics        = _topicsJson?.names ?? [];

            console.log("...Fetched releases:", data.releases);
            console.log("...Fetched repo metadata:", repoMeta);
            console.log("...Fetched readme:", readme);
            console.log("...Fetched topics:", topics);

            fetchedURL = urlOverride ?? URL ?? null;

        }

        //Call the fetchHandle function
        await fetchHandle(urlOverride);

        //Mark as not fetching
        isFetching = false;

        //Hide instructions
        displayInstructions = false;

        //Set the performed first fetch flag
        performedFirstFetch = true;

        console.log("...Done fetching releases!");

    }

    function buildShareableURL() {

        /*
            Shareable URL format:

            <baseURLhref>?owner=<owner>&repo=<repo>
        */

        //Base HREF
        const baseURLhref = `${page.url.href}`;

        //Build the URL
        const shareableURL = new URL(baseURLhref);
        shareableURL.searchParams.set('owner', owner);
        shareableURL.searchParams.set('repo', repo);

        console.log("Shareable URL:", shareableURL.href);

        //Copy the URL to the clipboard
        navigator.clipboard.writeText(shareableURL.href)
            .then(() => {
                console.log("Shareable URL copied to clipboard!");
            })
            .catch((err) => {
                console.error("Failed to copy shareable URL to clipboard:", err);
            });

    }

    function loadShareableURL() {

        /*
            Attempt to load the shareable URL from the query parameters.
        */

        //Get the base URL
        console.log("Attempting to load shareable URL...");
        console.log("Base: ", base);
        console.log("Page URL:", page.url);

        //Base HREF
        const urlTarget = `${page.url.href}`;
        const shareableURL = new URL(urlTarget);
        console.log("URL Target:", urlTarget);

        /*
            V3 -- Check for full GitHub URL in hash fragment
            e.g. 'http://localhost:4000/#https://github.com/electron/electron/'
        */
        const hashFragment = shareableURL.hash?.replace(/^#/, '');
        if (hashFragment && hashFragment.startsWith('http')) {
            console.log("Detected full GitHub URL in hash:", hashFragment);
            searchPanelText = `${hashFragment}/#BlooBarrel`;
            fetchFromURL(hashFragment);
            return;
        }

        /*
            V1 -- Check for an entire appended URL
            e.g. 'localhost:4000/releases/https://github.com/electron/electron/releases/'
        */
        const pathParts = page.url.pathname.split('/');

        //Get last part (and remove any trailing slashes)
        const lastPart = pathParts[pathParts.length - 1]
            .replace(/\/$/, '');

        if (lastPart.startsWith('http')) {
            console.log("Detected full GitHub URL in path:", lastPart);
            searchPanelText = `${lastPart}/#BlooBarrel`;
            fetchFromURL(lastPart);
            return;
        }


        /*
            V2 -- Query 'owner' and 'repo'
            e.g. 'http://localhost:4000/#owner=electron&repo=electron'
        */
        //Get the 'owner' and 'repo' from the URL parameters
        const owner = shareableURL.searchParams.get('owner');
        const repo = shareableURL.searchParams.get('repo');

        console.log("Shareable URL parameters:", {
            owner: owner,
            repo: repo
        });

        //Failed to load owner/repo, return
        if (!owner || !repo) {
            console.warn("Failed to load a shareable URL! (If you weren't trying to load a shareable URL, you can ignore this message.)");
            return;
        }

        //Build the GitHub URL
        const githubURL = `https://github.com/${owner}/${repo}`;
        console.log("GitHub URL:", githubURL);

        //Set the search panel text, fetch the releases
        searchPanelText = `${githubURL}/#BlooBarrel`;
        fetchFromURL(githubURL);

    }

    //Load the shareable URL on page load
    onMount(() => {
        console.log("Page mounted, attempting to load shareable URL...");
        loadShareableURL();
    });

    //Theme Toggle
    let darkTheme = localStore('darkTheme', false);
    $effect(() => {

        console.log("Toggling dark theme class based on state:", darkTheme.value);
        darkTheme.value = (darkTheme.value ?? false);

        document.documentElement.classList.toggle('dark', darkTheme.value);
        console.log("Dark theme toggled to:", darkTheme.value);

    });

    let darkThemeStoreInitialized = $state(false);
    $effect(() => {

        //Initialize the dark theme store if it hasn't been initialized yet
        if (!darkThemeStoreInitialized) {
            darkThemeStoreInitialized = true;
            console.log("Dark theme store initialized with value:", darkTheme.value);
        }

    });

    //Asset Sorting Store
    let assetSortingMode = localStore('assetSortingMode', 'downloads');

</script>



{#if !darkThemeStoreInitialized}
    <div
        class="absolute inset-0 bg-gray-100 dark:bg-gray-900 items-center justify-center min-w-screen min-h-screen flex flex-col gap-2 z-50"
        out:blur={{ duration: 800, amount: 8, delay: 200 }}
    >
        <div class="text-lg text-gray-700 dark:text-gray-300 italic">Loading...</div>
        <img src="BlooBarrel_LOGO_Small.png" alt="BlooBarrel Logo" class="w-12 h-12 mt-8 animate-pulse">
    </div>
{:else}

    <div class="flex flex-col min-h-screen">

        <!-- Sticky Page Header -->
        <div class="top-0 z-10 bg-base-100 header-area" id="page-header">

            <!-- Header -->
            <div class="flex flex-row items-center justify-between py-4 px-8 shadow-md z-20 relative">

                <!-- Logo & Title -->
                <a
                    class="hover:scale-105 hover:cursor-pointer group ml-16 mb-4 flex flex-row text-2xl font-bold text-blue-400 select-none items-center justify-center gap-2"
                    aria-label="Open BlooBarrel in GitHub"
                    target="_blank"
                    href="https://github.com/Ilverism/BlooBarrel"
                >
                    <img src="BlooBarrel_LOGO_Small.png" alt="Bloobarrel Logo" class="w-8 h-8">
                    <div class="flex flex-col relative">
                        <span class="text-blue-400 self-center">BlooBarrel</span>
                        <span class="text-blue-400 text-sm font-light absolute top-7 whitespace-nowrap group-hover:hidden">ver. 2025-06.29</span>
                        <span class="text-blue-400 text-sm font-light absolute top-7 whitespace-nowrap not-group-hover:hidden pt-1">
                            <i class="fa-solid fa-fw fa-arrow-up-right-from-square text-blue-400/50"></i>
                            Open in GitHub
                        </span>
                    </div>
                </a>

                <!-- Header Settings -->
                <div class="flex flex-row-reverse gap-12">

                    <!-- Detected Platform -->
                    <div class="flex flex-col min-w-48">

                        <div class="header-flat">
                            {userPlatformFull?.name === userPlatformDetected?.name ? 'Detected Platform' : 'Target Platform'}
                        </div>

                        <div class="group relative inline-block min-w-48 hover:bg-blue-100/50 rounded-sm p-2 px-3 mx-[-0.5rem] hover:cursor-pointer">

                            <!-- The real select, stretched over the whole area but invisible -->
                            <select
                                bind:value={newUserPlatformName}
                                onchange={userPlatformSet}
                                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none select-element"
                                aria-label="Platform"
                                name="platform-select"
                            >
                                {#each platforms as platform}
                                    <option value={platform.name}>
                                        {platform.name}
                                    </option>
                                {/each}
                            </select>

                            <!-- What the user actually sees -->
                            <label class="flex items-center gap-2 pointer-events-none select-none w-full" for="platform-select">
                                <i class="{userPlatformFull?.icon} text-blue-600"></i>
                                <span class="text-sm font-bold message-text w-full flex flex-row items-center gap-2">
                                    {userPlatformFull?.name ?? 'Unknown'}
                                    <i class="fa-solid fa-chevron-down text-slate-400 opacity-50 group-hover:opacity-100 ml-auto"></i>
                                </span>
                            </label>
                        </div>

                    </div>

                    <!-- Theme Toggle -->
                    <div class="flex flex-col min-w-48">

                        <div class="header-flat">
                            Toggle Theme
                        </div>

                        <!-- Toggle Switch -->
                        <div class="flex flex-row">
                            <Toggle
                                bind:checked={darkTheme.value}
                                color="blue"
                                class="py-1 hover:cursor-pointer"
                                aria-label="Toggle Page Theme"
                            >
                            </Toggle>


                            <i class="fa-solid fa-fw {darkTheme.value?'fa-moon':'fa-sun'} message-text py-1 scale-125 self-center"></i>
                        </div>
                    </div>

                    <!-- Information Panel Toggle -->
                    {#if performedFirstFetch}
                        <div class="flex flex-col min-w-48" in:fade={{duration: 800}}>

                            <div class="header-flat">
                                Information Panels
                            </div>

                            <!-- Toggle Switch -->
                            <Toggle
                                bind:checked={showInformationPanels}
                                color="blue"
                                class="py-1 hover:cursor-pointer w-fit"
                                aria-label="Toggle Information Panels"
                            >
                            </Toggle>

                        </div>
                    {/if}

                </div>

            </div>

            <hr class="text-slate-400/25"/>

        </div>


        <!-- Search Area -->
        <!-- <div class="flex flex-col items-center justify-center bg-blue-100 gap-4 relative lg:px-24 "> -->
        <div class="search-area flex flex-col items-center justify-center gap-4 relative lg:px-24">


            <!-- Search Panel -->
            {#if searchPanelOpen}
                <div class="
                    grid
                    grid-cols-[1fr_auto_1fr]
                    items-center
                    gap-4
                    pt-8 pb-10 w-full
                    "
                    in:slide={{ duration: 200 }}
                    out:slide={{ duration: 200 }}
                >

                    <!-- Instructions Div -->
                    <div class="flex flex-col mx-auto min-w-114 max-w-[67%] justify-self-start">

                        <button class="w-full group hover:cursor-pointer mb-4" onclick={() => displayInstructions = !displayInstructions} aria-label="Toggle Instructions">

                            <!-- Instructions Header -->
                            <div class="header-flat mr-auto w-full">
                                <div class="flex flex-row items-center gap-2">
                                    <div class="select-none">
                                        Instructions
                                    </div>
                                    <i class="mt-2 ml-auto fa-solid fa-fw fa-chevron-right text-sm font-light {displayInstructions?'rotate-90':'rotate-0'} group-hover:scale-115 transition-all duration-200 ease-in-out"></i>
                                </div>
                            </div>

                        </button>

                        <!-- Instructions Content -->
                        {#if displayInstructions}
                            <span out:fade={{ duration: 200 }} in:fade={{ duration: 200 }}>
                                <ul class="list-disc list-inside text-sm instructions-text max-w-112 space-y-4"
                                    in:slide={{ duration: 400 }}
                                    out:slide={{ duration: 400 }}
                                >
                                    <li>
                                        Paste a <b>GitHub project URL</b> and click 🔍.
                                    </li>
                                    <li>
                                        The project's most recent <b>Release</b> (where ready-to-download files are available) will be shown.
                                    </li>
                                    <li>
                                        Files that match <b>your computer</b> (Windows/macOS/Linux) will be highlighted automatically (you can change this in the header).
                                    </li>
                                    <li>
                                        Click any file to <b>download</b> it.
                                    </li>
                                    <li>
                                        Click the <b>Copy Shareable Link</b> button to copy a link to this page, which you can share with others.
                                    </li>
                                </ul>
                            </span>
                        {/if}

                    </div>

                    <!-- Search Input Area -->
                    <div class="justify-self-center flex flex-col gap-4 w-3xl mx-auto items-start search-panel max-w-[100%] lg:max-w-[75%] my-2">

                        <!-- Search Bar Header -->
                        <div class="w-full">
                            <div class="header-flat">
                                Search for Releases
                            </div>
                        </div>

                        <!-- Search Bar -->
                        <div class="flex flex-row items-center justify-center w-full">

                            <!-- Input Field -->
                            <input
                                bind:value={searchPanelText}
                                name="search-bar"
                                type="text"
                                placeholder="Paste a GitHub link (e.g. https://github.com/owner/project)"
                                class="input input-bordered min-w-full search-bar px-4 flex-1"
                            />

                            <!-- Submit Button -->
                            <div class="flex items-center ml-12 min-w-16 min-h-16">

                                <!-- Fetching, show loading circle -->
                                {#if isFetching}
                                    <i class="fa fa-spinner text-blue-300 animate-spin ml-4 scale-200"></i>

                                <!-- Not fetching, show button -->
                                {:else}
                                    <button
                                        disabled={!searchPanelText}
                                        class="group disabled:opacity-50 flex items-center min-w-16 min-h-16 justify-center button-standard rounded-sm scale-100 hover:scale-105 hover:cursor-pointer outline-2 outline-offset-2 outline-solid outline-blue-300 disabled:outline-gray-300 disabled:pointer-events-none"
                                        onclick={() => fetchFromURL()}
                                        aria-label="Fetch Releases"
                                    >
                                        <i class="fa-solid scale-150 fa-magnifying-glass text-blue-300 group-disabled:text-gray-300"></i>
                                    </button>
                                {/if}

                            </div>

                        </div>

                        <!-- Rate Limit Indicator -->
                        {#if performedRateLimitFetch && (rateLimitRemaining < RATE_LIMIT_WARNING)}
                            <div class="warning-text text-sm! mb-2">
                                <i class="fa-fw fa-solid fa-triangle-exclamation mr-2"></i>
                                <span>
                                    Low rate limit: {rateLimitRemaining}/{rateLimitMax} remaining. Resets at {rateLimitResetTimeString}.
                                </span>
                            </div>
                        {/if}

                    </div>

                    <!-- Other -->
                    <div class="justify-self-end flex flex-col items-start justify-center gap-4 mx-auto scale-125 max-w-[75%]">

                        <!-- Copy Shareable URL -->
                        <button
                            class="button-flat group {fetchedURL?'':'button-flat-disabled'}"
                            onclick={buildShareableURL}
                            aria-label="Copy URL"
                        >
                            <i class="fa-fw fa-solid fa-link"></i>
                            <div class="group-hover:underline">
                                Copy Shareable Link
                            </div>
                        </button>

                    </div>

                </div>
            {/if}

            <!-- Dropdown Toggle Button -->
            <button
                onclick={searchPanelToggle}
                class="
                    group absolute left-1/2 bottom-0            /* anchor: bottom-centre of header */
                    -translate-x-1/2  translate-y-1/2           /* shove left 50 %, down 50 %   */
                    w-16 h-16 rounded-full button-standard shadow-lg
                    border border-slate-400/50 border-t-0
                    hover:scale-115 hover:bg-slate-100 hover:cursor-pointer
                    z-40
                    {performedFirstFetch ? 'scale-100' : 'scale-0 pointer-events-none'} transition-all duration-100 ease-in-out
                "
                aria-label="Fetch Releases"
            >

                    {#if searchPanelOpen}
                        <i class="fa-solid fa-chevron-up text-slate-400"></i>
                    {:else}
                        <i class="fa-solid fa-magnifying-glass text-blue-300 block! group-hover:hidden!"></i>
                        <i class="fa-solid fa-chevron-down text-slate-400 hidden! group-hover:block!"></i>
                    {/if}

            </button>

        </div>


        <!-- Main Panel Area -->
        <!-- <div class="relative w-full h-full py-8">  -->
        <div class="relative w-full h-full py-8">
            {#if isFetching}
                <main
                    class="relative flex z-20 flex-col items-center justify-center w-full h-full pb-64"
                    in:fade={{ duration: 500, delay: 500 }}
                    out:fade={{ duration: 500 }}
                >
                    <i class="fa-solid fa-spinner text-9xl text-blue-300 animate-spin mb-24 [animation-duration:2.0s]"></i>
                    <div class="text-3xl italic text-slate-400 font-light whitespace-pre flex flex-col items-center justify-center gap-4">
                        Fetching releases...
                    </div>
                </main>
            {:else if performedFirstFetch}
                <main
                    class="relative flex flex-row w-full h-full min-h-0 shrink items-start justify-center"
                    in:fade={{ duration: 500, delay: 500 }}
                    out:fade={{ duration: 500 }}
                >

                    <div class="min-w-[70%] w-full min-h-0 h-full px-16">
                        <LatestReleasePanel
                            latestRelease={latestRelease}
                            assetsByPlatform={assetsByPlatform}
                            assetTopRecommended={assetTopRecommended}
                            performedFirstFetch={performedFirstFetch}
                            userPlatformFull={userPlatformFull}
                            assetSortingMode={assetSortingMode}
                        />
                    </div>

                    <!-- Information Panel Stack -->
                    {#if showInformationPanels}
                        <div
                            class="min-w-[30%] flex flex-col items-start justify-start w-full h-full shrink gap-8 pr-16 max-h-full"
                            id="information-panel-stack"
                        >

                            <!-- Repo Information Panel -->
                            <div class="flex-1 min-h-0 w-full">
                                <RepoInformationPanel
                                    repo={repoMeta}
                                    readme={readme}
                                    topics={topics}
                                    fetchedURL={fetchedURL}
                                />
                            </div>

                            <!-- Release Information Panel -->
                            {#if assetsByPlatform.length}
                                <div class="flex-1 min-h-0 w-full">
                                    <ReleaseInformationPanel
                                        release={latestRelease}
                                    />
                                </div>
                            {/if}

                        </div>
                    {/if}

                </main>
            {:else if !isFetching}
                <main
                    class="relative flex z-20 flex-col items-center justify-center w-full h-full pb-80"
                    in:fade={{ duration: 3000 }}
                    out:fade={{ duration: 500 }}
                >

                    <i class="fa-solid fa-chevron-down text-9xl text-neutral-700 animate-bounce mb-24 [animation-duration:2.0s] rotate-180"></i>

                    <div class="text-3xl italic message-text font-light whitespace-pre flex flex-col items-center justify-center gap-4">
                        <div>
                            Welcome to <b>BlooBarrel</b>: GitHub downloads made simple!
                        </div>
                        <div>
                            Use the search bar above to get downloads from a GitHub repository.
                        </div>

                    </div>

                    <img src="BlooBarrel_LOGO_Small.png" alt="BlooBarrel Logo" class="w-12 h-12 mt-8">

                    <!-- Copyable Example -->
                    <button class="group hover:cursor-pointer mt-16 text-2xl italic message-text hover:scale-105 transition-all duration-200 ease-in-out font-light whitespace-pre flex flex-col items-center justify-center gap-4"
                                    onclick={() => {
                                navigator.clipboard.writeText('https://github.com/electron/electron/');
                                console.log("Copied example URL to clipboard!");
                            }}>
                        Try an example (click to copy, then paste into the search bar):
                        <span class="button-flat">
                            <i class="fa-fw fa-solid fa-link"></i>
                            <div class="group-hover:underline">
                                https://github.com/electron/electron/
                            </div>
                        </span>
                    </button>


                </main>
            {/if}
        </div>

    </div>
{/if}




<style lang="postcss">

    @reference "tailwindcss";
    @custom-variant dark (&:where(.dark, .dark *));
    @plugin 'tailwind-scrollbar';

    .search-bar {

        @apply min-w-[50%];
        @apply min-h-12;
        @apply bg-white;
        @apply text-blue-400;
        @apply dark:bg-slate-900;
        @apply dark:text-blue-200;
        @apply rounded-sm;
        @apply outline-3 outline-offset-2 outline-solid outline-blue-300;

    }


    :global(.message-text) {
        @apply text-slate-500;
        @apply dark:text-slate-200;
    }

    :global(html, body) {
        @apply overflow-x-hidden;
        /* @apply overflow-y-scroll; */
        @apply h-full;
        @apply dark:scheme-dark;
    }

    :global(body){
        @apply overflow-y-scroll;
        @apply bg-gradient-to-r;
        @apply from-white via-40% via-white to-zinc-100;
        @apply dark:from-zinc-900 via-40% dark:via-zinc-900 dark:to-neutral-900;
        @apply m-0 flex flex-col min-h-screen;
    }

    :global(.header-flat) {
        @apply text-2xl text-slate-500 font-light inline-block border-b border-slate-400/25 pb-0.5 mb-1;
        @apply dark:text-slate-200;
        @apply dark:border-slate-100/25;
    }

    :global(.header-large) {
        @apply text-7xl text-neutral-700 font-normal;
    }

    :global(.header-large-flat) {
        @apply text-7xl font-normal;
        @apply text-neutral-700;
        @apply dark:text-neutral-100;
        @apply inline-block border-b border-slate-400/50 pb-1.75 mb-1.75;
        @apply dark:border-slate-200/50;
    }

    .header-sub {
        @apply text-lg italic text-slate-400 font-light;
    }

    :global(.button-flat) {
        @apply text-neutral-700;
        @apply dark:text-neutral-100;
        @apply flex flex-row gap-2 items-center justify-center;
        @apply hover:cursor-pointer;
        @apply italic;
    }

    :global(.button-flat-disabled) {
        @apply opacity-25;
        @apply pointer-events-none;
        @apply cursor-not-allowed;
        @apply select-none;
    }

    :global(.warning-text) {
        @apply text-red-800;
        @apply dark:text-red-400;
        @apply font-bold;
        @apply text-2xl;
        @apply italic;
    }

    :global(.search-area) {
        @apply bg-blue-100;
        @apply dark:bg-slate-700;
    }

    :global(.header-area) {
        @apply bg-blue-200;
        @apply dark:bg-slate-800;
    }

    :global(.instructions-text) {
        @apply text-slate-500;
        @apply dark:text-slate-200;
    }

    :global(.button-standard) {
        @apply bg-white;
        @apply dark:bg-slate-900;
    }


    :global(.select-element) {
        @apply bg-white;
        @apply dark:bg-slate-900;
        @apply text-blue-400;
        @apply dark:text-blue-200;
        @apply rounded-sm;
        @apply outline-2 outline-offset-2 outline-solid outline-blue-300;
        @apply hover:cursor-pointer;
    }

</style>