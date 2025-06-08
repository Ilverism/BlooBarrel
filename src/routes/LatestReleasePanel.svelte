<script lang="ts">
    import { onDestroy, onMount } from 'svelte';

    
    import PlatformButton from './PlatformButton.svelte';
    import type { Platform } from './releases/Platform';
    
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
    const SUBTITLE_MESSAGE_SUCCESS = "Click on a button below to download an asset.";
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
        assets: any[];
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
        //platformsOut.sort((a, b) => a.name.localeCompare(b.name));
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
            group.assets.sort((a, b) => a.extension.localeCompare(b.extension));
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
    <div class="flex flex-col mr-auto">

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
            <div class="text-3xl italic message-text font-light whitespace-pre">
                {subtitleMessage}
            </div>
        {:else}
            <div class="text-3xl italic message-text font-light whitespace-pre mt-4">
                {subtitleMessage}
            </div>
        {/if}
        
    </div>
    
    <!-- Got Assets, Show List -->
    {#if assetsByPlatform.length}

        <!-- <div class="relative mt-12 flex flex-row items-center justify-start gap-4 w-full h-full grow bg-blue-50"> -->
        <div class="relative mt-12 flex flex-row items-center justify-start gap-4 w-full h-full latest-release-panel-bg">

            <!-- Release Information Area -->
            <div class="absolute left-0 top-0 flex flex-row items-start justify-center ml-8 mt-4 gap-4 w-full">

                <!-- Key -->
                <div class="flex flex-col items-start justify-center w-fit gap-2 message-text">

                    <div class="header-flat w-full">
                        Key
                    </div>

                    <!-- Light Blue Circle -->
                    <div class="flex flex-row items-center gap-2 w-full">
                        <div class="w-2 h-2 aspect-square rounded-full downloadable-asset"></div>
                        <div class="text-sm">Downloadable Assets</div>
                    </div>

                    <!-- Dark Blue Circle -->
                    <div class="flex flex-row items-center gap-2">
                        <div class="w-2 h-2 aspect-square rounded-full recommended-asset"></div>
                        <div class="text-sm">Recommended Downloads</div>
                    </div>

                </div>

                <!-- Release Info -->
                <div class="flex flex-col items-start justify-center w-fit gap-2 message-text mr-auto">

                    <div class="header-flat flex! flex-row! items-center gap-4">
                        <div class="whitespace-nowrap">
                            Release Information
                        </div>
                    </div>

                    <!-- Name -->
                    <div class="flex flex-row items-center gap-2 w-full">
                        <i class="fa-fw fa-solid fa-pencil opacity-50"></i>
                        <div class="text-sm">{latestRelease.name ?? "Unknown Name"}</div>
                    </div>

                    <!-- Date -->
                    <div class="flex flex-row items-center gap-2 w-full">
                        <i class="fa-fw fa-solid fa-calendar opacity-50"></i>
                        <div class="text-sm">{releaseDateYMD}</div>
                    </div>

                </div>

                <!-- Toggle Sorting -->
                <div class="flex flex-col items-start justify-center w-fit gap-2 text-slate-500 ml-auto mr-16">

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

                <div class="recommended-asset-container max-w-[20%] min-w-[20%] max-h-[5%] aspect-square mt-16">

                    <div class="header-flat flex! flex-row! items-center gap-4 ml-12 h-full">
                        <i class="fa-solid fa-cloud-arrow-down opacity-50"></i>
                        <div class="font-bold whitespace-nowrap text-xl">
                            Top Recommended Download
                        </div>
                    </div>

                    <div class="w-96 min-h-64 mt-4 ml-4 self-center">
                        <PlatformButton asset={assetTopRecommended} isRecommended isTopRecommended/>
                    </div>
                </div>
                    
            {/if}

            <!-- Asset Grid/List -->
            <div class="grow flex flex-col items-center self-center pr-8 absolute top-1/2 right-0 -translate-x-1 -translate-y-1/2 w-full max-w-[60%] min-h-3/5 h-7/8 max-h-full"> 

                <div class="header-flat">
                    All Downloads
                </div>

                <!-- Platform Scroll Buttons -->
                {#if assetPlatforms.length > 1}
                    <div class="absolute flex flex-col gap-4 left-[0] -ml-12 top-1/2 -translate-y-1/2 w-fit h-fit">
                        
                        {#each assetPlatforms as platform}

                            {@const isCurrentPlatform = (platform.name.toLowerCase() === (assetPlatformCurrentNameTarget===null?assetPlatformCurrentName.toLowerCase():assetPlatformCurrentNameTarget.toLowerCase()))}

                            <button
                                class="button-flat group text-lg ml-16 flex flex-row items-center asset-platform-button {isCurrentPlatform?'asset-platform-button-current':''}"
                                aria-label="Scroll to {platform.name} assets"
                                onclick={() => scrollToPlatform(platform.name)}
                            >
                                <i class="group-hover:underline underline-offset-auto fa-fw {platform.icon}"></i>
                            </button>
                        {/each}

                    </div>
                {/if}

                <!-- Assets Per Platform List -->
                <div class="
                    w-full mt-4 overflow-y-scroll overflow-x-clip  pr-8 flex flex-col gap-4
                    assets-scrollbar
                    "
                    bind:this={listEl}
                >

                    {#each assetsPerPlatform as assetGroup}

                        {@const sortedAssetGroup = assetGroupSort(assetGroup)}
                        {@const isRecommendedGroup = sortedAssetGroup.isRecommended}

                        <div
                            class="header-flat text-lg ml-16 flex flex-row items-center"
                            data-platform={sortedAssetGroup.platform.name.toLowerCase()}
                        >
                            <i class="fa-fw {sortedAssetGroup.platform.icon}"></i>
                            {sortedAssetGroup.platform.name}
                        </div>

                        <div class="flex flex-col items-center justify-start gap-3 w-full mb-4 ml-8">

                            {#each sortedAssetGroup.assets as asset}

                                <div class="w-full h-fit ml-16 pr-16">
                                    <PlatformButton asset={asset} isRecommended={isRecommendedGroup} listMode/>
                                </div>

                            {/each}

                        </div>

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

    .recommended-asset-container {
        @apply flex flex-col;
        @apply items-center justify-center;
        @apply mx-24;
    }

    .recommended-asset-container {
        @apply flex flex-col items-center justify-center mx-24;
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