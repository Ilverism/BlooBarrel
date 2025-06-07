<script>

    import { formatLowPrec } from "$lib/format";

    let {
        asset,
        isRecommended=false,
        isTopRecommended=false,
        listMode=false,
    } = $props();

    let isEmptyAsset = $derived.by(() => {
        return !asset || !asset.browser_download_url || !asset.platform// || !asset.extension;
    });

    $effect(() => {
        console.log("Platform Button: ", asset, isRecommended, isEmptyAsset);
    });


    const browserDownloadURL = $derived.by(() => {
        return asset?.browser_download_url || '';
    });

    const assetSizeFormatted = $derived.by(() => {

        if (!asset || !asset.size)
            return '?? MB';

        //Format to B, KB, MB, GB
        const sizeInMB = asset.size / (1024 * 1024);

        if (sizeInMB < 1)
            return `${(asset.size / 1024).toFixed(2)} KB`;

        else if (sizeInMB < 1024)
            return `${sizeInMB.toFixed(2)} MB`;

        else
            return `${(sizeInMB / 1024).toFixed(2)} GB`;

    });

    const downloadCountFormatted = $derived.by(() => {
        return asset?.download_count ? formatLowPrec(asset.download_count) : '??';
    });

    const assetSizeClass = $derived.by(() => {

        //Larger size --> Greater font weight
        if (assetSizeFormatted.includes('GB'))
            return 'font-bold';

        if (assetSizeFormatted.includes('MB'))
            return 'font-semibold';

        return 'font-normal';

    });

    const assetNameFormatted = $derived.by(() => {

        let nameOut = asset?.name || 'Unknown Asset';

        //Remove the file extension
        if (nameOut.includes('.'))
            nameOut = nameOut.split('.').slice(0, -1).join('.');

        return nameOut;

    });


    const containerClass = $derived.by(() => {
        return isEmptyAsset ? 'platform-button-container-empty' : 'platform-button-container';
    });

    const buttonClass = $derived.by(() => {
        
        //Top Recommended
        if (isTopRecommended)
            return 'platform-button platform-button-top-recommended';

        //Recommended
        if (isRecommended)
            return 'platform-button platform-button-recommended';

        //Standard
            return 'platform-button';

    });

    // const iconClass = $derived.by(() => {

    //     if (isTopRecommended)
    //         return 'platform-icon platform-icon-top-recommended';

    //     if (isRecommended)
    //         return 'platform-icon platform-icon-recommended';

    //     return 'platform-icon';

    // });

    const nameClass = $derived.by(() => {

        if (isTopRecommended)
            return 'platform-name platform-name-top-recommended';

        if (isRecommended)
            return 'platform-name platform-name-recommended';

        return 'platform-name';

    });

    const extensionClass = $derived.by(() => {

        if (isTopRecommended)
            return 'platform-extension platform-extension-top-recommended';

        if (isRecommended)
            return 'platform-extension platform-extension-recommended';

        return 'platform-extension';

    });

</script>


