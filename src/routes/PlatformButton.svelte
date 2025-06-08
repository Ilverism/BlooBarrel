<script>

    import { formatLowPrec } from "$lib/format";

    let {
        asset,
        isRecommended=false,
        isTopRecommended=false,
        listMode=false,
    } = $props();
    

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

        let fontWeightClass = 'font-normal';

        //Larger size --> Greater font weight
        if (assetSizeFormatted.includes('GB'))
            fontWeightClass = 'font-bold';

        if (assetSizeFormatted.includes('MB'))
            fontWeightClass = 'font-semibold';

        let sizeClass = 'platform-download-size';
        if (isTopRecommended)
            sizeClass += ' platform-download-size-top-recommended';
        else if (isRecommended)
            sizeClass += ' platform-download-size-recommended';

        return `${sizeClass} ${fontWeightClass}`;

    });

    const assetNameFormatted = $derived.by(() => {

        let nameOut = asset?.name || 'Unknown Asset';

        //Remove the file extension
        if (nameOut.includes('.'))
            nameOut = nameOut.split('.').slice(0, -1).join('.');

        return nameOut;

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

    const downloadCountClass = $derived.by(() => {

        //Top Recommended
        if (isTopRecommended)
            return 'platform-download-count platform-download-count-top-recommended';

        //Recommended
        if (isRecommended)
            return 'platform-download-count platform-download-count-recommended';

        //Standard
        return 'platform-download-count';

    });

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
        class="m-4 platform-button-container min-w-full min-h-full"
    >
        <button class="cursor-pointer relative {buttonClass}" aria-label="Download Release">
            
            <!-- Asset Name -->
            <div class="px-6 py-8">
                <div class="platform-asset-name {nameClass} text-2xl! text-shadow-[0_0_8px_var(--color-blue-400)] px-2">
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
                <div class="flex flex-row items-center gap-2 {downloadCountClass}">
                    <div class="text-rightjustify-self-end">
                        {downloadCountFormatted}
                    </div>
                    <i class="fa-solid fa-fw fa-download"></i>
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
                cursor-pointer relative flex flex-row w-full rounded-lg items-center pr-4
                {buttonClass}
                group
                "
            aria-label="Download Release"
        >
            <!-- Asset Name -->
            <div class="p-1 flex shrink-[9999] pr-8">
                <div class="platform-asset-name {nameClass} line-clamp-1! text-sm!">
                    {assetNameFormatted}
                </div>
            </div>

            <!-- Download Size -->
            <div class="flex flex-row items-center gap-2 justify-end grow-[9999]">

                <div class="{assetSizeClass} min-w-fit text-right justify-self-end">
                    {assetSizeFormatted}
                </div>

                <!-- Download Count -->
                <div class="{downloadCountClass} w-16 ml-2 text-right justify-self-end flex flex-row gap-1 justify-end items-center text-sm">
                    <div class="ml-auto">
                        {downloadCountFormatted}
                    </div>
                    <i class="fa-solid fa-fw fa-download text-md"></i>
                </div>

                <!-- File Extension -->
                <div class="{extensionClass} ml-2 w-8 justify-self-end text-right text-sm! not-group-hover:truncate group-hover:min-w-fit group-hover:w-fit group-hover:max-w-fit">
                    {asset?.extension}
                </div>

            </div>

        </button>
    </a>
{/if}



<style lang="postcss">

    @reference "tailwindcss";
    @custom-variant dark (&:where(.dark, .dark *));



    /* Platform Button -- Standard */
    .platform-button {
        @apply w-full;
        @apply h-full;
        @apply overflow-clip;
        @apply rounded-sm;

        @apply scale-100 hover:scale-101;
        @apply transition-all duration-100 ease-out;

        @apply bg-white;
        @apply dark:bg-slate-900;

        @apply outline-2 outline-offset-2 outline-solid outline-blue-300;
        @apply dark:outline-blue-500;
    }

    .platform-name {
        @apply text-lg;

        @apply text-blue-500;
        @apply dark:text-blue-400;
    }
    
    .platform-download-size {
        @apply text-blue-500;
        @apply dark:text-blue-400;
    }

    .platform-download-count {
        @apply font-semibold;

        @apply text-blue-500;
        @apply dark:text-blue-400;
    }

    .platform-extension {
        @apply text-base;
        @apply font-bold;

        @apply text-blue-500;
        @apply dark:text-blue-400;
    }

    .platform-asset-name {
        @apply break-all text-left align-text-top text-xl line-clamp-3;

        @apply text-blue-500;
        @apply dark:text-blue-400;
    }

    /* Platform Button -- Top Recommended */
    .platform-button-top-recommended {
        @apply rounded-xl;

        @apply shadow-lg;

        @apply shadow-black/50;
        @apply dark:shadow-zinc-50/33;

        @apply bg-white;
        @apply dark:bg-slate-900;

        @apply outline-blue-600;
        @apply dark:outline-blue-300;
    }

    .platform-name-top-recommended {
        @apply text-xl;

        @apply text-blue-600;
        @apply dark:text-slate-200;
    }

    .platform-download-size-top-recommended {
        @apply text-xl;

        @apply text-blue-600;
        @apply dark:text-slate-200;
    }

    .platform-download-count-top-recommended {
        @apply font-semibold;

        @apply text-blue-600;
        @apply dark:text-slate-200;
    }

    .platform-extension-top-recommended {
        @apply text-2xl;

        @apply text-blue-600;
        @apply dark:text-slate-200;
    }

    /* Platform Button -- Recommended */
    .platform-button-recommended { 
        @apply outline-blue-600;
        @apply dark:outline-blue-300;
    }

    .platform-name-recommended {
        @apply text-blue-700;
        @apply dark:text-slate-200;
    }

    .platform-download-size-recommended {
        @apply text-blue-700;
        @apply dark:text-slate-200;
    }

    .platform-download-count-recommended {
        @apply font-semibold;
        
        @apply text-blue-700;
        @apply dark:text-slate-200;
    }

    .platform-extension-recommended {
        @apply text-blue-700;
        @apply dark:text-slate-200;
    }


</style>