<script lang="ts">
    import '../app.css';
    import Navbar from '../components/navbar.svelte';
    let { children } = $props();
</script>

<Navbar />

<main class="pt-16"> <!-- Add padding-top to account for fixed navbar -->
    {@render children()}
</main>

<style lang="postcss">
    :global(body) {
      @apply bg-brand-black;
    }
</style>
