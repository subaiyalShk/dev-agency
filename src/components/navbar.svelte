<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import type { SupabaseClient, Session } from '@supabase/supabase-js';

    export let session: Session | null;
    export let supabase: SupabaseClient;
    
    let isMenuOpen = false;
    
    // Close menu when route changes
    $: if ($page.url.pathname) {
        isMenuOpen = false;
    }

    async function handleSignOut() {
        try {
            await supabase.auth.signOut();
            
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }
    
    const navItems = [
        { href: '/discovery', label: 'Discovery' },
        { href: '/planning-analysis', label: 'Planning & Analysis' },
        { href: '/proposal', label: 'Proposal' },
        { href: '/content-scoping', label: 'Content Scoping' }
    ];
</script>

<nav class="fixed top-0 left-0 right-0 bg-brand-black border-b border-brand-red/20 z-50">
    <div class="absolute bottom-0 left-0 right-0 h-[6px] translate-y-full bg-gradient-to-r from-brand-pink via-transparent to-brand-blue opacity-50 blur-sm"></div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
            <div class="flex items-center">
                <a href="/" class="text-2xl font-bold text-brand-white hover:text-brand-red transition-colors duration-200">
                    Project Flow
                </a>
            </div>

            <!-- Desktop menu -->
            <div class="hidden md:flex md:items-center md:space-x-8">
                {#each navItems as {href, label}}
                    <a 
                        {href}
                        class="relative text-brand-white/90 hover:text-brand-white px-4 py-2 text-sm font-medium transition-all duration-200 group"
                        class:text-brand-red={$page.url.pathname === href}
                    >
                        {label}
                        <span 
                            class="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-red transition-all duration-200 group-hover:w-full"
                            class:w-full={$page.url.pathname === href}
                        ></span>
                    </a>
                {/each}

                <!-- Sign out button -->
                <button 
                    on:click={handleSignOut}
                    class="relative text-brand-white/90 hover:text-brand-white px-4 py-2 text-sm font-medium transition-all duration-200 group"
                >
                    Sign Out
                    <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-red transition-all duration-200 group-hover:w-full"></span>
                </button>
            </div>

            <!-- Mobile menu button -->
            <div class="flex items-center md:hidden">
                <button
                    on:click={() => isMenuOpen = !isMenuOpen}
                    type="button"
                    class="inline-flex items-center justify-center p-2 rounded-md text-brand-white/80 hover:text-brand-red hover:bg-brand-white/5 focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 focus:ring-offset-brand-black transition-colors duration-200"
                    aria-controls="mobile-menu"
                    aria-expanded={isMenuOpen}
                >
                    <span class="sr-only">Open main menu</span>
                    <svg
                        class="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        {#if isMenuOpen}
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        {:else}
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        {/if}
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <!-- Mobile menu -->
    {#if isMenuOpen}
        <div class="md:hidden" id="mobile-menu">
            <div class="space-y-1 px-2 pb-3 pt-2 sm:px-3 bg-brand-black/95 border-t border-brand-red/10 backdrop-blur-sm">
                {#each navItems as {href, label}}
                    
                        {href}
                        class="block px-4 py-2 rounded-md text-base font-medium text-brand-white/90 hover:text-brand-white hover:bg-brand-white/5 transition-colors duration-200"
                        class:bg-brand-red-10={$page.url.pathname === href}
                        class:text-brand-red={$page.url.pathname === href}
                    
                        {label}
                    
                {/each}

                <!-- Mobile sign out button -->
                <button 
                    on:click={handleSignOut}
                    class="block w-full text-left px-4 py-2 rounded-md text-base font-medium text-brand-white/90 hover:text-brand-white hover:bg-brand-white/5 transition-colors duration-200"
                >
                    Sign Out
                </button>
            </div>
        </div>
    {/if}
</nav>