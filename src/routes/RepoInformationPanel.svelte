<script lang="ts">

    import { formatLowPrec } from '$lib/format';

    import showdown from 'showdown';
    const markdownConverter = new showdown.Converter({
        tables: true,
        tasklists: true,
        strikethrough: true,
        ghCompatibleHeaderId: true,
        simplifiedAutoLink: true,
        openLinksInNewWindow: true,
    });

    let {
        repo={
            name: '',
            description: '',
            stars: 0,
        },
        readme,
        topics,
        open=false,
        fetchedURL,
    } = $props();

    let topicsPacked = $derived.by(() => {

        const topicsCopy = [...(topics || [])];

        //Sort topics by length, then by alphabetical order
        topicsCopy.sort((a: string, b: string) => a.length - b.length || a.localeCompare(b))

        return topicsCopy;

        
    });

    console.log("Repo Information Panel: ", repo);


    const repoDescriptionAltered = $derived.by(() => {

        const REPO_DESCRIPTION_DEFAULT = "(Repo description unavailable!)";
        
        let repoDescriptionOut = (repo.description || REPO_DESCRIPTION_DEFAULT);

        //Remove any colon-enclosed text (used to indicate an icon)
        repoDescriptionOut = repoDescriptionOut.replace(/:\w+:/g, "");

        return repoDescriptionOut;

    });

    let readmeExpanded = $state(false);
    let openReadme = function() {
        readmeExpanded = true;
    }
    let closeReadme = function() {
        readmeExpanded = false;
    }


    let ownerURL = $derived.by(() => {

        //No fetched URL available, return empty string
        if (!fetchedURL)
            return '';

        /*
            Extract the owner URL from the fetched URL
            
            e.g. 'https://github.com/electron/electron/'
            just becomes 'https://github.com/electron/'
        */
        const url = new URL(fetchedURL);
        const pathParts = url.pathname.split('/');
        if (pathParts.length < 3)
            return '';

        return `${url.origin}/${pathParts[1]}/`;

    });

</script>



