<script lang="ts">
    import '../app.css';
    import Navbar from '../components/navbar.svelte';
    import { page } from '$app/stores';
    let { children } = $props();

    // Change $: to $derived for runes compatibility
    const showNavbar = $derived(!$page.url.pathname.includes('lead-capture'));
</script>

{#if showNavbar}
    <Navbar />
{/if}

<main class:pt-16={showNavbar}> <!-- Only add padding when navbar is shown -->
    {@render children()}
</main>

<style lang="postcss">
    :global(body) {
      @apply bg-brand-black;
    }
</style>
