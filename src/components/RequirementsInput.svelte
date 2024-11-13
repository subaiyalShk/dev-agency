<script>
    export let requirementsText = '';
    export let loading = false;
  </script>
  
  <div class="mb-8">
    <h2 class="text-xl font-semibold mb-4">Phase 1: Requirements Documentation</h2>
    <textarea
      bind:value={requirementsText}
      class="w-full h-64 p-4 border rounded-lg"
      placeholder="Paste your requirements documentation here..."
    ></textarea>
    <button
      on:click={() => dispatch('analyze')}
      class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      disabled={loading}
    >
      {loading ? 'Analyzing...' : 'Analyze Requirements'}
    </button>
  </div>