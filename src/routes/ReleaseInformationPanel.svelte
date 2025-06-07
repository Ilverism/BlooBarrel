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
        moreStyling: true,
    });


    let {
        release,
    } = $props();

    console.log("ReleaseInformationPanel", release);

    $effect(() => {
        // This effect runs when the component is mounted
        console.log("ReleaseInformationPanel mounted with release:", release);
    }); 


    let htmlURL = release.html_url || '';
    let releaseName = release.name;
    let body = release.body || '';

    const assetCount = release.assets ? release.assets.length : 0;

    const createdAtYMD = new Date(release.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const publishedAtYMD = new Date(release.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });


    const isDraft = release.draft || false;
    const isPrerelease = release.prerelease || false;
    const tagName = release.tag_name || '';


    let releaseNotesExpanded = $state(false);
    let openNotes = function() {
        releaseNotesExpanded = true;
    }
    let closeNotes = function() {
        releaseNotesExpanded = false;
    }


    function copyReleaseURL() {

        //HTML URL exists, try to copy it to clipboard
        if (htmlURL) {

            navigator.clipboard.writeText(htmlURL)
                .then(() => {
                    console.log("Release URL copied to clipboard:", htmlURL);
                }).catch(err => {
                    console.error("Failed to copy release URL:", err);
                });

        //No HTML URL available, warn the user
        } else {
            console.warn("No HTML URL available to copy.");
        }

    }


</script>



<div class="information-panel w-full flex-1 min-h-0" id="release-information-panel">
    
    <!-- Panel Header -->
    <div class="header-flat self-center">
        Release Information
    </div>


    <!-- Buttons -->
    <div class="info-panel-button-row">

        {#if !releaseNotesExpanded}

            <!-- Open Release -->
            <a
                href={htmlURL}
                class="button-flat group {htmlURL?'':'button-flat-disabled'}"
                target="_blank"
                rel="noopener"
                aria-label="Open Repo"
            >
                <i class="fa-fw fa-brands fa-github"></i>
                <div class="group-hover:underline">
                    Open Release
                </div>
            </a>

            <!-- Copy Release URL -->
            <button
                class="button-flat group {htmlURL?'':'button-flat-disabled'}"
                onclick={copyReleaseURL}
                aria-label="Copy URL"
            >
                <i class="fa-fw fa-solid fa-copy"></i>
                <div class="group-hover:underline">
                    Copy Release URL
                </div>
            </button>

        {:else}

            <!-- Close Release Notes -->
            <button
                class="button-flat group mx-auto"
                onclick={closeNotes}
                aria-label="Close Release Notes"
            >
                <i class="fa-fw fa-solid fa-xmark"></i>
                <div class="group-hover:underline">
                    Close Release Notes
                </div>
            </button>
        
        {/if}

    </div>


    <!-- Release Notes Open View -->
    {#if releaseNotesExpanded}

        {@const readmeHTML = markdownConverter.makeHtml(body)}

        <div class="
            markdown-body p-4 w-full h-full top-0 left-0 overflow-y-scroll overflow-x-clip rounded-lg
        ">
            {@html readmeHTML}
        </div>


    {:else}

        <!-- Basic Info -->
        <div class="flex flex-col grow">

            <!-- Name -->
            <div class="w-fit">
                <div class="repo-name">
                    {releaseName}
                </div>
            </div>
        
            <!-- Dates -->
            <div class="flex flex-row items-center gap-2 w-full info-panel-description">
                <i class="fa-fw fa-solid fa-calendar opacity-50"></i>
                <div class="text-sm">Published: {createdAtYMD}</div>
                <i class="ml-8 fa-fw fa-solid fa-calendar opacity-50"></i>
                <div class="text-sm">Created: {createdAtYMD}</div>
            </div>
        </div>
        <hr class="panel-separator"/>

        <!-- Info Tags -->
        <div class="flex flex-wrap gap-2 w-full grow">

            <!-- Tag Name Bdage -->
            <span class="topic-badge">{tagName}</span>

            <!-- Draft Badge -->
            {#if isDraft}
                <span class="topic-badge">Draft</span>
            {/if}

            <!-- Prerelease Badge -->
            {#if isPrerelease}
                <span class="topic-badge">Pre-release</span>
            {/if}

        </div>
        <hr class="panel-separator"/>
        
        <!-- Release Notes -->
        {#if body}

            {@const readmeHTML = markdownConverter.makeHtml(body)}

            <button
                class="group relative text-left readme-button flex shrink min-h-0 w-full overflow-y-clip bg-transparent opacity-50 hover:opacity-75 hover:cursor-pointer rounded-lg"
                onclick={openNotes}
            >
                <div class="pointer-events-none mask-b-from-20% markdown-body p-4 w-full h-full top-0 left-0 rounded-lg">
                    {@html readmeHTML}
                </div>
                <!-- <div class="w-full h-full from-white/0   absolute left-0 top-0"></div> -->
                <div class="absolute scale-200 bottom-4 right-4 expand-icon bg-transparent opacity-0 group-hover:opacity-100 group-hover:scale-225 z-10 transition-all duration-200 ease-out">
                    <i class="fa fa-expand fa-fw"></i>
                </div>
            </button>

        {:else}
            <span class="text-slate-400 italic">No release description available...</span>
        {/if}
        <hr class="panel-separator"/>


        <!-- Data Points -->
        <div class="flex flex-row items-center justify-between min-w-full h-fit message-text">

            <!-- Asset Count -->
            <div class="flex flex-row items-center justify-end gap-2">
                <i class="fa fa-cubes"></i>
                <div>
                    <b>{formatLowPrec(assetCount) ?? "( ? )"}</b> Assets
                </div>
            </div>

        </div>

    {/if}

</div>





<style lang="postcss">

    @reference "tailwindcss";

</style>