
<script lang="ts">
    import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
    
    // Types
    interface Message {
      role: 'user' | 'model';
      content: string;
    }
  
    interface RequirementsDocument {
      gatheredInformation: string[];
      requirementsOutline: {
        functional: string[];
        nonFunctional: string[];
      };
      risks: {
        description: string;
        impact: string;
        mitigation: string;
      }[];
      constraints: string[];
      assumptions: string[];
      dependencies: string[];
    }
  
    // State
    let messages: Message[] = [];
    let currentInput = '';
    let loading = false;
    let document: RequirementsDocument | null = null;
    let chatContainer: HTMLDivElement;
  
    // Initialize Gemini AI
    const API_KEY: string = import.meta.env.VITE_GOOGLE_API_KEY;
    const genAI = new GoogleGenerativeAI(API_KEY);
  
    const systemPrompt: string = `You are a skilled business analyst gathering project requirements. 
    Ask focused questions one at a time to understand the project fully. Cover topics like:
    - Business objectives and goals
    - Key stakeholders and users
    - Main features and functionality
    - Technical constraints
    - Timeline and budget constraints
    - Integration requirements
    - Security requirements
    - Performance expectations
    
    When you have gathered sufficient information, respond with "*****".`;
  
    // Auto-scroll chat
    $: if (chatContainer && messages) {
      setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 0);
    }
  
    async function generateDocument(conversationHistory: Message[]): Promise<RequirementsDocument | null> {
        try {
            const schema = {
            type: SchemaType.OBJECT,
            properties: {
                gatheredInformation: {
                type: SchemaType.ARRAY,
                description: "List of key points discussed during the requirements gathering",
                items: {
                    type: SchemaType.STRING
                }
                },
                requirementsOutline: {
                type: SchemaType.OBJECT,
                properties: {
                    functional: {
                    type: SchemaType.ARRAY,
                    description: "List of functional requirements",
                    items: {
                        type: SchemaType.STRING
                    }
                    },
                    nonFunctional: {
                    type: SchemaType.ARRAY,
                    description: "List of non-functional requirements",
                    items: {
                        type: SchemaType.STRING
                    }
                    }
                },
                required: ["functional", "nonFunctional"]
                },
                risks: {
                type: SchemaType.ARRAY,
                description: "List of identified risks with their impact and mitigation strategies",
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                    description: {
                        type: SchemaType.STRING,
                        description: "Description of the risk"
                    },
                    impact: {
                        type: SchemaType.STRING,
                        description: "Potential impact of the risk"
                    },
                    mitigation: {
                        type: SchemaType.STRING,
                        description: "Strategy to mitigate the risk"
                    }
                    },
                    required: ["description", "impact", "mitigation"]
                }
                },
                constraints: {
                type: SchemaType.ARRAY,
                description: "List of project constraints",
                items: {
                    type: SchemaType.STRING
                }
                },
                assumptions: {
                type: SchemaType.ARRAY,
                description: "List of project assumptions",
                items: {
                    type: SchemaType.STRING
                }
                },
                dependencies: {
                type: SchemaType.ARRAY,
                description: "List of project dependencies",
                items: {
                    type: SchemaType.STRING
                }
                }
            },
            required: [
                "gatheredInformation",
                "requirementsOutline",
                "risks",
                "constraints",
                "assumptions",
                "dependencies"
            ]
            };

            const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-pro",
            generationConfig: {
                temperature: 0.3,
                topK: 40,
                topP: 0.8,
                responseMimeType: "application/json",
                responseSchema: schema,
            },
            });

            const documentPrompt = `Based on our conversation, generate a comprehensive requirements document that includes:
            1. Key points discussed
            2. Functional and non-functional requirements
            3. Risks, their impacts, and mitigation strategies
            4. Project constraints
            5. Assumptions made
            6. Project dependencies

            Make sure each section is detailed and specific to the discussed requirements.`;

            const result = await model.generateContent([
            ...conversationHistory.map(msg => msg.content),
            documentPrompt
            ]);
            
            const response = result.response.text();
            return JSON.parse(response);
        } catch (error) {
            console.error('Error generating document:', error);
            return null;
        }
    }
  
    async function sendMessage() {
      if (!currentInput.trim() || loading) return;
  
      try {
        loading = true;
        const userMessage = currentInput;
        currentInput = '';
  
        const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-pro",
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.8,
          },
        });
  
        const chat = model.startChat({
          history: [
            {
              role: "user",
              parts: [{ text: systemPrompt }]
            },
            ...messages.map(msg => ({
              role: msg.role,
              parts: [{ text: msg.content }]
            }))
          ],
        });
  
        const result = await chat.sendMessage(userMessage);
        const response = result.response.text();
  
        messages = [
          ...messages,
          { role: 'user', content: userMessage },
          { role: 'model', content: response }
        ];
  
        // Check if the AI has indicated completion
        if (response.includes('*****')) {
          document = await generateDocument(messages);
        }
  
      } catch (error) {
        console.error('Error:', error);
      } finally {
        loading = false;
      }
    }
  
    function handleKeyPress(event: KeyboardEvent) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    }

    // Add this to your existing state variables
    let copied = false;

    function generateDocContent(doc: RequirementsDocument): string {
      if (!doc) return '';

      const content = [];
      
      // Title
      content.push('Requirements Documentation\n');
      content.push('='.repeat(50) + '\n\n');
      
      // Gathered Information
      content.push('1. Gathered Information\n');
      content.push('-'.repeat(30) + '\n');
      doc.gatheredInformation.forEach(info => {
        content.push(`• ${info}\n`);
      });
      content.push('\n');
      
      // Requirements Outline
      content.push('2. Requirements Outline\n');
      content.push('-'.repeat(30) + '\n');
      
      content.push('\nFunctional Requirements:\n');
      doc.requirementsOutline.functional.forEach(req => {
        content.push(`• ${req}\n`);
      });
      
      content.push('\nNon-Functional Requirements:\n');
      doc.requirementsOutline.nonFunctional.forEach(req => {
        content.push(`• ${req}\n`);
      });
      content.push('\n');
      
      // Risks
      content.push('3. Risks and Mitigation\n');
      content.push('-'.repeat(30) + '\n');
      doc.risks.forEach((risk, index) => {
        content.push(`\nRisk ${index + 1}:\n`);
        content.push(`Description: ${risk.description}\n`);
        content.push(`Impact: ${risk.impact}\n`);
        content.push(`Mitigation: ${risk.mitigation}\n`);
      });
      content.push('\n');
      
      // Constraints
      content.push('4. Constraints\n');
      content.push('-'.repeat(30) + '\n');
      doc.constraints.forEach(constraint => {
        content.push(`• ${constraint}\n`);
      });
      content.push('\n');
      
      // Assumptions
      content.push('5. Assumptions\n');
      content.push('-'.repeat(30) + '\n');
      doc.assumptions.forEach(assumption => {
        content.push(`• ${assumption}\n`);
      });
      content.push('\n');
      
      // Dependencies
      content.push('6. Dependencies\n');
      content.push('-'.repeat(30) + '\n');
      doc.dependencies.forEach(dependency => {
        content.push(`• ${dependency}\n`);
      });
      
      return content.join('');
    }

    async function copyToClipboard() {
      if (!document) return;
      
      try {
        const content = generateDocContent(document);
        await navigator.clipboard.writeText(content);
        copied = true;
        setTimeout(() => {
          copied = false;
        }, 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }

    messages = [
  {
    role: 'model',
    content: 'Hello! I\'m here to help gather requirements for your project. Could you tell me about the main business objectives and goals?'
  },
  {
    role: 'user',
    content: 'We need a project management system that can help our team track tasks and collaborate better.'
  },
  {
    role: 'model',
    content: 'Thank you for that initial information. Can you tell me who the key stakeholders and end users of this system will be?'
  },
  {
    role: 'user',
    content: 'The main users will be project managers, developers, and team leads. We have about 50 people in our organization.'
  },
  {
    role: 'model',
    content: '*****'
  }
];

document = {
  gatheredInformation: [
    'Need for a project management system focused on task tracking',
    'Target user base of 50 people across different roles',
    'Primary focus on team collaboration and task management',
    'Organization includes project managers, developers, and team leads',
    'Current system lacks proper tracking capabilities'
  ],
  requirementsOutline: {
    functional: [
      'User authentication and role-based access control',
      'Task creation, assignment, and tracking',
      'Project timeline visualization and management',
      'Real-time collaboration features',
      'File sharing and document management',
      'Automated notifications and reminders',
      'Custom dashboard for different user roles',
      'Search and filter functionality'
    ],
    nonFunctional: [
      'System should support 50+ concurrent users',
      'Page load time should not exceed 2 seconds',
      'Mobile-responsive design',
      '99.9% system uptime',
      'Regular automated backups',
      'Industry-standard security measures',
      'Intuitive user interface'
    ]
  },
  risks: [
    {
      description: 'Data Migration Complexity',
      impact: 'Potential loss of historical project data and system downtime during migration',
      mitigation: 'Develop a comprehensive migration strategy and perform multiple test migrations'
    },
    {
      description: 'User Adoption Resistance',
      impact: 'Low system utilization and reduced ROI',
      mitigation: 'Implement thorough training program and gather user feedback during development'
    },
    {
      description: 'Integration Challenges',
      impact: 'Delays in project timeline and increased development costs',
      mitigation: 'Early identification of integration points and thorough testing plan'
    }
  ],
  constraints: [
    'Project must be completed within 6 months',
    'Budget limitation of $200,000',
    'Must comply with existing IT infrastructure',
    'Limited availability of key stakeholders for feedback',
    'Must maintain existing data formats for compatibility'
  ],
  assumptions: [
    'Stable internet connectivity available for all users',
    'Users have basic technical proficiency',
    'Current system data is in a standard format',
    'IT support team available for maintenance',
    'Stakeholders will be available for critical decisions'
  ],
  dependencies: [
    'Access to current system APIs',
    'Third-party authentication service availability',
    'Cloud infrastructure setup completion',
    'User training program development',
    'Security audit clearance'
  ]
};
  </script>
  
  <div class="max-w-4xl mx-auto p-4 pt-16">
    <div class="rounded-md shadow-lg">
      <div class="p-4 border-b rounded-t-lg bg-[#BBBBBB]">
        <h2 class="text-xl font-bold text-[#151515]">Requirements Gathering Session</h2>
      </div>
  
      <div class="p-4 rounded-lg bg-[#151515]">
        <!-- Chat Messages -->
        <div 
          bind:this={chatContainer}
          class="h-96 overflow-y-auto rounded-lg p-4 bg-[#151515] mb-4 custom-scrollbar"
        >
          {#each messages as message}
            <div class="mb-4 {message.role === 'model' ? 'pl-4' : 'pl-0'}">
              <div class="flex items-start gap-2">
                <div class="flex-1">
                  <p class="text-sm font-medium text-brand-white">
                    {message.role === 'model' ? 'Business Analyst' : 'You'}
                  </p>
                  <p class="text-sm mt-1 text-brand-white/90">{message.content}</p>
                </div>
              </div>
            </div>
          {/each}
  
          {#if loading}
            <div class="flex items-center gap-2 text-brand-red/70">
              <svg
                class="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span class="text-sm">Thinking...</span>
            </div>
          {/if}
        </div>
  
        <!-- Input Area -->
        <div class="flex rounded-xl bg-[#151515] shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-shadow duration-300 overflow-hidden">
          <div class="flex-1 relative">
            <div class="relative">
              <textarea
                bind:value={currentInput}
                on:keypress={handleKeyPress}
                placeholder="Type your response here..."
                class="w-full px-4 py-3 bg-[#151515] text-brand-white placeholder-gray-500 rounded-lg resize-none border-0
                       focus:ring-white/30 focus:outline-none
                       scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                style="min-height: 20px; max-height: 200px;"
                rows="1"
              />
              <div class="absolute bottom-5 right-3 flex items-center gap-2 text-xs">
                {#if currentInput.length > 0}
                  <span class="text-white/50">{currentInput.length} characters</span>
                {/if}
                <span class="text-white/30">Press Enter ↵</span>
              </div>
            </div>
          </div>
        
          <button
            on:click={sendMessage}
            disabled={loading || !currentInput.trim()}
            class="px-8 bg-brand-red text-brand-white font-medium
                  disabled:opacity-50 disabled:cursor-not-allowed 
                  hover:bg-brand-red/90 active:bg-brand-red/80 
                  transition-colors duration-200 ease-out
                  focus:outline-none focus:bg-brand-red/90"
          >
            {#if loading}
              <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            {:else}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            {/if}
          </button>
        </div>
      </div>
  
      <!-- Generated Document -->
      {#if document}
      <div class="mt-8 rounded-lg  bg-brand-black">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-brand-white">Requirements Document</h3>
          <button
            on:click={copyToClipboard}
            class="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors {
              copied ? 'bg-brand-blue text-brand-white' : 'bg-brand-red text-brand-white hover:bg-brand-red/90'
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
              <span>Copy Document</span>
            {/if}
          </button>
        </div>

          <!-- Gathered Information -->
          <section class="mb-6 bg-[#151515] p-4 shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-shadow duration-300">
            <h4 class="font-medium mb-2 text-brand-white">Gathered Information</h4>
            <ul class="list-disc pl-5 space-y-1 text-brand-white/90">
              {#each document.gatheredInformation as info}
                <li class="text-sm">{info}</li>
              {/each}
            </ul>
          </section>

          <!-- Requirements Outline -->
          <section class="mb-6">
            <h4 class="font-medium mb-4 text-brand-white">Requirements Outline</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="rounded-lg p-4 bg-[#151515] shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-shadow duration-300">
                <h5 class="text-sm font-medium mb-3 text-brand-white border-b border-white/10 pb-2">Functional Requirements</h5>
                <ul class="list-disc pl-5 space-y-2 text-brand-white/90">
                  {#each document.requirementsOutline.functional as req}
                    <li class="text-sm hover:text-brand-white transition-colors duration-200">{req}</li>
                  {/each}
                </ul>
              </div>
          
              <div class="rounded-lg bg-[#151515] p-4 shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-shadow duration-300">
                <h5 class="text-sm font-medium mb-3 text-brand-white border-b border-white/10 pb-2">Non-Functional Requirements</h5>
                <ul class="list-disc pl-5 space-y-2 text-brand-white/90">
                  {#each document.requirementsOutline.nonFunctional as req}
                    <li class="text-sm hover:text-brand-white transition-colors duration-200">{req}</li>
                  {/each}
                </ul>
              </div>
            </div>
          </section>

          <!-- Risks -->
          <section class="mb-6">
            <h4 class="font-medium mb-4 text-brand-white">Risks and Mitigation</h4>
            <div class="space-y-2 bg-[#151515] shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-shadow duration-300">
              {#each document.risks as risk}
                <div class="rounded-lg p-3">
                  <p class="text-sm font-medium text-brand-white">{risk.description}</p>
                  <p class="text-sm text-brand-white/70 mt-1">Impact: {risk.impact}</p>
                  <p class="text-sm text-brand-white/70 mt-1">Mitigation: {risk.mitigation}</p>
                </div>
              {/each}
            </div>
          </section>

          <!-- Constraints -->
          <section class="mb-6">
            <h4 class="font-medium mb-2 text-brand-white">Constraints</h4>
            <ul class="list-disc pl-5 space-y-1 text-brand-white/90">
              {#each document.constraints as constraint}
                <li class="text-sm">{constraint}</li>
              {/each}
            </ul>
          </section>

          <!-- Assumptions -->
          <section class="mb-6">
            <h4 class="font-medium mb-2 text-brand-white">Assumptions</h4>
            <ul class="list-disc pl-5 space-y-1 text-brand-white/90">
              {#each document.assumptions as assumption}
                <li class="text-sm">{assumption}</li>
              {/each}
            </ul>
          </section>

          <!-- Dependencies -->
          <section class="mb-6">
            <h4 class="font-medium mb-2 text-brand-white">Dependencies</h4>
            <ul class="list-disc pl-5 space-y-1 text-brand-white/90">
              {#each document.dependencies as dependency}
                <li class="text-sm">{dependency}</li>
              {/each}
            </ul>
          </section>
        </div>
      {/if}
    </div>
    
  </div>
  
  <style>
  
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
  
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(183, 25, 61, 0.3) rgba(7, 7, 7, 0.5);
    }
  
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
  
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(7, 7, 7, 0.5);
      border-radius: 4px;
    }
  
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(183, 25, 61, 0.3);
      border-radius: 4px;
      border: 2px solid rgba(7, 7, 7, 0.5);
    }
  
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: rgba(183, 25, 61, 0.5);
    }

    /* Custom scrollbar for the textarea */
  textarea {
    font-family: inherit;
  }
  
  textarea::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  textarea::-webkit-scrollbar-track {
    background: transparent;
  }

  textarea::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }

  textarea::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }

  /* Auto-resize textarea */
  textarea {
    overflow-y: hidden;
  }
  </style>