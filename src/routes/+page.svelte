<script lang="ts">

    //Automatically redirecto to the /releases page
    import { onMount } from 'svelte';
    import { base } from '$app/paths';

    const redirectURL = `${base}/releases`;

    onMount(() => {

        //Wait for 10 seconds before redirecting
        setTimeout(() => {
            window.location.href = redirectURL;
        }, 10_000);

    });

</script>

<h4>Welcome to BlooBarrel</h4>
<h1>Moving to releases page momentarily... (Redirecting to <a href={redirectURL}>'{redirectURL}'</a>)</h1>