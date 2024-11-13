<script>
    import { createEventDispatcher } from 'svelte';
    import { calculateRiskLevel, getRiskTooltip } from '../utils/calculations';
    
    export let timelineMonths;
    export let totalBudget;
    export let maxTimelineMonths;
    export let maxBudget;
    export let MIN_TIMELINE_WEEKS;
    export let MIN_BUDGET;
    export let recalculationLoading;
  
    const dispatch = createEventDispatcher();
  </script>
  
  <div class="bg-white p-6 rounded-lg shadow-sm">
    <h3 class="text-lg font-medium mb-6">Project Constraints</h3>
    
    <!-- Timeline Slider -->
    <div class="mb-8">
      <h4 class="text-sm font-medium text-gray-600 mb-2">Timeline Adjustment</h4>
      <div class="slider-container">
        <RiskIndicator 
          value={timelineMonths}
          maxValue={maxTimelineMonths}
          type="timeline"
        />
        <input
          type="range"
          bind:value={timelineMonths}
          min={weeksToMonths(MIN_TIMELINE_WEEKS)}
          max={maxTimelineMonths}
          step="0.1"
          class="custom-slider"
        />
      </div>
    </div>
    
    <!-- Budget Slider -->
    <div class="mb-8">
      <h4 class="text-sm font-medium text-gray-600 mb-2">Budget Adjustment</h4>
      <div class="slider-container">
        <RiskIndicator 
          value={totalBudget}
          maxValue={maxBudget}
          type="budget"
        />
        <input
          type="range"
          bind:value={totalBudget}
          min={MIN_BUDGET}
          max={maxBudget}
          step="1000"
          class="custom-slider"
        />
      </div>
    </div>
  
    <!-- Action Buttons -->
    <div class="flex justify-between items-center pt-4 border-t">
      <button
        on:click={() => dispatch('reset')}
        class="px-4 py-2 text-gray-600 hover:text-gray-800"
      >
        Reset to Optimal
      </button>
      
      <button
        on:click={() => dispatch('recalculate')}
        disabled={recalculationLoading}
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {#if recalculationLoading}
          <span class="flex items-center gap-2">
            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24"><!-- ... --></svg>
            Recalculating...
          </span>
        {:else}
          Update Project Plan
        {/if}
      </button>
    </div>
  </div>
  