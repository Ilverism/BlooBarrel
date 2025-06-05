<script lang="ts">
    
    import { fade, fly, scale, slide } from 'svelte/transition';
    import { page } from '$app/state';
    import { Toggle } from "flowbite-svelte";
    import type { Platform } from './Platform';

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
    let readme = $state(null);
    let topics = $state<string[]>([]);

    type FileType = {
        fullName?: string;  // e.g. 'Executable Installer'
        extension?: string; // e.g. '.exe'
        icon: string;      // e.g. 'fa-solid fa-file-exe'
    }

    type Asset = {
        name: string;
        fileType?: FileType;
        platform: Platform;
        browser_download_url: string;
        isRecommended?: boolean;
    }

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

    let recommendedAsset = $derived.by(() => {

        /*
            Find the first asset that is recommended for the current platform.
            This will be used to highlight the recommended asset in the UI.

            Default to the first asset if no recommended asset is found.

            Use null if no assets are found.
        */

        //No assets found, return null
        if (!filteredAssets.length) {
            console.warn("No assets found for the current platform, can't recommend any.");
            return null;
        }

        const recommended = filteredAssets.find((asset: Asset) => asset.isRecommended);

        //Got a recommended asset, return it
        if (recommended) {
            console.log("Recommended asset found:", $state.snapshot(recommended));
            return recommended;
        }

        console.warn("No recommended asset found, returning the first asset.");
        return filteredAssets[0] ?? null;

    });

    let latestRelease = $derived.by(() => {
        return data.releases[0] ?? null;
    });

    let assetsByPlatform = $derived.by(() => {
        return filteredAssets;
    });

    let assetRecommended = $derived.by(() => {
        return filteredAssets.find((asset: { isRecommended: any; }) => asset.isRecommended) ?? null;
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

            //Call the 'fetchReleases' function from the server with a POST request
            const response = await fetch('/releases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    owner: owner,
                    repo: repo,
                })
            });

            //Check if the response is ok
            if (!response.ok) {
                console.error("...Failed to fetch releases!");
                return;
            }
            
            //Log the response
            const dataIncoming = await response.json();
            console.log("...Fetched releases:", dataIncoming);

            //Check if the response is empty
            if (dataIncoming.length == 0) {
                console.error("...No releases found!");
                return;
            }

            //Update Repo Metadata
            repoMeta = {...dataIncoming.repoMeta};

            //Update Readme
            readme = dataIncoming.readme ?? null;

            //Update Topics
            topics = dataIncoming.topics ?? [];

            //Set the data to the releases
            data.releases = [...dataIncoming.releases];
            data.fromCache = false;

            //Set the fetched URL
            fetchedURL = URL ?? null;

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

        //Get the base URL
        console.log("Base URL:", page.url);

        //Base HREF
        const baseURLhref = page.url.href;

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
        console.log("Base URL:", page.url);

        //Base HREF
        const baseURLhref = page.url.href;
        const shareableURL = new URL(baseURLhref);

        /*
            V1 -- Check for an entire appended URL
            e.g. 'localhost:4000/releases/https://github.com/electron/electron/releases/'
        */
        const pathParts = page.url.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];

        if (lastPart.startsWith('http')) {
            console.log("Detected full GitHub URL in path:", lastPart);
            searchPanelText = lastPart;
            fetchFromURL(lastPart);
            return;
        }


        /*
            V2 -- Query 'owner' and 'repo'
            e.g. 'localhost:4000/releases?owner=electron&repo=electron'
        */
        const owner = shareableURL.searchParams.get('owner');
        const repo = shareableURL.searchParams.get('repo');

        //Failed to load owner/repo, return
        if (!owner || !repo) {
            console.error("Failed to load shareable URL!");
            return;
        }

        //Build the GitHub URL 
        const githubURL = `https://github.com/${owner}/${repo}`;
        console.log("GitHub URL:", githubURL);

        //Set the search panel text, fetch the releases
        searchPanelText = githubURL;
        fetchFromURL(githubURL);

    }

    //Load the shareable URL on page load
    onMount(() => {
        console.log("Page mounted, attempting to load shareable URL...");
        loadShareableURL();
    });



</script>