{#if !listMode}
    <a
        href={browserDownloadURL}
        download
        target="_blank"
        rel="noopener"
        class="m-4 platform-button-container min-w-full min-h-full {containerClass}"
    >
        <button class="cursor-pointer relative {buttonClass}" aria-label="Download Release">
            
            <!-- Asset Name -->
            <div class="p-4">
                <div class="platform-asset-name">
                    {assetNameFormatted}
                </div>
            </div>

            <!-- Top Row -->
            <div class="flex flex-row items-center justify-between min-w-full absolute top-0 p-2 font-light {nameClass}">

                <!-- Platform -->
                <div class="flex flex-row items-center gap-2">
                    <i class="{asset?.platform.icon}"></i>
                    {asset?.platform.name}
                </div>

                <!-- Download Count -->
                <div class="flex flex-row items-center gap-2">
                    <div class="text-right
                        justify-self-end {assetSizeClass}">
                        {downloadCountFormatted}
                    </div>
                    <i class="fa-solid fa-fw fa-download text-blue-400"></i>
                </div>

            </div>

            <!-- Bottom Row -->
            <div class="flex flex-row items-center justify-between min-w-full absolute bottom-0 p-2 font-light {nameClass}">

                <!-- Download Size -->
                <div class="{assetSizeClass}">
                    {assetSizeFormatted}
                </div>

                <!-- File Extension -->
                <div class="{extensionClass}">
                    {asset?.extension}
                </div>

            </div>
        </button>
    </a>
{:else}
    <a
        href={browserDownloadURL}
        download
        target="_blank"
        rel="noopener"
        class="platform-button-container min-w-full min-h-full"
    >
        <button
            class="
                cursor-pointer relative flex flex-row bg-zinc-50 w-full rounded-lg items-center pr-4
                outline-2 outline-offset-2 outline-solid outline-blue-300
                platform-button
                "
            aria-label="Download Release"
        >
            
            <!-- Platform Icon -->
            <!-- <i class="pl-6 {asset?.platform.icon}"></i> -->

            <!-- Asset Name -->
            <div class="p-1 flex shrink-[9999] pr-8">
                <div class="platform-asset-name line-clamp-1! text-sm!">
                    {assetNameFormatted}
                </div>
            </div>

            <!-- Download Size -->
            <div class="flex flex-row items-center gap-2 justify-end grow-[9999]">

                <div class="min-w-fit text-right justify-self-end {assetSizeClass}">
                    {assetSizeFormatted}
                </div>

                <!-- Download Count -->
                <div class="w-16 ml-2 text-right justify-self-end flex flex-row gap-1 justify-end items-center text-sm">
                    <div class="ml-auto">
                        {downloadCountFormatted}
                    </div>
                    <i class="fa-solid fa-fw fa-download text-blue-400 text-md"></i>
                </div>

                <!-- File Extension -->
                <div class="ml-2 w-8 justify-self-end text-right {extensionClass} text-sm!">
                    {asset?.extension}
                </div>

            </div>

        </button>
    </a>
{/if}



<style lang="postcss">

    @reference "tailwindcss";
    @custom-variant dark (&:where(.dark, .dark *));


    /* Platform Button -- Empty */
    .platform-button-container-empty {
        @apply opacity-0;
        @apply pointer-events-none;
    }

    /* Platform Button -- Container */
    .platform-button-container {
        @apply w-full h-full;
        @apply min-w-full;
    }


    /* Platform Button -- Standard */
    .platform-button {
        @apply w-full;
        @apply h-full;
        @apply bg-white;
        @apply dark:bg-slate-900;
        @apply rounded-sm;
        @apply scale-100 hover:scale-103;
        @apply outline-2 outline-offset-2 outline-solid outline-blue-300;
        @apply dark:outline-blue-500;

        @apply transition-all duration-100 ease-out;
    }

    .platform-name {
        @apply text-lg;
        @apply text-blue-400;
        @apply dark:text-blue-200;
    }

    .platform-icon {
        @apply text-4xl;
        @apply text-blue-300;   /* <-- Lighter than the button */
    }

    .platform-extension {
        @apply text-base;
        @apply font-bold;
        @apply text-blue-300;
    }

    .platform-asset-name {
        @apply break-all text-left align-text-top text-xl line-clamp-3;
        /* @apply text-shadow-2xs; */
        /* @apply text-shadow-blue-300; */
    }

    /* Platform Button -- Top Recommended */
    .platform-button-top-recommended {
        @apply bg-white;
        @apply dark:bg-slate-900;
        @apply outline-blue-600;
        @apply dark:outline-blue-200;
        @apply rounded-xl;
        @apply shadow-lg;
        @apply shadow-black/50;
        @apply dark:shadow-zinc-50/33;
    }

    .platform-name-top-recommended {
        @apply text-xl;
        @apply text-blue-600;
        @apply dark:text-blue-400;
    }

    .platform-icon-top-recommended {
        @apply text-8xl;
        @apply text-blue-700;    /* <-- Darker than the button (should be the first thing anyone sees) */
        @apply dark:text-blue-500;
    }

    .platform-extension-top-recommended {
        @apply text-2xl;
        @apply text-blue-600;
        @apply dark:text-blue-400;
    }

    /* Platform Button -- Recommended */
    .platform-button-recommended { 
        @apply outline-blue-600;
        @apply text-blue-700;

        @apply dark:text-blue-400;
        @apply dark:outline-blue-500;
    }

    .platform-name-recommended {
        @apply text-blue-600;
        @apply dark:text-blue-400;
    }

    .platform-icon-recommended {
        @apply text-blue-700;
    }

    .platform-extension-recommended {
        @apply text-blue-600;
    }


</style>