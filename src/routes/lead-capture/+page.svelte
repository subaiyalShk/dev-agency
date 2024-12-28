<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import Typewriter from 'svelte-typewriter';
    import { GoogleGenerativeAI } from '@google/generative-ai';
  
    interface Message {
      role: 'assistant' | 'user';
      content: string;
      isNew?: boolean;
    }
  
    interface LeadInfo {
      email?: string;
      firstName?: string;
      lastName?: string;
      company?: string;
      projectGoal?: string;
      timeline?: string;
      budget?: string;
      techPreferences?: string;
      agencyExperience?: string;
    }
  
    let messages: Message[] = [];
    let input = '';
    let loading = false;
    let showInput = false;
    let chatContainer: HTMLDivElement;
    let leadInfo: LeadInfo = {};
    let isCollectingEmail = false;
  
    const HUBSPOT_API_KEY = import.meta.env.VITE_HUBSPOT_API_KEY;
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(API_KEY);
  
    const initialMessage: Message = {
      role: 'assistant',
      content: "Welcome to TracerLabs! We're a digital innovation agency specializing in web apps, mobile development, and cybersecurity solutions. How can we help?",
      isNew: true
    };
  
    onMount(() => {
      messages = [initialMessage];
      scrollToBottom();
    });
  
    $: if (chatContainer && messages) {
      scrollToBottom();
    }
  
    function scrollToBottom() {
      setTimeout(() => {
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 0);
    }
  
    // Add message completion handler
    function handleMessageComplete() {
      // Mark the current message as not new
      const index = messages.findIndex(m => m.isNew);
      if (index !== -1) {
        messages[index].isNew = false;
        messages = [...messages]; // Trigger reactivity
        showInput = true;
      }
    }
  
    // Add keypress handler
    async function handleKeyPress(event: KeyboardEvent) {
      if (event.key === 'Enter' && input.trim() && !loading) {
        const userMessage = input.trim();
        input = '';
        showInput = false;
  
        // Add user message (no typing animation needed)
        messages = [...messages, { role: 'user', content: userMessage, isNew: false }];
        
        const response = await getAIResponse(userMessage);
        // Add AI message with typing animation
        messages = [...messages, { 
          role: 'assistant', 
          content: response.content,
          isNew: true
        }];
  
        if (response.final) {
          showInput = false;
        }
      }
    }
  
    async function createHubSpotContact(leadInfo: LeadInfo) {
      try {
        const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`
          },
          body: JSON.stringify({
            properties: {
              email: leadInfo.email,
              firstname: leadInfo.firstName,
              lastname: leadInfo.lastName,
              company: leadInfo.company,
              project_goal: leadInfo.projectGoal,
              timeline: leadInfo.timeline,
              budget: leadInfo.budget,
              technology_preferences: leadInfo.techPreferences,
              agency_experience: leadInfo.agencyExperience
            }
          })
        });
  
        if (!response.ok) {
          throw new Error('Failed to create HubSpot contact');
        }
  
        const deal = await createHubSpotDeal(leadInfo);
        return deal;
      } catch (error) {
        console.error('Error creating HubSpot contact:', error);
        throw error;
      }
    }
  
    async function createHubSpotDeal(leadInfo: LeadInfo) {
      try {
        const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`
          },
          body: JSON.stringify({
            properties: {
              dealname: `${leadInfo.company || 'New Lead'} - ${leadInfo.projectGoal || 'Project Inquiry'}`,
              pipeline: 'default',
              dealstage: 'appointmentscheduled',
              amount: leadInfo.budget,
              project_description: leadInfo.projectGoal
            }
          })
        });
  
        if (!response.ok) {
          throw new Error('Failed to create HubSpot deal');
        }
  
        return await response.json();
      } catch (error) {
        console.error('Error creating HubSpot deal:', error);
        throw error;
      }
    }
  
    function extractLeadInfo(messages: Message[]): void {
      // Use the conversation to update leadInfo
      messages.forEach(msg => {
        if (msg.role === 'user') {
          // Extract project goal
          if (msg.content.toLowerCase().includes('project') || msg.content.toLowerCase().includes('goal')) {
            leadInfo.projectGoal = msg.content;
          }
          // Extract timeline
          else if (msg.content.toLowerCase().includes('timeline') || msg.content.toLowerCase().includes('deadline')) {
            leadInfo.timeline = msg.content;
          }
          // Extract budget
          else if (msg.content.toLowerCase().includes('budget') || msg.content.toLowerCase().includes('cost')) {
            leadInfo.budget = msg.content;
          }
          // Extract tech preferences
          else if (msg.content.toLowerCase().includes('tech') || msg.content.toLowerCase().includes('platform')) {
            leadInfo.techPreferences = msg.content;
          }
          // Extract agency experience
          else if (msg.content.toLowerCase().includes('agency') || msg.content.toLowerCase().includes('experience')) {
            leadInfo.agencyExperience = msg.content;
          }
        }
      });
    }
  
    function parseEmailFromMessage(message: string): string | null {
      const emailRegex = /[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}/;
      const match = message.match(emailRegex);
      return match ? match[0] : null;
    }
  
    async function getAIResponse(userInput: string) {
      loading = true;
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-pro",
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.8,
            maxOutputTokens: 200,
          },
        });
  
        if (isCollectingEmail) {
          const email = parseEmailFromMessage(userInput);
          if (email) {
            leadInfo.email = email;
            isCollectingEmail = false;
            try {
              await createHubSpotContact(leadInfo);
              return {
                content: "Thanks! I've scheduled a discovery call. You'll receive an email with the details shortly. Looking forward to discussing your project!",
                final: true
              };
            } catch (error) {
              console.error('Error creating HubSpot lead:', error);
              return {
                content: "I apologize, but I encountered an issue scheduling the call. Please try again or reach out to us directly.",
                final: true
              };
            }
          } else {
            return {
              content: "I didn't catch a valid email address. Could you please provide your email so I can schedule the call?",
              final: false
            };
          }
        }
  
        const chat = model.startChat({
          history: [{
            role: 'user',
            parts: [{ text: `You are a friendly project requirements assistant for TracerLabs digital agency. Your goal is to understand what kind of help potential clients need, you are allowed to deviate a little to build rapport with the client but come back to main questions and then finally booking them a call.
  
  Keep the conversation light and surface-level - we just want to understand their basic needs before scheduling a call.
  
  Ask ONE question at a time about:
  - Their project goal/challenge
  - Timeline expectations
  - Technology preferences (if any)
  - Budget range
  - Past experience with agencies
  
  Keep responses short and conversational. After 4-5 questions, suggest scheduling a discovery call.
  
  Current conversation history for context:
  ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`}]
          }]
        });
  
        if (messages.length > 8) {
          isCollectingEmail = true;
          extractLeadInfo(messages);
          return {
            content: "Great! I have a good understanding of your project. Could you please share your email address so I can schedule a discovery call?",
            final: false
          };
        }
  
        const result = await chat.sendMessage(userInput);
        const response = result.response.text();
        
        return {
          content: response,
          final: false
        };
      } finally {
        loading = false;
      }
    }
  </script>
  
  
  <main>
    <div class="fakeMenu">
      <div class="fakeButtons fakeClose"></div>
      <div class="fakeButtons fakeMinimize"></div>
      <div class="fakeButtons fakeZoom"></div>
    </div>
  
    <div class="fakeScreen" bind:this={chatContainer}>
      {#each messages as message}
        <div class="message-line" transition:fade>
          <p>
            <span class="prompt">
              {message.role === 'assistant' ? 'tracerlabs:~$' : 'user:~$'}
            </span>
            {#if message.isNew}
              <Typewriter 
                interval={30}
                cursor={true}
                keepCursorOnFinish={true}
                mode="cascade"
                on:done={handleMessageComplete}
              >
                {message.content}
              </Typewriter>
            {:else}
              {message.content}
            {/if}
          </p>
        </div>
      {/each}
  
      {#if loading}
        <div class="message-line" transition:fade>
          <p>
            <span class="prompt">system:~$</span>
            <span class="loading-dots"></span>
            Processing...
          </p>
        </div>
      {/if}
  
      {#if showInput}
        <div class="message-line">
          <p>
            <span class="prompt">user:~$</span>
            <input
              type="text"
              bind:value={input}
              on:keypress={handleKeyPress}
              placeholder="Type your message..."
              class="terminal-input"
            />
          </p>
        </div>
      {/if}
    </div>
  </main>
  
  <style>
    main {
      height: 100vh;
    }
  
    .fakeButtons {
      height: 10px;
      width: 10px;
      border-radius: 50%;
      border: 1px solid #000;
      position: relative;
      top: 6px;
      left: 6px;
      background-color: #ff3b47;
      border-color: #9d252b;
      display: inline-block;
    }
  
    .fakeMinimize {
      left: 11px;
      background-color: #ffc100;
      border-color: #9d802c;
    }
  
    .fakeZoom {
      left: 16px;
      background-color: #00d742;
      border-color: #049931;
    }
  
    .fakeMenu {
      position: fixed;
      width: 100vw;
      box-sizing: border-box;
      height: 40px;
      background-color: #bbb;
      margin: 0 auto;
      border-top-right-radius: 5px;
      border-top-left-radius: 5px;
    }
  
    .fakeScreen {
      background-color: #151515;
      box-sizing: border-box;
      width: 100vw;
      height: 100%;
      max-height: 100%;
      overflow: scroll;
      margin: 0 auto;
      padding: 20px;
      padding-top: 60px;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
    }
  
    .message-line {
      display: flex;
      margin-bottom: 1rem;
    }
  
    .message-line p {
      color: white;
      font-family: monospace;
      font-size: 0.75rem;
      margin: 0;
      flex: 1;
    }
  
    .prompt {
      color: #00ff00;
      font-family: monospace;
      margin-right: 0.5rem;
      white-space: nowrap;
    }
  
    .terminal-input {
      background: transparent;
      border: none;
      color: white;
      font-family: monospace;
      font-size: 0.75rem;
      width: 100%;
      outline: none;
      margin-left: 0.5rem;
    }
  
    .terminal-input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
  
    /* Loading animation */
    .loading-dots {
      display: inline-block;
      margin-right: 0.5rem;
    }
  
    .loading-dots:after {
      content: '.';
      animation: dots 1.5s steps(5, end) infinite;
    }
  
    @keyframes dots {
      0%, 20% { content: '.'; }
      40% { content: '..'; }
      60% { content: '...'; }
      80%, 100% { content: ''; }
    }
  
    /* Hide scrollbar */
    .fakeScreen::-webkit-scrollbar {
      display: none;
    }
    
    .fakeScreen {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  
    /* Fix typewriter cursor */
    :global(.svelte-typewriter-cursor) {
      color: #00ff00 !important;
    }
  </style>