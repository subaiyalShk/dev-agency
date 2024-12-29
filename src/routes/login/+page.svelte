<script lang="ts">
    import { goto } from '$app/navigation';
    import { invalidate } from '$app/navigation';
    import { AlertCircle } from 'lucide-svelte';

    let { data } = $props();
    let { supabase, session } = data;
    
    if (session) {
        goto('/');
    }

    let email = '';
    let password = '';
    let loading = $state(false);
    let error = $state('');

    async function handleLogin() {
        if (!email || !password) {
            error = 'Please fill in all fields';
            return;
        }

        // Only allow superuser email
        if (email !== 'subaiyalshk@tracerlabs.io') {
            error = 'Access denied';
            return;
        }

        loading = true;
        error = '';

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) throw authError;

            await invalidate('supabase:auth'); // Invalidate the auth session
            await goto('/', { replaceState: true }); // Navigate to root

        } catch (e) {
            error = 'Invalid credentials';
        } finally {
            loading = false;
        }
    }
</script>

<div class="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
    <!-- Background gradient effects -->
    <div class="absolute inset-0">
        <div class="absolute bottom-0 left-0 right-0 h-[6px] translate-y-full bg-gradient-to-r from-[#E7028D] via-transparent to-[#056AFC] opacity-50 blur-sm"></div>
    </div>

    <!-- Login card -->
    <div class="w-full max-w-md px-8 py-10 relative">
        <!-- Neon card effect -->
        <div class="absolute inset-0 bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(233,0,141,0.2),0_0_30px_rgba(233,0,141,0.15),0_0_60px_rgba(233,0,141,0.1)]"></div>

        <div class="relative z-10">
            <div class="mb-8 text-center">
                <h1 class="font-['Duborics'] text-4xl font-normal mb-2 bg-gradient-to-r from-[#E7028D] to-[#056AFC] bg-clip-text text-transparent">Welcome Back</h1>
                <p class="text-gray-400 font-['Plus_Jakarta_Sans']">Sign in to access Project Flow</p>
            </div>

            <form on:submit|preventDefault={handleLogin} class="space-y-6">
                {#if error}
                    <div class="flex items-center gap-2 p-3 bg-[#E7028D]/10 rounded-lg border border-[#E7028D]/20">
                        <AlertCircle class="w-5 h-5 text-[#E7028D]" />
                        <p class="text-sm text-[#E7028D] font-['Plus_Jakarta_Sans']">{error}</p>
                    </div>
                {/if}

                <div>
                    <label for="email" class="block text-sm font-medium text-gray-300 mb-2 font-['Plus_Jakarta_Sans']">Email</label>
                    <input
                        type="email"
                        id="email"
                        bind:value={email}
                        class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#056AFC] focus:border-transparent transition backdrop-blur-sm font-['Plus_Jakarta_Sans']"
                        placeholder="Enter your email"
                        autocomplete="email"
                    />
                </div>

                <div>
                    <label for="password" class="block text-sm font-medium text-gray-300 mb-2 font-['Plus_Jakarta_Sans']">Password</label>
                    <input
                        type="password"
                        id="password"
                        bind:value={password}
                        class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#056AFC] focus:border-transparent transition backdrop-blur-sm font-['Plus_Jakarta_Sans']"
                        placeholder="••••••••"
                        autocomplete="current-password"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    class="w-full py-3 px-4 bg-brand-red hover:bg-brand-red/90 text-white font-['Plus_Jakarta_Sans'] font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>
        </div>
    </div>
</div>