<div class="information-panel w-full flex-1 min-h-0 pt-4 {open ? 'panel-closed' : 'panel-closed'}" id="repo-information-panel">
    
    <!-- Panel Header -->
    <div class="header-flat self-center">
        Repository Information
    </div>

    <!-- Buttons -->
    <div class="info-panel-button-row">

        {#if !readmeExpanded}

            <!-- Open Repo -->
            <a
                href={fetchedURL}
                class="button-flat group {fetchedURL?'':'button-flat-disabled'}"
                target="_blank"
                rel="noopener"
                aria-label="Open Repo"
            >
                <i class="fa-fw fa-brands fa-github"></i>
                <div class="group-hover:underline">
                    Open Repo
                </div>
            </a>

            <!-- Copy Repo URL -->
            <button
                class="button-flat group {fetchedURL?'':'button-flat-disabled'}"
                onclick={() => {

                    if (!fetchedURL)
                        return;

                    navigator.clipboard.writeText(fetchedURL)
                        .then(() => {
                            console.log("Fetched URL copied to clipboard!");
                        })
                        .catch((err) => {
                            console.error("Failed to copy fetched URL to clipboard:", err);
                        });


                }}
                aria-label="Copy URL"
            >
                <i class="fa-fw fa-solid fa-copy"></i>
                <div class="group-hover:underline">
                    Copy Repo URL
                </div>
            </button>

            <!-- Open Owner Profile -->
            <a
                href={ownerURL}
                class="button-flat group {fetchedURL?'':'button-flat-disabled'}"
                target="_blank"
                rel="noopener"
                aria-label="Open Owner Profile"
            >
                <i class="fa fa-user"></i>
                <div class="group-hover:underline">
                    Open Owner Profile
                </div>
            </a>

        {:else}

            <!-- Close Panel -->
            <button
                class="button-flat group mx-auto"
                onclick={closeReadme}
                aria-label="Close Panel"
            >
                <i class="fa fa-times"></i>
                <div class="group-hover:underline">
                    Close README
                </div>
            </button>

        {/if}

    </div>


    <!-- Readme Open View -->
    {#if readmeExpanded}

        {@const readmeHTML = markdownConverter.makeHtml(readme)}

        <div class="
            p-4 w-full h-full top-0 left-0 overflow-y-scroll overflow-x-clip rounded-lg text-slate-700
            assets-scrollbar
            markdown-body
        ">
            {@html readmeHTML}
        </div>

    {:else}

        <!-- Basic Info -->
        <div class="flex flex-col grow">
            <div class="w-fit">
                <div class="repo-name">
                    {repo.name}
                </div>
            </div>
            <i class="info-panel-description">{repoDescriptionAltered}</i>
        </div>
        <hr class="panel-separator"/>


        <!-- Grid of topics badges -->
        <div class="flex flex-wrap gap-2 w-full grow">

            <!-- No Topics -->
            {#if topicsPacked.length === 0}
                <span class="text-slate-400 italic">No topics available...</span>
            {/if}

            <!-- Topics Badges -->
            {#each topicsPacked as topic}
                <span class="topic-badge">
                    {topic}
                </span>
            {/each}

        </div>
        <hr class="panel-separator"/>

        <!-- Readme -->
        {#if readme}

            {@const readmeHTML = markdownConverter.makeHtml(readme)}


            <button
                class="
                    max-h-96
                    md:max-h-fit
                    group relative text-left readme-button flex shrink min-h-0 w-full overflow-y-clip bg-transparent opacity-50 hover:opacity-75 hover:cursor-pointer rounded-lg
                "
                onclick={openReadme}
            >
                <div class="pointer-events-none mask-b-from-20% markdown-body p-4 w-full h-full top-0 left-0 text-slate-700 rounded-lg">
                    {@html readmeHTML}
                </div>
                <!-- <div class="w-full h-full from-white/0   absolute left-0 top-0"></div> -->
                <div class="absolute scale-200 bottom-4 right-4 expand-icon bg-transparent opacity-0 group-hover:opacity-100 group-hover:scale-225 z-10 transition-all duration-200 ease-out">
                    <i class="fa fa-expand fa-fw"></i>
                </div>
            </button>
            
        {:else}
            <span class="text-slate-400 italic">No README available...</span>
        {/if}
        <hr class="panel-separator"/>


        <!-- Data Points -->
        <div class="flex flex-row items-center justify-between min-w-full h-fit message-text">

            <div class="flex flex-row items-center justify-end gap-2">
                <i class="fa fa-code-fork"></i>
                <div>
                    <b>{formatLowPrec(repo.forks_count) ?? "( ? )"}</b> Forks
                </div>
            </div>

            <div class="flex flex-row items-center justify-end gap-2">
                <i class="fa fa-eye"></i>
                <div>
                    <b>{formatLowPrec(repo.watchers_count) ?? "( ? )"}</b> Watchers
                </div>
            </div>

            <div class="flex flex-row items-center justify-end gap-2">
                <i class="fa fa-star"></i>
                <div>
                    <b>{formatLowPrec(repo.stargazers_count) ?? "( ? )"}</b> Stars
                </div>
            </div>

        </div>

    {/if}

</div>





<style lang="postcss">

    @reference "tailwindcss";
    @custom-variant dark (&:where(.dark, .dark *));
    @plugin 'tailwind-scrollbar';

    
    :global(.expand-icon) {
        @apply text-slate-700;
        @apply dark:text-slate-100;
    }

    :global(.information-panel) {
        /* @apply h-full min-h-0; */
        @apply min-h-0 h-full;
        @apply flex flex-col items-start;
        @apply py-2;
        @apply px-4;
        @apply bg-blue-50;
        @apply dark:bg-slate-700;
        @apply text-slate-500;
        @apply rounded-lg;
        @apply outline-3 outline-offset-4 outline-solid outline-blue-300;
    }

    :global(.panel-open) {
        @apply max-w-0!;
        @apply w-0!;
    }
    :global(.panel-closed) {
        @apply max-w-full;
    }

    /* .readme-button {
        @apply opacity-90;
        @apply hover:opacity-100;
        @apply hover:cursor-pointer;
    } */

    :global(.repo-name) {
        @apply text-2xl;
        @apply lg:text-xl;
        @apply font-bold;
        @apply border-b border-slate-400/10 mb-2;
        @apply text-slate-500;
        @apply dark:text-slate-200;
    } 

    :global(.topic-badge) {
        @apply bg-blue-100;
        @apply text-slate-700;
        @apply dark:bg-slate-600;
        @apply dark:text-slate-200;
        @apply px-2 py-1;
        @apply rounded-full;
        @apply text-sm;
        @apply w-fit h-fit;
    }

    :global(.panel-separator) {
        @apply text-slate-400/25 my-4 lg:my-2 w-full;
    }


    :global(.info-panel-button-row) {
        @apply flex flex-row items-center justify-between;
        @apply self-center;
        @apply w-full;
        @apply px-0;
        @apply md:px-4 my-4;
        @apply text-xs;
        @apply md:text-inherit;
        @apply lg:text-xs lg:my-2;
    }

    :global(.info-panel-description) {
        @apply lg:text-sm;
        @apply text-slate-500;
        @apply dark:text-slate-200;
    }


    /* MARKDOWN FORMATTING */
    :global(.markdown-body) {
        @apply bg-blue-200;
        /* @apply dark:bg-blue-200/80; */
        @apply dark:bg-slate-800;
        @apply dark:text-slate-200;
    }
    :global(a) {
        @apply text-blue-500;
        @apply hover:underline;
    }
    
    :global(pre) {
        @apply bg-blue-100;
        @apply dark:bg-slate-700;
        @apply p-2;
        @apply m-2;
        @apply break-all!;
        @apply whitespace-pre-wrap ;
    }

    :global(code) {
        @apply break-all!;
        @apply bg-blue-100;
        @apply dark:bg-slate-700;
        @apply rounded-sm;
        @apply px-1;
    }

    :global(li) {
        @apply list-disc;
        @apply ml-4;
    }

    :global(h1) {
        @apply text-2xl;
        @apply font-bold;
        @apply mt-4;
        @apply mb-2;
    }

    :global(h2) {
        @apply text-lg;
        @apply font-bold;
        @apply mt-4;
        @apply mb-2;
    }

    :global(table) {
        @apply w-full;
        @apply my-6;
        @apply px-4;
        @apply bg-blue-300;
        @apply dark:bg-slate-700;
        @apply rounded-lg;
        @apply overflow-hidden;
    }
    :global(th) {
        @apply underline;
        @apply px-4;
        @apply py-4;
    }
    :global(td) {
        @apply px-4;
        @apply py-2;
    }
    :global(thead) {
        @apply w-full;
    }
    :global(tr) {
        @apply pl-4;
        /* @apply even:bg-blue-300; */
        @apply even:bg-[color:color-mix(in_srgb,var(--color-blue-200)_50%,var(--color-blue-300)_50%)];
        @apply dark:even:bg-slate-600;
        /* @apply even:bg-[color:--bg-col-even]; */
    }

</style>