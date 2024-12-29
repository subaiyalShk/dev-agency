<script lang="ts">
    import '../app.css';
    import Navbar from '../components/navbar.svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { invalidate } from '$app/navigation';
    import { onMount } from 'svelte';
    
    let { children, data } = $props();
    let { supabase, session } = data;

    // Change $: to $derived for runes compatibility
    const showNavbar = $derived(
        !$page.url.pathname.includes('lead-capture') && 
        !$page.url.pathname.includes('login')
    );

    onMount(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, _session) => {
                if (_session?.expires_at !== session?.expires_at) {
                    await invalidate('supabase:auth');
                }

                // Handle sign out
                if (event === 'SIGNED_OUT') {
                    // First invalidate the auth state
                    await invalidate('supabase:auth');
                    // Then redirect to login
                    window.location.href = '/login';
                }
            }
        );

        return () => subscription.unsubscribe();
    });
</script>

{#if showNavbar}
    <Navbar {session} {supabase} />
{/if}

<main class:pt-16={showNavbar}> <!-- Only add padding when navbar is shown -->
    {@render children()}
</main>

<style lang="postcss">
    :global(body) {
      @apply bg-brand-black;
    }
</style>