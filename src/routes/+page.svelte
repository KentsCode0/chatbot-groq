<script>
  // @ts-nocheck
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import robotAssistant from "../asset/robot-assistant.gif";

  // State management with stores
  const chatHistory = writable([]);
  let message = "";
  let isChatOpen = false;
  let isEmojiPickerOpen = false;
  let chatWindow; // DOM reference for the chat container

  // Constants
  const USER_ID = "user1";
  const API_BASE_URL = "http://localhost:3000/api";
  const LIKE_SYMBOL = "👍";
  const ERROR_MESSAGE = "Error: Could not connect to server";

  // Reactive scroll position
  let scrollPosition = 0;

  // Svelte action to scroll to bottom when chatHistory changes
  function autoScroll(node) {
    const updateScroll = () => {
      node.scrollTop = node.scrollHeight;
    };
    chatHistory.subscribe(() => {
      requestAnimationFrame(updateScroll);
    });
    return { destroy: () => {} }; // Cleanup if needed
  }

  // Fetches initial chat history on mount
  onMount(async () => {
    console.log("onMount: Component mounted, fetching chat history...");
    await import("emoji-picker-element");

    try {
      const response = await fetch(`${API_BASE_URL}/history?userId=${USER_ID}`);
      const data = await response.json();
      if (data.history) {
        console.log("onMount: Chat history fetched:", data.history);
        chatHistory.set(data.history);
      }
    } catch (error) {
      console.error("onMount: Failed to fetch chat history:", error);
      appendErrorMessage("Error: Could not load chat history");
    }
  });

  // Handles sending messages or likes
  async function handleSend() {
    console.log("handleSend: Sending message:", message);
    const newMessages = [];
    const content = message.trim() || (chatHistory.length > 0 ? LIKE_SYMBOL : "");
    if (!content) return;

    newMessages.push({ role: "user", content });

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: USER_ID, message: content }),
      });
      const data = await response.json();
      console.log("handleSend: Response received:", data);
      newMessages.push({ role: "assistant", content: data.response || `Error: ${data.error || "Unknown error"}` });
    } catch (error) {
      console.error("handleSend: Fetch error:", error);
      newMessages.push({ role: "assistant", content: ERROR_MESSAGE });
    }

    appendMessages(newMessages);
    message = "";
  }

  // Appends new messages to chatHistory store
  function appendMessages(messages) {
    if (messages.length === 0) return;
    console.log("appendMessages: Adding to chatHistory:", messages);
    chatHistory.update(current => [...current, ...messages]);
  }

  // Appends an error message to chatHistory
  function appendErrorMessage(content) {
    appendMessages([{ role: "assistant", content }]);
  }

  // Adds selected emoji to the message input
  function handleEmojiSelect(event) {
    console.log("handleEmojiSelect: Emoji selected:", event.detail.unicode);
    message += event.detail.unicode;
    isEmojiPickerOpen = false;
  }
</script>

<!-- Chat Application Layout -->
<div class="flex flex-col h-screen bg-gray-100">
  <!-- Header -->
  <header class="bg-blue-500 text-white p-4 flex items-center shadow-md">
    <div class="flex items-center">
      <div class="w-10 h-10 rounded-full mr-3 overflow-hidden">
        <img src={robotAssistant} alt="Robot Assistant" class="w-full h-full object-cover" />
      </div>
      <h1 class="text-xl font-semibold">Groqie</h1>
    </div>
  </header>

  <!-- Chat Window -->
  <section
    bind:this={chatWindow}
    use:autoScroll
    class="flex-1 overflow-y-auto p-4 space-y-4"
    style="scroll-behavior: smooth;"
  >
    {#each $chatHistory as msg}
      <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
        <div
          class="max-w-xs lg:max-w-md p-3 rounded-lg shadow-md {msg.role === 'user'
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-800'}"
        >
          {msg.content}
        </div>
      </div>
    {/each}
  </section>

  <!-- Input Area -->
  <footer class="p-4 bg-white border-t shadow-md">
    <form on:submit|preventDefault={handleSend} class="flex items-center gap-2 relative">
      <input
        type="text"
        bind:value={message}
        placeholder="Type a message..."
        class="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        class="text-2xl mr-2"
        on:click={() => (isEmojiPickerOpen = !isEmojiPickerOpen)}
      >
        😊
      </button>
      <emoji-picker
        class="absolute bottom-12 right-4"
        style={isEmojiPickerOpen ? "display: block" : "display: none"}
        on:emoji-click={handleEmojiSelect}
      ></emoji-picker>
      <button
        type="submit"
        class="p-2 rounded-lg transition duration-200 flex items-center justify-center {message.trim()
          ? 'bg-blue-500 text-white hover:bg-blue-600'
          : 'bg-gray-300 text-gray-700 animate-pulse'}"
      >
        {#if message.trim()}
          Send
        {:else}
          👍
        {/if}
      </button>
    </form>
  </footer>
</div>

<style>
  .flex-1::-webkit-scrollbar {
    width: 6px;
  }
  .flex-1::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }
  .flex-1::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  emoji-picker {
    --emoji-size: 24px;
    --background: #fff;
    --border: 1px solid #ccc;
    z-index: 10;
  }
</style>