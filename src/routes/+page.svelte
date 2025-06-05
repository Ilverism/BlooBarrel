<script lang="ts">

    //Automatically redirecto to the /releases page
    import { onMount } from 'svelte';

    onMount(() => {
        window.location.href = '/releases';
    });

</script>

<h4>Welcome to BlooBarrel</h4>
<h1>Moving to releases page...</h1>

