<script lang="ts">
   import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import Typewriter from 'svelte-typewriter';
    import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, ChatSession } from '@google/generative-ai';

    interface Message {
    role: 'assistant' | 'user' | 'system';
    content: string;
    isNew?: boolean;
    }

    interface ChatResponse {
    continue: boolean;
    response: string;
    }

    let messages: Message[] = [];
    let input = '';
    let loading = false;
    let showInput = true;
    let chatContainer: HTMLDivElement;
    let isComplete = false;
    let inputRef: HTMLInputElement;
    let chatSession: ChatSession;

    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(API_KEY);

    // ASCII art for completion
    const thankYouAscii = `
    _____ _                 _    __   __          _ 
    |_   _| |__   __ _ _ __ | | __\\ \\ / /__  _   _| |
    | | | '_ \\ / _\` | '_ \\| |/ _ \\ V / _ \\| | | | |
    | | | | | | (_| | | | | |  __/| | (_) | |_| |_|
    |_| |_| |_|\\__,_|_| |_|_|\\___||_|\\___/ \\__,_(_)
                                                    
    We'll be in touch soon to schedule your discovery call!
    `;

    const initialMessage: Message = {
    role: 'assistant',
    content: "👋 Hello! I'm Tracy from TracerLabs. We're excited to learn about your project! To get started, could you tell me a bit about yourself and what brings you here today?",
    isNew: true
    };

    const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash-8b",
    systemInstruction: `You are Tracy, a friendly project requirements assistant for TracerLabs digital agency. Your goal is to have a natural conversation to understand potential clients' needs.

    Required Information to Collect (in any order):
    - Full name
    - Email address (very important)
    - Phone number (very important)
    - Business/Company name (very important)
    - Initial project requirements
    - Budget range (very important)

    Important Guidelines:
    - Keep the conversation natural and friendly
    - Ask ONE question at a time
    - Get to know them and their needs organically
    - Don't rapid-fire questions - let the conversation flow naturally
    - Look for natural opportunities to gather information
    - If you're missing any required information (name, business name, email, phone number and budget) near the end, continue conversation until you have asked for all the required information.

    Once ALL required information is collected, provide a summary in this format:
    "Great chatting with you! Here's what I understand:
    - Name: [their name]
    - Business: [business name]
    - Project: [brief description]
    - Contact: [email] / [phone]
    [optional other details]

    I'll have our team reach out shortly to schedule a discovery call!"

    When ALL required information is collected, set continue to false in the response.
    Otherwise, set it to true and continue the conversation naturally.`
    });

    const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
    responseSchema: {
        type: "object",
        properties: {
        continue: { type: "boolean" },
        response: { type: "string" }
        }
    }
    };

    onMount(async () => {
    chatSession = model.startChat({
        generationConfig,
        history: [
        {
            role: "user",
            parts: [{ text: "Hello" }]
        },
        {
            role: "model",
            parts: [{ text: JSON.stringify({
            continue: true,
            response: initialMessage.content
            })}]
        }
        ]
    });
    
    messages = [initialMessage];
    scrollToBottom();
    focusInput();
    });

    function scrollToBottom() {
    setTimeout(() => {
        if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }, 0);
    }

    function focusInput() {
    if (inputRef && !isComplete) {
        inputRef.focus();
    }
    }

    $: if (chatContainer && messages) {
    scrollToBottom();
    }

    function handleMessageComplete() {
    const index = messages.findIndex(m => m.isNew);
    if (index !== -1) {
        messages[index].isNew = false;
        messages = [...messages];
        showInput = !isComplete;
        focusInput();
    }
    }

    async function parseGeminiResponse(responseText: string): Promise<ChatResponse> {
    try {
        // Remove JSON code block markers if present
        const jsonStr = responseText
        .replace(/```json\n/g, '')
        .replace(/\n```/g, '')
        .trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Error parsing response:', error);
        throw error;
    }
    }

    async function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && input.trim() && !loading && !isComplete) {
        loading = true;
        const userMessage = input.trim();
        input = '';

        messages = [...messages, { role: 'user', content: userMessage, isNew: false }];
        
        try {
        const result = await chatSession.sendMessage(userMessage);
        const responseText = result.response.text();
        const response = await parseGeminiResponse(responseText);
        
        messages = [...messages, { 
            role: 'assistant', 
            content: response.response,
            isNew: true
        }];

        // If conversation is complete
        if (!response.continue) {
            isComplete = true;
            showInput = false;
            
            // Add ASCII art as system message
            messages = [...messages, { 
            role: 'system', 
            content: thankYouAscii, 
            isNew: true 
            }];
            
            // Send lead information
            try {
            await sendLeadInfo({
                conversationHistory: messages
            });
            } catch (error) {
            console.error('Error processing lead:', error);
            }
        }
        } catch (error) {
        console.error('Error in chat:', error);
        messages = [...messages, {
            role: 'assistant',
            content: "I apologize, but I encountered an error. please reach out to subaiyalshk@tracerlabs.io",
            isNew: true
        }];
        }

        loading = false;
    }
    }

    async function sendLeadInfo(data: { conversationHistory: Message[] }) {
    try {
        const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
        });

        if (!response.ok) {
        throw new Error('Failed to send lead information');
        }

        return await response.json();
    } catch (error) {
        console.error('Error sending lead information:', error);
        throw error;
    }
    }
</script>

<main class="h-screen flex flex-col">
    <div class="fakeMenu">
      <div class="fakeButtons fakeClose"></div>
      <div class="fakeButtons fakeMinimize"></div>
      <div class="fakeButtons fakeZoom"></div>
    </div>
  
    <div class="fakeScreen" bind:this={chatContainer}>
      <div class="messages-container">
        {#each messages as message}
          <div class="message-line" transition:fade>
            <p class={message.role === 'system' ? 'ascii-art' : ''}>
              <span class="prompt">
                {message.role === 'assistant' ? 'tracerlabs:~$' : 
                 message.role === 'system' ? '' : 'user:~$'}
              </span>
              {#if message.isNew}
                <Typewriter 
                  interval={30}
                  cursor={true}
                  keepCursorOnFinish={false}
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
      </div>
  
      {#if showInput && !isComplete}
        <div class="input-container">
          <p>
            <span class="prompt">user:~$</span>
            <input
              type="text"
              bind:value={input}
              bind:this={inputRef}
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
        display: flex;
        flex-direction: column;
        overflow: hidden;
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
        width: 100%;
        box-sizing: border-box;
        height: 40px;
        background-color: #bbb;
        border-top-right-radius: 5px;
        border-top-left-radius: 5px;
    }
  
    .fakeScreen {
        background-color: #151515;
        box-sizing: border-box;
        width: 100%;
        flex: 1;
        display: flex;
        flex-direction: column;
        position: relative;
        border-bottom-left-radius: 5px;
        border-bottom-right-radius: 5px;
    }
  
    .messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        padding-bottom: 80px; /* Make room for input */
    }
    .input-container {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: #151515;
        padding: 20px;
        border-top: 1px solid #333;
    }

    .input-container p{
        display: flex;
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

    .ascii-art {
      white-space: pre;
      font-size: 0.7rem;
      color: #00ff00 !important;
      text-align: center;
      padding: 2rem 0;
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
  
    .fakeScreen::-webkit-scrollbar {
      display: none;
    }
    
    .fakeScreen {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  
    :global(.svelte-typewriter-cursor) {
      color: #00ff00 !important;
    }
</style>