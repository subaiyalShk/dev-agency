<script>
    import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
    import { onMount } from 'svelte';
    
    // State variables
    let requirementsText = '';
    let loading = false;
    let analysis = null;
    let savedContext = null;
    let recalculationLoading = false;
  
    // Constraint variables
    let timelineMonths = 0;
    let totalBudget = 0;
    let maxTimelineMonths = 0;
    let maxBudget = 0;
    
    // Constants
    const MIN_TIMELINE_WEEKS = 2;
    const MIN_BUDGET = 0;
  
    // Schema definition
    const analysisSchema = {
      type: SchemaType.OBJECT,
      properties: {
        phases: {
          type: SchemaType.ARRAY,
          description: "Detailed project phases",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: {
                type: SchemaType.STRING,
                description: "Phase name"
              },
              duration: {
                type: SchemaType.NUMBER,
                description: "Duration in weeks"
              },
              startWeek: {
                type: SchemaType.NUMBER,
                description: "Starting week number"
              },
              endWeek: {
                type: SchemaType.NUMBER,
                description: "Ending week number"
              },
              keyDeliverables: {
                type: SchemaType.ARRAY,
                description: "Key deliverables for this phase",
                items: {
                  type: SchemaType.STRING
                }
              },
              resources: {
                type: SchemaType.ARRAY,
                description: "Required resources for this phase",
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    role: {
                      type: SchemaType.STRING,
                      description: "Resource role"
                    },
                    quantity: {
                      type: SchemaType.NUMBER,
                      description: "Number of resources needed"
                    },
                    allocation: {
                      type: SchemaType.NUMBER,
                      description: "Percentage of time allocated"
                    }
                  },
                  required: ["role", "quantity", "allocation"]
                }
              }
            },
            required: ["name", "duration", "startWeek", "endWeek", "keyDeliverables", "resources"]
          }
        },
        costs: {
          type: SchemaType.ARRAY,
          description: "Detailed cost breakdown",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              category: {
                type: SchemaType.STRING,
                description: "Cost category"
              },
              amount: {
                type: SchemaType.NUMBER,
                description: "Cost amount in USD"
              },
              description: {
                type: SchemaType.STRING,
                description: "Detailed description of the cost"
              },
              phase: {
                type: SchemaType.STRING,
                description: "Associated project phase"
              },
              type: {
                type: SchemaType.STRING,
                enum: ["one-time", "recurring"],
                description: "Type of cost"
              }
            },
            required: ["category", "amount", "description", "phase", "type"]
          }
        }
      },
      required: ["phases", "costs"]
    };
  
    // Utility functions
    function monthsToWeeks(months) {
      return Math.round(months * 4.345);
    }
  
    function weeksToMonths(weeks) {
      return Math.round(weeks / 4.345 * 10) / 10;
    }
  
    function formatCurrency(amount) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }
  
    function calculatePercentage(value, max) {
      return Math.round((value / max) * 100);
    }
  
    function calculateRiskLevel(percentage) {
      if (percentage >= 80) return { level: 'Low Risk', color: 'bg-green-500', textColor: 'text-green-700' };
      if (percentage >= 60) return { level: 'Moderate Risk', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
      if (percentage >= 40) return { level: 'High Risk', color: 'bg-orange-500', textColor: 'text-orange-700' };
      return { level: 'Critical Risk', color: 'bg-red-500', textColor: 'text-red-700' };
    }
  
    function getRiskTooltip(percentage, type) {
      if (type === 'timeline') {
        if (percentage >= 80) return 'Optimal timeline with low risk to project quality and deliverables';
        if (percentage >= 60) return 'Compressed timeline with moderate risk - may require scope adjustments';
        if (percentage >= 40) return 'Highly compressed timeline - significant scope reduction needed';
        return 'Critical timeline compression - high risk of project failure';
      } else {
        if (percentage >= 80) return 'Optimal budget with appropriate contingency and resources';
        if (percentage >= 60) return 'Tight budget - may require resource optimization';
        if (percentage >= 40) return 'Significantly constrained budget - scope reduction required';
        return 'Critical budget constraints - high risk of quality issues';
      }
    }
  
    // Core functions
    async function analyzeRequirements() {
      if (!requirementsText) return;
      
      loading = true;
      try {
        const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-pro",
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
          }
        });
  
        savedContext = requirementsText;
  
        const prompt = `
          You are a senior project manager and technical architect.
          Based on the following requirements, provide a detailed breakdown of project phases and associated costs.
          Consider this as the OPTIMAL timeline and budget - the maximum recommended values.
          
          For each phase:
          - Specify exact duration and timing
          - List key deliverables
          - Detail required resources
          - Consider dependencies between phases
          
          For costs:
          - Break down by category and phase
          - Include both one-time and recurring costs
          - Consider resource costs based on market rates
          - Account for tools, infrastructure, and overhead
          
          Requirements Document:
          ${requirementsText}
          
          Provide a comprehensive analysis following software development best practices.
          Ensure the phases and costs are realistic and well-structured.
        `;
  
        const result = await model.generateContent(prompt);
        analysis = JSON.parse(result.response.text());
        
        // Set initial values
        const totalWeeks = analysis.phases.reduce((sum, phase) => sum + phase.duration, 0);
        maxTimelineMonths = Math.ceil(totalWeeks / 4);
        timelineMonths = maxTimelineMonths;
  
        maxBudget = analysis.costs.reduce((sum, cost) => sum + cost.amount, 0);
        totalBudget = maxBudget;
        
      } catch (error) {
        console.error('Error analyzing requirements:', error);
        alert('Error analyzing requirements. Please check the console for details.');
      } finally {
        loading = false;
      }
    }
  
    async function recalculateProject() {
      if (!savedContext) return;
      
      recalculationLoading = true;
      try {
        const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-pro",
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
          }
        });
  
        const prompt = `
          You are a senior project manager and technical architect.
          Based on the following requirements and new constraints, provide a detailed breakdown 
          of project phases and associated costs.
          
          New Constraints:
          - Timeline: ${timelineMonths} months (${monthsToWeeks(timelineMonths)} weeks)
          - Budget: ${formatCurrency(totalBudget)}
          
          These constraints are shorter/lower than the optimal values:
          - Optimal Timeline: ${maxTimelineMonths} months
          - Optimal Budget: ${formatCurrency(maxBudget)}
          
          Provide a realistic restructuring of the project that:
          1. Fits within both time and budget constraints
          2. Identifies scope adjustments needed
          3. Highlights risks and tradeoffs
          4. Maintains critical functionality
          5. Suggests process optimizations
          
          Original Requirements:
          ${savedContext}
          
          Format the response to include:
          1. Revised phase breakdown with durations
          2. Adjusted resource allocation
          3. Prioritized deliverables
          4. Risk mitigation strategies
        `;
  
        const result = await model.generateContent(prompt);
        analysis = JSON.parse(result.response.text());
        
      } catch (error) {
        console.error('Error recalculating project:', error);
        alert('Error updating analysis. Please check the console for details.');
      } finally {
        recalculationLoading = false;
      }
    }
  
    function resetToOptimal() {
      timelineMonths = maxTimelineMonths;
      totalBudget = maxBudget;
      recalculateProject();
    }
  
    // Reactive statement for constraint changes
    $: if (timelineMonths || totalBudget) {
      const timelinePercentage = calculatePercentage(timelineMonths, maxTimelineMonths);
      const budgetPercentage = calculatePercentage(totalBudget, maxBudget);
    }

    // Add these functions to your existing script section 
    let copied = false;

    function generateAnalysisContent() {
      if (!analysis) return '';

      const content = [];
      
      // Project Analysis Report
      content.push('Project Analysis Report');
      content.push('=' + '='.repeat(40) + '\n\n');
      
      // Timeline Analysis
      content.push('Timeline Analysis\n');
      content.push('-'.repeat(20) + '\n');
      content.push(`Total Timeline: ${timelineMonths} months`);
      content.push(`Optimal Timeline: ${maxTimelineMonths} months`);
      content.push(`Timeline Utilization: ${Math.round((timelineMonths/maxTimelineMonths) * 100)}%\n\n`);

      // Budget Analysis
      content.push('Budget Analysis\n');
      content.push('-'.repeat(20) + '\n');
      content.push(`Total Budget: ${formatCurrency(totalBudget)}`);
      content.push(`Optimal Budget: ${formatCurrency(maxBudget)}`);
      content.push(`Budget Utilization: ${Math.round((totalBudget/maxBudget) * 100)}%\n\n`);

      // Project Phases
      content.push('Project Phases\n');
      content.push('-'.repeat(20) + '\n');
      analysis.phases.forEach(phase => {
        content.push(`\n${phase.name}`);
        content.push(`Duration: Week ${phase.startWeek} - Week ${phase.endWeek} (${phase.duration} weeks)`);
        
        content.push('\nKey Deliverables:');
        phase.keyDeliverables.forEach(del => {
          content.push(`• ${del}`);
        });
        
        content.push('\nResources:');
        phase.resources.forEach(res => {
          content.push(`• ${res.role}: ${res.quantity} (${res.allocation}% allocation)`);
        });
        content.push('');
      });

      // Cost Analysis
      content.push('Cost Analysis\n');
      content.push('-'.repeat(20) + '\n');
      
      const recurringCosts = analysis.costs.filter(c => c.type === 'recurring');
      const oneTimeCosts = analysis.costs.filter(c => c.type === 'one-time');
      
      content.push(`\nRecurring Costs: ${formatCurrency(recurringCosts.reduce((sum, c) => sum + c.amount, 0))}`);
      content.push(`One-time Costs: ${formatCurrency(oneTimeCosts.reduce((sum, c) => sum + c.amount, 0))}`);
      
      content.push('\nDetailed Cost Breakdown:');
      analysis.costs.forEach(cost => {
        content.push(`\n${cost.category}`);
        content.push(`Amount: ${formatCurrency(cost.amount)}`);
        content.push(`Type: ${cost.type}`);
        content.push(`Phase: ${cost.phase}`);
        content.push(`Description: ${cost.description}`);
      });

      return content.join('\n');
    }

    async function copyToClipboard() {
      if (!analysis) return;
      
      try {
        const content = generateAnalysisContent();
        await navigator.clipboard.writeText(content);
        copied = true;
        setTimeout(() => {
          copied = false;
        }, 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }

    const colors = {
      background: '#151515',
      cardBg: '#151515',
      textPrimary: 'text-brand-white',
      textSecondary: 'text-brand-white/90',
      textMuted: 'text-brand-white/70',
      border: 'border-white/10',
      shadow: 'shadow-[0_0_10px_rgba(255,255,255,0.1)]',
      hoverShadow: 'hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]'
    };

    analysis = {
      phases: [
        {
          name: "Requirements & Planning",
          duration: 4,
          startWeek: 1,
          endWeek: 4,
          keyDeliverables: [
            "Detailed requirements document",
            "Technical architecture plan",
            "Project timeline",
            "Resource allocation plan"
          ],
          resources: [
            {
              role: "Business Analyst",
              quantity: 1,
              allocation: 100
            },
            {
              role: "Solution Architect",
              quantity: 1,
              allocation: 50
            }
          ]
        },
        {
          name: "Design & Development",
          duration: 12,
          startWeek: 5,
          endWeek: 16,
          keyDeliverables: [
            "UI/UX design mockups",
            "Database schema",
            "Core functionality implementation"
          ],
          resources: [
            {
              role: "Frontend Developer",
              quantity: 2,
              allocation: 100
            },
            {
              role: "Backend Developer",
              quantity: 2,
              allocation: 100
            }
          ]
        },
        {
          name: "Testing & QA",
          duration: 4,
          startWeek: 17,
          endWeek: 20,
          keyDeliverables: [
            "Test plans",
            "Bug reports",
            "Performance testing results"
          ],
          resources: [
            {
              role: "QA Engineer",
              quantity: 2,
              allocation: 100
            }
          ]
        }
      ],
      costs: [
        {
          category: "Development Team",
          amount: 80000,
          description: "Salaries for development team members",
          phase: "Design & Development",
          type: "recurring"
        },
        {
          category: "Infrastructure",
          amount: 15000,
          description: "Cloud infrastructure and hosting costs",
          phase: "Design & Development",
          type: "one-time"
        },
        {
          category: "Quality Assurance",
          amount: 20000,
          description: "QA team and testing tools",
          phase: "Testing & QA",
          type: "recurring"
        }
      ]
    };
  </script>
  
  <div class="container mx-auto p-6 text-brand-white min-h-screen">
    <h1 class="text-3xl font-bold mb-6 text-brand-white">Project Analysis & Planning Tool</h1>
    
    <!-- Requirements Input -->
    <div class="mb-8">
      <textarea
        bind:value={requirementsText}
        class="w-full h-64 p-4 rounded-lg bg-[#151515] text-brand-white placeholder-gray-500
                focus:outline-none resize-none
               shadow-[0_0_10px_rgba(255,255,255,0.1)]
               hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]
               transition-all duration-300"
        placeholder="Paste your requirements documentation here..."
      ></textarea>
      <button
        on:click={analyzeRequirements}
        class="mt-4 px-6 py-2 bg-brand-red text-brand-white rounded-lg hover:bg-brand-red/90 
               disabled:opacity-50 transition-colors duration-200"
        disabled={loading}
      >
        {#if loading}
          <span class="flex items-center gap-2">
            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Analyzing...
          </span>
        {:else}
          Analyze Requirements
        {/if}
      </button>
    </div>
  
    {#if analysis}
    <div class="bg-brand-black">
        <!-- Project Constraints -->
        <div class="bg-[#151515] p-6 rounded-lg shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-300 mb-6 border border-white/10">
          <h3 class="text-lg font-medium mb-6 text-brand-white">Project Constraints</h3>
          
          <!-- Timeline Slider -->
          <div class="mb-8">
            <h4 class="text-sm font-medium text-brand-white/90 mb-2">Timeline Adjustment</h4>
            <div class="slider-container">
              {#if timelineMonths}
                {@const percentage = calculatePercentage(timelineMonths, maxTimelineMonths)}
                {@const risk = calculateRiskLevel(percentage)}
                <div 
                  class="risk-indicator {risk.color} {risk.textColor}"
                  style="left: {percentage}%"
                >
                  {risk.level}
                </div>
                <div class="tooltip bg-[#151515] border border-white/10">
                  {getRiskTooltip(percentage, 'timeline')}
                </div>
              {/if}
              <input
                type="range"
                bind:value={timelineMonths}
                min={weeksToMonths(MIN_TIMELINE_WEEKS)}
                max={maxTimelineMonths}
                step="0.1"
                class="custom-slider"
              />
              <div class="flex justify-between text-sm text-gray-600 mt-2">
                <span>{monthsToWeeks(timelineMonths)} weeks ({timelineMonths} months)</span>
                <span>{calculatePercentage(timelineMonths, maxTimelineMonths)}% of optimal</span>
              </div>
            </div>
          </div>
          
          <!-- Budget Slider -->
          <div class="mb-8">
            <h4 class="text-sm font-medium text-gray-600 mb-2">Budget Adjustment</h4>
            <div class="slider-container">
              {#if totalBudget}
                {@const percentage = calculatePercentage(totalBudget, maxBudget)}
                {@const risk = calculateRiskLevel(percentage)}
                <div 
                  class="risk-indicator {risk.color} {risk.textColor}"
                  style="left: {percentage}%"
                >
                  {risk.level}
                </div>
                <div class="tooltip">
                  {getRiskTooltip(percentage, 'budget')}
                </div>
              {/if}
              <input
                type="range"
                bind:value={totalBudget}
                min={MIN_BUDGET}
                max={maxBudget}
                step="1000"
                class="custom-slider"
              />
              <div class="flex justify-between text-sm text-gray-600 mt-2">
                <span>{formatCurrency(totalBudget)}</span>
                <span>{calculatePercentage(totalBudget, maxBudget)}% of optimal</span>
              </div>
            </div>
          </div>
  
          <!-- Action Buttons -->
          <div class="flex justify-between items-center pt-4 border-t">
            <button
              on:click={resetToOptimal}
              class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Reset to Optimal
            </button>
            
            <button
              on:click={recalculateProject}
              disabled={recalculationLoading}
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {#if recalculationLoading}
                <span class="flex items-center gap-2">
                    <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Recalculating...
                    </span>
                  {:else}
                    Update Project Plan
                  {/if}
                </button>
              </div>
            </div>
      
            <!-- Phase Timeline Display -->
            <div class="space-y-6 mb-8">
              <h3 class="text-lg font-medium">Project Phases</h3>
              {#if analysis.phases}
                {#each analysis.phases as phase}
                  <div class="bg-white p-6 rounded-lg shadow-sm">
                    <div class="flex justify-between items-start mb-4">
                      <div>
                        <h4 class="text-lg font-medium">{phase.name}</h4>
                        <p class="text-sm text-gray-600">
                          Week {phase.startWeek} - Week {phase.endWeek} ({phase.duration} weeks)
                        </p>
                      </div>
                      <div class="px-3 py-1 rounded-full text-sm" 
                        class:bg-green-100={phase.endWeek <= monthsToWeeks(timelineMonths)}
                        class:text-green-800={phase.endWeek <= monthsToWeeks(timelineMonths)}
                        class:bg-red-100={phase.endWeek > monthsToWeeks(timelineMonths)}
                        class:text-red-800={phase.endWeek > monthsToWeeks(timelineMonths)}
                      >
                        {phase.endWeek <= monthsToWeeks(timelineMonths) ? 'Within Timeline' : 'Timeline Risk'}
                      </div>
                    </div>
      
                    <!-- Resources -->
                    <div class="mb-4">
                      <h5 class="font-medium mb-2">Resources</h5>
                      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {#each phase.resources as resource}
                          <div class="bg-gray-50 p-3 rounded">
                            <div class="flex justify-between items-center">
                              <span class="font-medium">{resource.role}</span>
                              <span class="text-sm text-gray-600">{resource.allocation}%</span>
                            </div>
                            <div class="text-sm text-gray-600">
                              Quantity: {resource.quantity}
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
      
                    <!-- Deliverables -->
                    <div>
                      <h5 class="font-medium mb-2">Key Deliverables</h5>
                      <ul class="list-disc list-inside space-y-1">
                        {#each phase.keyDeliverables as deliverable}
                          <li class="text-sm text-gray-600">{deliverable}</li>
                        {/each}
                      </ul>
                    </div>
                  </div>
                {/each}
              {/if}
            </div>
      
            <!-- Cost Breakdown -->
            <div class="space-y-6">
              <h3 class="text-lg font-medium">Cost Breakdown</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Total Cost Summary -->
                <div class="bg-white p-6 rounded-lg shadow-sm">
                  <h4 class="font-medium mb-4">Cost Summary</h4>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600">Total Budget</span>
                      <span class="font-medium">{formatCurrency(totalBudget)}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-600">Optimal Budget</span>
                      <span class="font-medium">{formatCurrency(maxBudget)}</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                      <span class="text-gray-600">Variance</span>
                      <span class={totalBudget >= maxBudget ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(totalBudget - maxBudget)}
                      </span>
                    </div>
                  </div>
                </div>
      
                <!-- Cost Type Distribution -->
                <div class="bg-white p-6 rounded-lg shadow-sm">
                  <h4 class="font-medium mb-4">Cost Distribution</h4>
                  <div class="space-y-4">
                    {#if analysis.costs}
                      {@const recurringCosts = analysis.costs.filter(c => c.type === 'recurring')}
                      {@const oneTimeCosts = analysis.costs.filter(c => c.type === 'one-time')}
                      <div class="space-y-2">
                        <div class="text-sm text-gray-600">Recurring Costs</div>
                        <div class="font-medium">
                          {formatCurrency(recurringCosts.reduce((sum, c) => sum + c.amount, 0))}
                        </div>
                      </div>
                      <div class="space-y-2">
                        <div class="text-sm text-gray-600">One-time Costs</div>
                        <div class="font-medium">
                          {formatCurrency(oneTimeCosts.reduce((sum, c) => sum + c.amount, 0))}
                        </div>
                      </div>
                    {/if}
                  </div>
                </div>
      
                <!-- Detailed Costs -->
                {#if analysis.costs}
                  {#each analysis.costs as cost}
                    <div class="bg-white p-6 rounded-lg shadow-sm">
                      <div class="flex justify-between items-start mb-3">
                        <div>
                          <h4 class="font-medium">{cost.category}</h4>
                          <p class="text-sm text-gray-600">{cost.description}</p>
                        </div>
                        <div class="text-right">
                          <div class="font-medium">{formatCurrency(cost.amount)}</div>
                          <div class="text-sm text-gray-600">{cost.type}</div>
                        </div>
                      </div>
                      <div class="text-sm text-gray-600">
                        Phase: {cost.phase}
                      </div>
                    </div>
                  {/each}
                {/if}
              </div>
            </div>
          </div>
        {/if}
        {#if analysis}
          <div class="fixed bottom-8 right-8">
            <button
              on:click={copyToClipboard}
              class="flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-200 {
                copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
              }"
            >
              {#if copied}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Copied!</span>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy as Document</span>
              {/if}
            </button>
          </div>
        {/if}
      </div>
      
      <style lang="postcss">
        .slider-container {
          @apply relative w-full;
        }
      
        .custom-slider {
          @apply w-full h-3 rounded-lg appearance-none cursor-pointer bg-gray-200;
          @apply transition-all duration-300;
        }
      
        .custom-slider::-webkit-slider-thumb {
          @apply w-6 h-6 rounded-full appearance-none;
          @apply bg-white border-2 border-blue-600;
          @apply shadow-lg cursor-pointer;
          @apply transition-all duration-200;
          @apply hover:scale-110;
        }
      
        .custom-slider::-moz-range-thumb {
          @apply w-6 h-6 rounded-full;
          @apply bg-white border-2 border-blue-600;
          @apply shadow-lg cursor-pointer;
          @apply transition-all duration-200;
          @apply hover:scale-110;
        }
      
        .risk-indicator {
          @apply absolute -top-12 left-0 transform -translate-x-1/2;
          @apply px-3 py-1 rounded-lg text-sm font-medium;
          @apply shadow-md;
          @apply transition-all duration-300;
        }
      
        .tooltip {
          @apply invisible absolute -top-24 left-1/2 transform -translate-x-1/2;
          @apply px-4 py-2 rounded-lg text-sm text-white bg-gray-900;
          @apply opacity-0 transition-all duration-200;
          @apply w-64 text-center;
          @apply shadow-lg;
        }
      
        .slider-container:hover .tooltip {
          @apply visible opacity-100;
        }
</style>