<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    
    import PlatformButton from './PlatformButton.svelte';
    import type { Platform } from './releases/Platform';

    import { type Asset } from './+page.svelte';
    
    let {
        latestRelease,
        performedFirstFetch,
        assetTopRecommended,
        assetsByPlatform,
        userPlatformFull,
        assetSortingMode,
    } = $props();

    console.log("Latest Release Panel: ", latestRelease);

    const releaseDateYMD = $derived.by(() => {

        if (!latestRelease || !latestRelease.published_at)
            return "Unknown Date";

        const date = new Date(latestRelease.published_at);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
    });

    const SUBTITLE_MESSAGE_NOSEARCH = "No search performed yet. Please wait for the latest release to be fetched.";
    const SUBTITLE_MESSAGE_FAILURE = "Failed to fetch any downloadable assets from the latest release.\nPlease try a different repository check your connection.";
    const SUBTITLE_MESSAGE_SUCCESS = `${''/*[Tap|Click]*/} on a button below to download an asset.`;
    let subtitleMessage = $derived.by(() => {

        //Haven't performed a search yet...
        if (!performedFirstFetch)
            return SUBTITLE_MESSAGE_NOSEARCH;

        //Failed to fetch any assets...
        if (!assetsByPlatform.length)
            return SUBTITLE_MESSAGE_FAILURE;

        //Successfully fetched assets...
        return SUBTITLE_MESSAGE_SUCCESS;

    });

    /*
        Assets Per Platform

        Break down the assets by platform.
    */

    type AssetGroup ={
        platform: Platform;
        assets: Asset[];
        isRecommended: boolean;
    }

    let listEl: HTMLDivElement | null = $state(null);

    function scrollToPlatform(fullName: string) {

        fullName=fullName.toLowerCase().trim();

        console.log("Attempting to scroll to platform section: ", fullName);

        //List element not set, can't scroll
        if (!listEl) {
            console.warn("List element not set, can't scroll to platform section.");
            return;
        }

        //Header tagged below
        const header = listEl.querySelector(
            `[data-platform="${fullName}"]`
        ) as HTMLElement | null;

        //Didn't find the header, can't scroll to it
        if (!header) {
            console.warn(`No header found for platform: ${fullName}`);
            console.warn("Available headers: ", Array.from(listEl.querySelectorAll('[data-platform]')));
            return;
        }

        //Scroll to the header
        const SCROLL_OFFSET_PX = 16;
        listEl.scrollTo({
            top: header.offsetTop - listEl.offsetTop - SCROLL_OFFSET_PX,
            behavior: 'smooth'
        });

        //Set the target platform name if it is different from the current one
        assetPlatformCurrentNameTarget = fullName;

    }

    function setMobilePlatformSelected(fullName: string|null) {

        /*
            Sets the selected platform for mobile view.
        */

        assetPlatformCurrentNameTarget = fullName?.toLowerCase() ?? null;
        assetPlatformCurrentName = fullName?.toLowerCase() ?? null;

        console.log("Mobile Platform Selected: ", fullName);

    }

    let assetPlatforms = $derived.by(() => {

        let platformsOut: Platform[] = [];

        for (const asset of assetsByPlatform) {

            //If the platform is already in the list, skip it
            if (platformsOut.some(p => p === asset.platform))
                continue;

            //Add the platform to the list
            platformsOut.push(asset.platform);

        }

        //Sort platforms by name
        return platformsOut;

    });

    let assetPlatformCurrentNameTarget = $state<string|null>(null);
    let assetPlatformCurrentName = $derived.by(() => {

        //If no assets, return null
        if (!assetsByPlatform.length)
            return null

        //Return the first asset's platform
        console.log("Current Asset Platform Name: ", assetsByPlatform[0].platform.name);
        return assetsByPlatform[0].platform.name;

    });


    let observer: IntersectionObserver;
    onMount(() => {

        if (!listEl)
            return;

        observer = new IntersectionObserver(
            entries => {
                
                //Pick the entry with the highest intersection ratio
                const best = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

                if (best) {
                    assetPlatformCurrentName = best.target.getAttribute('data-platform');
                    if (assetPlatformCurrentNameTarget===assetPlatformCurrentName)
                        assetPlatformCurrentNameTarget = null; //Reset target if it matches current
                }
            },
            {
                root: listEl,
                threshold: 0.5                // 50 % of header visible
            }
        );

        for (const h of Array.from(listEl.querySelectorAll('[data-platform]'))) {
            observer.observe(h);
        }

        onDestroy(() => observer.disconnect());
    });


    let assetsPerPlatform = $derived.by(() => {

        let assetGroupsOut: AssetGroup[] = [];
        let assetPlatforms = new Set();

        for (const asset of assetsByPlatform) {

            const assetPlatform = asset.platform;

            //New platform, create a new group
            if (!assetPlatforms.has(assetPlatform)) {

                assetPlatforms.add(assetPlatform);

                const groupIsRecommended = (userPlatformFull && userPlatformFull.name === assetPlatform.name);
                console.log("Name: ", assetPlatform.name, " is recommended: ", groupIsRecommended);
                assetGroupsOut.push({
                    platform: assetPlatform,
                    assets: [asset],
                    isRecommended: groupIsRecommended,
                });

                continue;

            }

            //Add asset to existing group
            const existingGroup = assetGroupsOut.find(group => group.platform === assetPlatform);
            if (existingGroup) {
                existingGroup.assets.push(asset);
                // existingGroup.isRecommended ||= (userPlatformFull === assetPlatform) && asset.isRecommended;
            }

        }

        //In each group, sort assets by extension (alphabetical order)
        for (const group of assetGroupsOut) {

            group.assets.sort((a, b) => {
                const extA = a.fileType?.extension ?? '';
                const extB = b.fileType?.extension ?? '';
                return extA.localeCompare(extB);
            });
            
        }

        //Then, in each group, sort assets by size (descending order)
        for (const group of assetGroupsOut) {
            group.assets.sort((a, b) => b.size - a.size);
        }

        console.log("Assets Per Platform: ", assetGroupsOut);

        //Return the asset groups
        return assetGroupsOut;

    });



    let assetGroupSortType = $state(assetSortingMode.value);

    function cycleAssetGroupSortType() {

        /*
            Cycles the asset group sort type.
            Available types: alphabetical, size, downloads.
        */

        const sortTypes = ["alphabetical", "size", "downloads"];
        const currentIndex = sortTypes.indexOf(assetGroupSortType);
        const nextIndex = (currentIndex + 1) % sortTypes.length;
        assetGroupSortType = sortTypes[nextIndex];

        assetSortingMode.value = assetGroupSortType;

    }

    function assetGroupSortAlphabetically(assetGroup:AssetGroup) {

        /*
            Returns a sorted copy of the target asset group.

            Sort alphabetically by platform name.
            Maintain the case of the platform name.
        */

        return {
            ...assetGroup,
            assets: [...assetGroup.assets].sort((a, b) => {
                return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
            })
        };

    }

    function assetGroupSortBySize(assetGroup:AssetGroup) {

        /*
            Returns a sorted copy of the target asset group.

            Sort by size (descending order).
        */

        return {
            ...assetGroup,
            assets: [...assetGroup.assets].sort((a, b) => {
                return b.size - a.size;
            })
        };

    }

    function assetGroupSortByDownloads(assetGroup:AssetGroup) {

        /*
            Returns a sorted copy of the target asset group.

            Sort by number of downloads (descending order).
        */

        return {
            ...assetGroup,
            assets: [...assetGroup.assets].sort((a, b) => {
                return b.download_count - a.download_count;
            })
        };

    }


    function assetGroupSort(assetGroup:AssetGroup) {

        /*
            Returns a sorted copy of the target asset group.

            Calls the other sorting functions.
        */

        const sortFunctionMap:any = {
            alphabetical: assetGroupSortAlphabetically,
            size: assetGroupSortBySize,
            downloads: assetGroupSortByDownloads,
        };

        const sortFunction = sortFunctionMap[assetGroupSortType];
        if (sortFunction)
            return sortFunction(assetGroup);


        //By default, return the asset group as is
        return assetGroup;

    }

