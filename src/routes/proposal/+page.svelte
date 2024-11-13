<script lang="ts">
    import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
    
    interface ProposalTier {
      name: string;
      summary: string;
      timeline: {
        duration: number;
        milestones: Array<{
          name: string;
          deliverables: string[];
          timeline: string;
        }>;
      };
      budget: {
        total: number;
        breakdown: Array<{
          category: string;
          amount: number;
          description: string;
        }>;
      };
      features: string[];
      benefits: string[];
      risks: Array<{
        description: string;
        mitigation: string;
      }>;
    }
    
    interface Proposal {
      projectOverview: string;
      clientBenefits: string[];
      methodology: string;
      tiers: ProposalTier[];
      nextSteps: string[];
    }

    // First, let's define proper interfaces
    interface Phase {
        name: string;
        duration: number;
        keyDeliverables: string[];
        resources: Array<{
            role: string;
            quantity: number;
            allocation: number;
        }>;
    }

    interface AnalysisDocument {
        timelineMonths: number;
        totalBudget: number;
        phases: Phase[];
        costs: Array<{
            category: string;
            amount: number;
            type: string;
            description: string;
        }>;
    }

    // Initialize with default values
    let analysisDocuments: AnalysisDocument[] = Array(3).fill(null).map(() => ({
        timelineMonths: 0,
        totalBudget: 0,
        phases: [],
        costs: []
    }));
    
    // State management
    let requirementsDoc = '';
    let currentAnalysisIndex = 0;
    let loading = false;
    let generatedProposal: Proposal | null = null;
    let copied = false;
    
    // Initialize Gemini AI
    const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    const proposalSchema = {
      type: SchemaType.OBJECT,
      properties: {
        projectOverview: {
          type: SchemaType.STRING,
          description: "Executive summary of the project"
        },
        clientBenefits: {
          type: SchemaType.ARRAY,
          description: "Key benefits for the client",
          items: { type: SchemaType.STRING }
        },
        methodology: {
          type: SchemaType.STRING,
          description: "Project methodology and approach"
        },
        tiers: {
          type: SchemaType.ARRAY,
          description: "Three tiers of project proposals",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: {
                type: SchemaType.STRING,
                description: "Tier name (e.g., Essential, Advanced, Premium)"
              },
              summary: {
                type: SchemaType.STRING,
                description: "Brief summary of this tier"
              },
              timeline: {
                type: SchemaType.OBJECT,
                properties: {
                  duration: {
                    type: SchemaType.NUMBER,
                    description: "Duration in months"
                  },
                  milestones: {
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        name: { type: SchemaType.STRING },
                        deliverables: {
                          type: SchemaType.ARRAY,
                          items: { type: SchemaType.STRING }
                        },
                        timeline: { type: SchemaType.STRING }
                      }
                    }
                  }
                }
              },
              budget: {
                type: SchemaType.OBJECT,
                properties: {
                  total: {
                    type: SchemaType.NUMBER,
                    description: "Total budget for this tier"
                  },
                  breakdown: {
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        category: { type: SchemaType.STRING },
                        amount: { type: SchemaType.NUMBER },
                        description: { type: SchemaType.STRING }
                      }
                    }
                  }
                }
              },
              features: {
                type: SchemaType.ARRAY,
                description: "Key features included in this tier",
                items: { type: SchemaType.STRING }
              },
              benefits: {
                type: SchemaType.ARRAY,
                description: "Benefits specific to this tier",
                items: { type: SchemaType.STRING }
              },
              risks: {
                type: SchemaType.ARRAY,
                description: "Risks and mitigation strategies",
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    description: { type: SchemaType.STRING },
                    mitigation: { type: SchemaType.STRING }
                  }
                }
              }
            }
          }
        },
        nextSteps: {
          type: SchemaType.ARRAY,
          description: "Recommended next steps",
          items: { type: SchemaType.STRING }
        }
      }
    };
    
    async function generateProposal() {
      if (!requirementsDoc || analysisDocuments.some(doc => !doc)) {
        alert('Please fill in all required documents');
        return;
      }
    
      loading = true;
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-pro",
          generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 8000,
            responseMimeType: "application/json",
            responseSchema: proposalSchema,
          },
        });
    
        const prompt = `
          Create a detailed three-tiered project proposal based on the following information:
    
          Requirements Document:
          ${requirementsDoc}
    
          Analysis Documents:
          ${analysisDocuments.map((doc, i) => `
            Analysis ${i + 1}:
            - Timeline: ${doc.timelineMonths} months
            - Budget: $${doc.totalBudget}
            - Phases: ${JSON.stringify(doc.phases)}
            - Costs: ${JSON.stringify(doc.costs)}
          `).join('\n')}
    
          Create three distinct tiers (Essential, Advanced, and Premium) that:
          1. Build upon each other progressively
          2. Offer clear value differentiation
          3. Align with different budget levels
          4. Address different risk tolerances
          5. Provide different timeline options
    
          For each tier:
          - Clearly define scope and deliverables
          - Provide detailed timeline and milestones
          - Break down costs and budgets
          - Highlight specific benefits and features
          - Address risks and mitigation strategies
    
          Make the proposal compelling and client-focused.
        `;
    
        const result = await model.generateContent(prompt);
        generatedProposal = JSON.parse(result.response.text());
      } catch (error) {
        console.error('Error generating proposal:', error);
        alert('Error generating proposal. Please try again.');
      } finally {
        loading = false;
      }
    }
    
    function formatCurrency(amount: number): string {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }
    
    function generateProposalDocument(): string {
      if (!generatedProposal) return '';
    
      const content = [];
      
      // Title
      content.push('Project Proposal\n');
      content.push('='.repeat(50) + '\n\n');
      
      // Project Overview
      content.push('Project Overview\n');
      content.push('-'.repeat(30) + '\n');
      content.push(generatedProposal.projectOverview + '\n\n');
      
      // Client Benefits
      content.push('Key Client Benefits\n');
      content.push('-'.repeat(30) + '\n');
      generatedProposal.clientBenefits.forEach(benefit => {
        content.push(`• ${benefit}\n`);
      });
      content.push('\n');
      
      // Methodology
      content.push('Our Approach\n');
      content.push('-'.repeat(30) + '\n');
      content.push(generatedProposal.methodology + '\n\n');
      
      // Proposal Tiers
      generatedProposal.tiers.forEach(tier => {
        content.push(`${tier.name} Tier\n`);
        content.push('='.repeat(30) + '\n');
        content.push(`Summary: ${tier.summary}\n\n`);
        
        content.push('Timeline & Milestones:\n');
        content.push(`Duration: ${tier.timeline.duration} months\n`);
        tier.timeline.milestones.forEach(milestone => {
          content.push(`\n${milestone.name}\n`);
          milestone.deliverables.forEach(del => content.push(`• ${del}\n`));
          content.push(`Timeline: ${milestone.timeline}\n`);
        });
        
        content.push('\nBudget:\n');
        content.push(`Total: ${formatCurrency(tier.budget.total)}\n`);
        content.push('Breakdown:\n');
        tier.budget.breakdown.forEach(item => {
          content.push(`• ${item.category}: ${formatCurrency(item.amount)}\n`);
          content.push(`  ${item.description}\n`);
        });
        
        content.push('\nFeatures:\n');
        tier.features.forEach(feature => content.push(`• ${feature}\n`));
        
        content.push('\nBenefits:\n');
        tier.benefits.forEach(benefit => content.push(`• ${benefit}\n`));
        
        content.push('\nRisks & Mitigation:\n');
        tier.risks.forEach(risk => {
          content.push(`• Risk: ${risk.description}\n`);
          content.push(`  Mitigation: ${risk.mitigation}\n`);
        });
        content.push('\n');
      });
      
      // Next Steps
      content.push('Recommended Next Steps\n');
      content.push('-'.repeat(30) + '\n');
      generatedProposal.nextSteps.forEach(step => {
        content.push(`• ${step}\n`);
      });
      
      return content.join('');
    }
    
    async function copyToClipboard() {
      if (!generatedProposal) return;
      
      try {
        const content = generateProposalDocument();
        await navigator.clipboard.writeText(content);
        copied = true;
        setTimeout(() => {
          copied = false;
        }, 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
    </script>
    
    <div class="container mx-auto p-6 max-w-4xl">
      <h1 class="text-3xl font-bold mb-8">Project Proposal Generator</h1>
    
      <!-- Requirements Document -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Requirements Document</h2>
        <textarea
          bind:value={requirementsDoc}
          class="w-full h-64 p-4 border rounded-lg"
          placeholder="Paste your requirements documentation here..."
        ></textarea>
      </div>
    
      <!-- Analysis Documents -->
    <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Analysis Documents</h2>
        <div class="space-y-4">
        {#each analysisDocuments as analysis, index}
            <div class="p-4 border rounded-lg">
            <h3 class="font-medium mb-2">Analysis Document {index + 1}</h3>
            <div class="grid grid-cols-2 gap-4">
                <div>
                <label class="block text-sm mb-1">Timeline (months)</label>
                <input
                    type="number"
                    bind:value={analysis.timelineMonths}
                    class="w-full p-2 border rounded"
                    min="1"
                />
                </div>
                <div>
                <label class="block text-sm mb-1">Budget</label>
                <input
                    type="number"
                    bind:value={analysis.totalBudget}
                    class="w-full p-2 border rounded"
                    min="0"
                />
                </div>
            </div>
            
            <div class="mt-4">
                <label class="block text-sm mb-1">Phases</label>
                {#each analysis.phases as phase, phaseIndex}
                <div class="p-3 border rounded mt-2">
                    <input
                    bind:value={phase.name}
                    placeholder="Phase name"
                    class="w-full p-2 border rounded mb-2"
                    />
                    <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="block text-sm mb-1">Duration (weeks)</label>
                        <input
                        type="number"
                        bind:value={phase.duration}
                        class="w-full p-2 border rounded"
                        min="1"
                        />
                    </div>
                    </div>
                    
                    <!-- Key Deliverables -->
                    <div class="mt-2">
                    <label class="block text-sm mb-1">Key Deliverables</label>
                    {#each phase.keyDeliverables as deliverable, deliverableIndex}
                        <div class="flex gap-2 mt-1">
                        <input
                            bind:value={phase.keyDeliverables[deliverableIndex]}
                            placeholder="Deliverable"
                            class="flex-1 p-2 border rounded"
                        />
                        <button
                            on:click={() => {
                            phase.keyDeliverables = phase.keyDeliverables.filter((_, i) => i !== deliverableIndex);
                            }}
                            class="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                        >
                            Remove
                        </button>
                        </div>
                    {/each}
                    <button
                        on:click={() => {
                        phase.keyDeliverables = [...phase.keyDeliverables, ''];
                        }}
                        class="mt-2 px-3 py-1 bg-gray-100 rounded text-sm"
                    >
                        Add Deliverable
                    </button>
                    </div>
                    
                    <!-- Resources -->
                    <div class="mt-2">
                    <label class="block text-sm mb-1">Resources</label>
                    {#each phase.resources as resource, resourceIndex}
                        <div class="grid grid-cols-3 gap-2 mt-1">
                        <input
                            bind:value={resource.role}
                            placeholder="Role"
                            class="p-2 border rounded"
                        />
                        <input
                            type="number"
                            bind:value={resource.quantity}
                            placeholder="Quantity"
                            class="p-2 border rounded"
                            min="1"
                        />
                        <input
                            type="number"
                            bind:value={resource.allocation}
                            placeholder="Allocation %"
                            class="p-2 border rounded"
                            min="0"
                            max="100"
                        />
                        <button
                            on:click={() => {
                            phase.resources = phase.resources.filter((_, i) => i !== resourceIndex);
                            }}
                            class="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                        >
                            Remove
                        </button>
                        </div>
                    {/each}
                    <button
                        on:click={() => {
                        phase.resources = [...phase.resources, { role: '', quantity: 1, allocation: 100 }];
                        }}
                        class="mt-2 px-3 py-1 bg-gray-100 rounded text-sm"
                    >
                        Add Resource
                    </button>
                    </div>
                    
                    <button
                    on:click={() => {
                        analysis.phases = analysis.phases.filter((_, i) => i !== phaseIndex);
                    }}
                    class="mt-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                    Remove Phase
                    </button>
                </div>
                {/each}
                <button
                on:click={() => {
                    analysis.phases = [...analysis.phases, {
                    name: '',
                    duration: 0,
                    keyDeliverables: [],
                    resources: []
                    }];
                }}
                class="mt-2 px-3 py-1 bg-gray-100 rounded text-sm"
                >
                Add Phase
                </button>
            </div>
            
            <!-- Costs -->
            <div class="mt-4">
                <label class="block text-sm mb-1">Costs</label>
                {#each analysis.costs as cost, costIndex}
                <div class="grid grid-cols-4 gap-2 mt-1">
                    <input
                    bind:value={cost.category}
                    placeholder="Category"
                    class="p-2 border rounded"
                    />
                    <input
                    type="number"
                    bind:value={cost.amount}
                    placeholder="Amount"
                    class="p-2 border rounded"
                    min="0"
                    />
                    <select
                    bind:value={cost.type}
                    class="p-2 border rounded"
                    >
                    <option value="one-time">One-time</option>
                    <option value="recurring">Recurring</option>
                    </select>
                    <input
                    bind:value={cost.description}
                    placeholder="Description"
                    class="p-2 border rounded"
                    />
                    <button
                    on:click={() => {
                        analysis.costs = analysis.costs.filter((_, i) => i !== costIndex);
                    }}
                    class="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                    Remove
                    </button>
                </div>
                {/each}
                <button
                on:click={() => {
                    analysis.costs = [...analysis.costs, {
                    category: '',
                    amount: 0,
                    type: 'one-time',
                    description: ''
                    }];
                }}
                class="mt-2 px-3 py-1 bg-gray-100 rounded text-sm"
                >
                Add Cost
                </button>
            </div>
            </div>
        {/each}
        </div>
    </div>
    
      <!-- Generate Button -->
      <div class="flex justify-center">
        <button
          on:click={generateProposal}
          disabled={loading}
          class="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {#if loading}
            <span class="flex items-center gap-2">
              <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Generating Proposal...
            </span>
          {:else}
            Generate Proposal
          {/if}
        </button>
      </div>
    
      <!-- Generated Proposal -->
      {#if generatedProposal}
        <div class="mt-8 border rounded-lg p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Generated Proposal</h2>
            <button
              on:click={copyToClipboard}
              class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors {
                copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
              }"
            >
              {#if copied}
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Copied!</span>
              {:else}
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>Copy Proposal</span>
            {/if}
          </button>
        </div>
  
        <!-- Project Overview -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold mb-4">Project Overview</h3>
          <p class="text-gray-700">{generatedProposal.projectOverview}</p>
        </div>
  
        <!-- Client Benefits -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold mb-4">Key Client Benefits</h3>
          <ul class="list-disc pl-5 space-y-2">
            {#each generatedProposal.clientBenefits as benefit}
              <li class="text-gray-700">{benefit}</li>
            {/each}
          </ul>
        </div>
  
        <!-- Methodology -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold mb-4">Our Approach</h3>
          <p class="text-gray-700">{generatedProposal.methodology}</p>
        </div>
  
        <!-- Proposal Tiers -->
        <div class="space-y-8">
          <h3 class="text-xl font-semibold">Proposed Solutions</h3>
          {#each generatedProposal.tiers as tier}
            <div class="border rounded-lg p-6 bg-gray-50">
              <h4 class="text-lg font-semibold mb-4">{tier.name}</h4>
              <p class="text-gray-700 mb-6">{tier.summary}</p>
  
              <!-- Timeline -->
              <div class="mb-6">
                <h5 class="font-medium mb-3">Timeline & Milestones</h5>
                <p class="text-gray-700 mb-2">Duration: {tier.timeline.duration} months</p>
                <div class="space-y-4">
                  {#each tier.timeline.milestones as milestone}
                    <div class="border-l-2 border-blue-500 pl-4">
                      <h6 class="font-medium">{milestone.name}</h6>
                      <ul class="list-disc pl-5 space-y-1 mt-2">
                        {#each milestone.deliverables as deliverable}
                          <li class="text-gray-700">{deliverable}</li>
                        {/each}
                      </ul>
                      <p class="text-sm text-gray-600 mt-2">Timeline: {milestone.timeline}</p>
                    </div>
                  {/each}
                </div>
              </div>
  
              <!-- Budget -->
              <div class="mb-6">
                <h5 class="font-medium mb-3">Budget</h5>
                <p class="text-lg font-medium mb-3">Total: {formatCurrency(tier.budget.total)}</p>
                <div class="grid gap-4">
                  {#each tier.budget.breakdown as item}
                    <div class="bg-white p-4 rounded shadow-sm">
                      <div class="flex justify-between items-start">
                        <div>
                          <h6 class="font-medium">{item.category}</h6>
                          <p class="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <span class="font-medium">{formatCurrency(item.amount)}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
  
              <!-- Features & Benefits -->
              <div class="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h5 class="font-medium mb-3">Features</h5>
                  <ul class="list-disc pl-5 space-y-2">
                    {#each tier.features as feature}
                      <li class="text-gray-700">{feature}</li>
                    {/each}
                  </ul>
                </div>
                <div>
                  <h5 class="font-medium mb-3">Benefits</h5>
                  <ul class="list-disc pl-5 space-y-2">
                    {#each tier.benefits as benefit}
                      <li class="text-gray-700">{benefit}</li>
                    {/each}
                  </ul>
                </div>
              </div>
  
              <!-- Risks & Mitigation -->
              <div>
                <h5 class="font-medium mb-3">Risks & Mitigation Strategies</h5>
                <div class="space-y-4">
                  {#each tier.risks as risk}
                    <div class="bg-white p-4 rounded shadow-sm">
                      <p class="font-medium text-red-600">Risk: {risk.description}</p>
                      <p class="text-green-600 mt-2">Mitigation: {risk.mitigation}</p>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/each}
        </div>
  
        <!-- Next Steps -->
        <div class="mt-8">
          <h3 class="text-xl font-semibold mb-4">Recommended Next Steps</h3>
          <ul class="list-disc pl-5 space-y-2">
            {#each generatedProposal.nextSteps as step}
              <li class="text-gray-700">{step}</li>
            {/each}
          </ul>
        </div>
      </div>
    {/if}
  </div>
  
  <style >
  
    textarea {
      font-family: inherit;
    }
  
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  
    button svg {
      @apply transition-transform duration-200;
    }
  
    button:hover svg {
      @apply transform scale-110;
    }
  </style>