<div class="flex flex-col min-h-screen">

    <!-- Sticky Page Header -->
    <div class="top-0 z-10 bg-base-100 bg-blue-200" id="page-header">

        <!-- Header -->
        <div class="flex flex-row items-center justify-between py-4 px-8 shadow-md z-20 relative">

            <!-- Logo & Title -->
            <div class="ml-16 mb-4 flex flex-row text-2xl font-bold text-blue-400 select-none items-center justify-center gap-2">
                <img src="BlooBarrel_LOGO_Small.png" alt="Bloobarrel Logo" class="w-8 h-8">
                <div class="flex flex-col relative">
                    <span class="text-blue-400 self-center">BlooBarrel</span>
                    <span class="text-blue-400 text-sm font-light absolute top-7 whitespace-nowrap">ver. alpha-2025-06.01</span>
                </div>
            </div>
        
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
                            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"      
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
                            <span class="text-sm font-bold text-slate-700 w-full flex flex-row items-center gap-2">
                                {userPlatformFull?.name ?? 'Unknown'}
                                <i class="fa-solid fa-chevron-down text-slate-400 opacity-50 group-hover:opacity-100 ml-auto"></i>
                            </span>
                        </label>
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
                            class="py-1 hover:cursor-pointer"
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
    <div class="flex flex-col items-center justify-center bg-blue-100 gap-4 relative lg:px-24">


        <!-- Search Panel -->
        {#if searchPanelOpen}
            <div class="
                grid 
                grid-cols-[1fr_auto_1fr]  /* 1 fr │ auto │ 1 fr  */
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
                            <ul class="list-disc list-inside text-sm text-slate-500 max-w-112 space-y-4"
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
                <div class="justify-self-center flex flex-col gap-4 w-3xl mx-auto items-start search-panel max-w-[100%] lg:max-w-[75%]">

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
                                    class="group flex items-center min-w-16 min-h-16 justify-center bg-white rounded-sm scale-100 hover:scale-105 hover:cursor-pointer outline-2 outline-offset-2 outline-solid outline-blue-300 disabled:outline-gray-300 disabled:pointer-events-none"
                                    onclick={() => fetchFromURL()}
                                    aria-label="Fetch Releases"
                                >
                                    <i class="fa-solid scale-150 fa-magnifying-glass text-blue-300 group-disabled:text-gray-300"></i>
                                </button>
                            {/if}

                        </div>

                    </div>

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
                w-16 h-16 rounded-full bg-white/100 shadow-lg
                border border-slate-400/50 border-t-0
                hover:scale-115 hover:bg-slate-100 hover:cursor-pointer
                z-50
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
                        releasesData={data.releases}
                        assetsByPlatform={assetsByPlatform}
                        assetRecommended={recommendedAsset}
                        performedFirstFetch={performedFirstFetch}
                        showInformationPanels={showInformationPanels}
                        userPlatformFull={userPlatformFull}
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

                <div class="text-3xl italic text-slate-400 font-light whitespace-pre flex flex-col items-center justify-center gap-4">
                    <div>
                        Welcome to BlooBarrel.
                    </div>
                    <div>
                        Use the search bar above to fetch releases from a GitHub repository.
                    </div>

                </div>

                <img src="BlooBarrel_LOGO_Small.png" alt="BlooBarrel Logo" class="w-12 h-12 mt-8">

                <!-- Copyable Example -->
                <button class="hover:cursor-pointer mt-24 text-2xl italic text-slate-400 font-light whitespace-pre flex flex-col items-center justify-center gap-4"
                                onclick={() => {
                            navigator.clipboard.writeText('https://github.com/electron/electron/');
                            console.log("Copied example URL to clipboard!");
                        }}>
                    Try an example (click to copy, then paste into the search bar):
                    <span class="button-flat group">
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





<style lang="postcss">

    @reference "tailwindcss";

    .search-bar {
        
        @apply min-w-[50%];
        @apply min-h-12;
        @apply bg-white;
        @apply text-blue-300;
        @apply rounded-sm;
        @apply outline-3 outline-offset-2 outline-solid outline-blue-300;
        
    }


    :global(html, body) {
        @apply overflow-x-hidden;
        /* @apply overflow-y-scroll; */
        @apply h-full;
    }

    :global(body){
        @apply overflow-y-scroll;
        @apply bg-zinc-50;
        @apply m-0 flex flex-col min-h-screen;
    }

    :global(.header-flat) {
        @apply text-2xl text-slate-500 font-light inline-block border-b border-slate-400/25 pb-0.5 mb-1;
    }

    :global(.header-large) {
        @apply text-7xl text-neutral-700 font-normal;
    }

    :global(.header-large-flat) {
        @apply text-7xl text-neutral-700 font-normal;
        @apply inline-block border-b border-slate-400/50 pb-1.75 mb-1.75;
    }

    .header-sub {
        @apply text-lg italic text-slate-400 font-light;
    }

    :global(.button-flat) {
        @apply text-neutral-700;
        @apply flex flex-row gap-2 items-center justify-center;
        @apply hover:cursor-pointer;
    }

    :global(.button-flat-disabled) {
        @apply opacity-25;
        @apply pointer-events-none;
        @apply cursor-not-allowed;
        @apply select-none;
        @apply italic;
    }

    :global(.warning-text) {
        @apply text-red-800;
        @apply font-bold;
        @apply text-2xl;
        @apply italic;
    }

</style>