</script>

<!-- Latest Release Area -->
<div class="flex flex-col flex-1 items-center justify-center w-full min-h-0 h-full">

    <!-- Latest Release Header -->
    <div class="
        px-4
        md:px-0
        flex flex-col mr-auto
    ">

        <div class="w-full">
            <div class="header-large-flat">
                Latest Release
            </div>
        </div>

        {#if subtitleMessage===SUBTITLE_MESSAGE_FAILURE}
            <div class="warning-text mt-4 mb-1 flex flex-row items-center gap-2">
                <i class="fa-solid fa-triangle-exclamation"></i>
                Warning
            </div>
            <div class="
                md:whitespace-pre
                text-3xl italic message-text font-light
            ">
                {subtitleMessage}
            </div>
        {:else if subtitleMessage===SUBTITLE_MESSAGE_SUCCESS}
            <div class="
                before:content-['Tap']
                md:before:content-['Click']
                text-2xl mt-2 whitespace-normal break-words
                md:text-3xl md:mt-4 md:whitespace-pre
                italic message-text font-light
            ">
                {subtitleMessage}
            </div>
        {:else}
            <div class="
                text-2xl mt-2 whitespace-normal break-words
                md:text-3xl md:mt-4 md:whitespace-pre
                italic message-text font-light
            ">
                {subtitleMessage}
            </div>
        {/if}
        
    </div>
    
    <!-- Got Assets, Show List -->
    {#if assetsByPlatform.length}

        <!-- <div class="relative mt-12 flex flex-row items-center justify-start gap-4 w-full h-full grow bg-blue-50"> -->
        <div class="
            flex-col
            md:flex-row
            relative mt-12 flex items-center justify-start gap-4 w-full h-full latest-release-panel-bg
        ">

            <!-- Release Information Area -->
            <div class="
                mt-4
                md:absolute md:ml-8
                left-0 top-0 flex flex-row items-start justify-center gap-4 w-full
            ">

                <!-- Key -->
                <div class="
                    flex-col mx-4
                    md:flex-row md:mx-0
                    flex justify-start gap-8 w-full
                ">


                    <!-- Key Area -->
                    <div class="
                        w-full
                        md:w-fit
                        flex flex-col items-start justify-center gap-2 message-text
                    ">

                        <div class="header-flat w-full">
                            Key
                        </div>
                       
                        <div class="
                            flex-row text-xs
                            md:flex-col md:text-sm
                            flex gap-2 w-full
                        ">
                            <!-- Light Blue Circle -->
                            <div class="flex flex-row items-center gap-2 w-full">
                                <div class="w-2 h-2 aspect-square rounded-full downloadable-asset"></div>
                                <div class="whitespace-nowrap w-full text-nowrap">Downloadable Assets</div>
                            </div>

                            <!-- Dark Blue Circle -->
                            <div class="flex flex-row items-center gap-2">
                                <div class="w-2 h-2 aspect-square rounded-full recommended-asset"></div>
                                <div class="whitespace-nowrap w-full text-nowrap">Recommended Downloads</div>
                            </div>
                        </div>

                    </div>

                    <!-- Release Info -->
                    <div class="
                        w-full
                        md:w-fit
                        flex flex-col items-start justify-center gap-2 message-text mr-auto
                    ">

                        <div class="
                            w-full
                            header-flat flex! flex-row! items-center gap-4
                        ">
                            <div class="whitespace-nowrap">
                                Release Information
                            </div>
                        </div>

                        <div class="
                            flex-row text-xs
                            md:flex-col md:text-sm
                            flex gap-2 w-full
                        ">

                            <!-- Name -->
                            <div class="flex flex-row items-center gap-2 w-full">
                                <i class="fa-fw fa-solid fa-pencil opacity-50"></i>
                                <div class="whitespace-nowrap w-full text-nowrap">{latestRelease.name ?? "Unknown Name"}</div>
                            </div>

                            <!-- Date -->
                            <div class="flex flex-row items-center gap-2 w-full">
                                <i class="fa-fw fa-solid fa-calendar opacity-50"></i>
                                <div class="whitespace-nowrap w-full text-nowrap">{releaseDateYMD}</div>
                            </div>

                        </div>

                    </div>
                </div>

                <!-- Toggle Sorting (Desktop) -->
                <div class="
                    hidden!
                    md:flex!
                    flex-col items-start justify-center w-fit gap-2 text-slate-500 ml-auto mr-16 whitespace-nowrap
                ">

                    <div class="justify-self-end flex flex-col items-start justify-center gap-4 mx-auto scale-100">

                        <!-- Toggle Sort Mode -->
                        <button
                            class="button-flat group"
                            onclick={cycleAssetGroupSortType}
                            aria-label="Toggle View"
                        >
                            <i class="fa-fw fa-solid fa-sort"></i>
                            <div class="group-hover:underline">
                                Sort By: <b class="capitalize">{assetGroupSortType}</b>
                            </div>
                        </button>
                    </div>
                </div>

            </div>

            <!-- Recommended Asset -->
            {#if assetTopRecommended}

                <div class="
                    w-full
                    md:max-w-[20%] md:min-w-[20%] md:max-h-[5%] md:aspect-square
                    recommended-asset-container  my-20
                ">

                    <div class="
                        h-fit
                        md:ml-12 md:h-full
                        header-flat flex! flex-row! items-center gap-4
                    ">
                        <i class="fa-solid fa-cloud-arrow-down opacity-50"></i>
                        <div class="
                            text-base
                            md:text-xl
                            font-bold whitespace-nowrap
                        ">
                            Top Recommended Download
                        </div>
                    </div>

                    <div class="
                        w-full px-4 aspect-video
                        md:w-96 md:min-h-64 md:ml-4 md:px-0 md:aspect-auto
                        mt-4 self-center
                    ">
                        <PlatformButton asset={assetTopRecommended} isRecommended isTopRecommended/>
                    </div>
                </div>
                    
            {/if}

            <!-- Asset List -->
            <div class="
                w-full
                md:absolute md:max-w-[60%] md:min-h-3/5 md:pr-8 md:-translate-x-1 md:-translate-y-1/2 md:h-7/8
                grow flex flex-col items-center self-center top-1/2 right-0 max-h-full
            "> 

                <div class="
                    before:content-['Platform']
                    md:before:content-['All_Downloads']
                    header-flat
                ">
                </div>

                <!-- Platform Scroll Buttons -->
                {#if assetPlatforms.length > 1}
                    <div class="
                        flex-row justify-between items-center my-4
                        md:absolute md:-translate-y-1/2 md:-ml-12 md:my-0 md:flex-col
                        flex gap-4 left-0 top-1/2  w-fit h-fit
                    ">
                        
                        {#each assetPlatforms as platform}

                            {@const isCurrentPlatform = (platform.name.toLowerCase() === (assetPlatformCurrentNameTarget===null?assetPlatformCurrentName.toLowerCase():assetPlatformCurrentNameTarget.toLowerCase()))}

                            <!-- Platform Scroll Button (Desktop) -->
                            <button
                                class="
                                    hidden!
                                    md:flex!
                                    md:ml-16
                                    button-flat group text-lg flex-row items-center asset-platform-button {isCurrentPlatform?'asset-platform-button-current':''}
                                "
                                aria-label="Scroll to {platform.name} assets"
                                onclick={() => scrollToPlatform(platform.name)}
                            >
                                <i class="group-hover:underline underline-offset-auto fa-fw {platform.icon}"></i>
                            </button>

                            <!-- Platform Select Button (Mobile) -->
                            <button
                                class="
                                    flex!
                                    md:hidden!
                                    md:ml-16
                                    button-flat group text-lg flex-row items-center asset-platform-button {isCurrentPlatform?'asset-platform-button-current':''}
                                "
                                aria-label="Select {platform.name} assets"
                                onclick={() => setMobilePlatformSelected(platform.name)}
                            >
                                <i class="group-hover:underline underline-offset-auto fa-fw {platform.icon}"></i>
                            </button>

                        {/each}

                    </div>
                {/if}

                <!-- Assets Per Platform List (Desktop) -->
                <div class="
                    hidden!
                    md:flex! md:pr-8
                    w-full mt-4 overflow-y-scroll overflow-x-clip flex-col gap-4
                    assets-scrollbar
                    "
                    bind:this={listEl}
                >

                    {#each assetsPerPlatform as assetGroup}

                        {@const sortedAssetGroup = assetGroupSort(assetGroup)}
                        {@const isRecommendedGroup = sortedAssetGroup.isRecommended}

                        <div
                            class="
                                ml-16
                                header-flat text-lg flex! flex-row! items-center justify-between
                            "
                            data-platform={sortedAssetGroup.platform.name.toLowerCase()}
                        >   

                            <!-- Platform Name & Icon -->
                            <div>
                                <i class="fa-fw {sortedAssetGroup.platform.icon}"></i>
                                {sortedAssetGroup.platform.name}
                            </div>

                        </div>

                        <div class="
                            ml-8
                            flex flex-col items-center justify-start gap-3 w-full mb-4
                        ">

                            {#each sortedAssetGroup.assets as asset}

                                <div class="ml-16 pr-16 w-full h-fit">
                                    <PlatformButton asset={asset} isRecommended={isRecommendedGroup} listMode/>
                                </div>

                            {/each}

                        </div>

                    {/each}

                </div>

                <!-- Assets Per Platform List (Mobile) -- Only display the current platform. No 'listEl' binding needed either.  -->
                <div class="
                    md:hidden!
                    w-full mt-4 overflow-y-scroll overflow-x-clip flex-col gap-4
                    "
                >
                    {#each assetsPerPlatform as assetGroup}

                        {@const sortedAssetGroup = assetGroupSort(assetGroup)}
                        {@const isRecommendedGroup = sortedAssetGroup.isRecommended}

                        {#if sortedAssetGroup.platform.name.toLowerCase() === (assetPlatformCurrentNameTarget===null?assetPlatformCurrentName.toLowerCase():assetPlatformCurrentNameTarget.toLowerCase())}

                            <div
                                class="
                                    mx-4 max-w-[90%]
                                    header-flat text-lg flex! flex-row! items-center justify-between
                                    mb-4!
                                "
                                data-platform={sortedAssetGroup.platform.name.toLowerCase()}
                            >   

                                <!-- Platform Name & Icon -->
                                <div>
                                    <i class="fa-fw {sortedAssetGroup.platform.icon}"></i>
                                    {sortedAssetGroup.platform.name}
                                </div>

                                <!-- Toggle Sorting (Phone) -->
                                <div class="
                                    mt-auto
                                    flex
                                    md:hidden!
                                    flex-col items-start justify-center w-fit gap-2 text-slate-500 text-xs
                                ">

                                    <div class="justify-self-end flex flex-col items-start justify-center gap-4 mx-auto scale-100">

                                        <!-- Toggle Sort Mode -->
                                        <button
                                            class="button-flat group"
                                            onclick={cycleAssetGroupSortType}
                                            aria-label="Toggle View"
                                        >
                                            <i class="fa-fw fa-solid fa-sort"></i>
                                            <div class="group-hover:underline">
                                                <b class="capitalize">{assetGroupSortType}</b>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                            </div>

                            <div class="
                                px-4
                                flex flex-col items-center justify-start gap-3 w-full mb-4
                            ">

                                {#each sortedAssetGroup.assets as asset}

                                    <div class="w-full h-fit">
                                        <PlatformButton asset={asset} isRecommended={isRecommendedGroup} listMode/>
                                    </div>

                                {/each}

                            </div>

                        {/if}

                    {/each}
                </div>

            </div>

        </div>

    {/if}

</div>





<style lang="postcss">

    @reference "tailwindcss";
    @custom-variant dark (&:where(.dark, .dark *));
    @plugin 'tailwind-scrollbar';

    
    .downloadable-asset {
        @apply bg-blue-300;
        @apply dark:bg-blue-500;
    }
    .recommended-asset {
        @apply bg-blue-600;
        @apply dark:bg-blue-300;
    }

    /* .recommended-asset-container {
        @apply flex flex-col;
        @apply justify-start;
        @apply items-center md:justify-center;
        @apply md:mx-24;
    } */

    .recommended-asset-container {
        @apply justify-start;
        @apply flex flex-col items-center md:justify-center;
        @apply md:mx-24;
    }

    .latest-release-panel-bg {
        @apply bg-blue-50;
        @apply dark:bg-slate-700;
    }
    
    :global(.assets-scrollbar) {
        @apply scrollbar-thin;
        @apply scrollbar-thumb-blue-300 scrollbar-track-blue-100;
        @apply dark:scrollbar-thumb-blue-500 dark:scrollbar-track-slate-900;
    }

    .asset-platform-button {
        @apply text-neutral-700;
        @apply dark:text-neutral-100;
        @apply flex flex-row gap-2 items-center justify-center;
        @apply hover:cursor-pointer;
        @apply hover:scale-105 scale-100 transition-all duration-100 ease-out;
    }

    .asset-platform-button-current {
        @apply text-black;
        @apply dark:text-white;
        @apply scale-140;
        @apply hover:scale-150;
        /* @apply text-shadow-lg; */
        /* @apply text-shadow-blue-400; */
        @apply text-shadow-[0_0_12px_var(--color-blue-400)];
    }

</style>