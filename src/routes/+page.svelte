<script>
    import { onMount } from "svelte";
  
    let userId = "user1"; 
    let message = "";
    let chatHistory = /** @type {{ role: string, content: string }[]} */ ([]);
  
    // Fetch conversation history when the component mounts
    onMount(async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/history?userId=${userId}`);
        const data = await res.json();
        if (data.history) {
          chatHistory = data.history;
        }
      } catch (error) {
        console.error("Error fetching history:", error);
        chatHistory = [...chatHistory, { role: "assistant", content: "Error: Could not load chat history" }];
      }
    });
  
    async function sendMessage() {
      if (!message.trim()) return;
  
      // Add user message to chat history
      chatHistory = [...chatHistory, { role: "user", content: message }];
  
      try {
        const res = await fetch("http://localhost:3001/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, message }),
        });
        const data = await res.json();
  
        if (data.response) {
          chatHistory = [...chatHistory, { role: "assistant", content: data.response }];
        } else {
          chatHistory = [...chatHistory, { role: "assistant", content: `Error: ${data.error || 'Unknown error'}` }];
        }
      } catch (error) {
        console.error("Fetch error:", error);
        chatHistory = [...chatHistory, { role: "assistant", content: "Error: Could not connect to server" }];
      }
  
      message = ""; // Clear input
    }
  </script>
  
  <!-- Messenger App Container -->
  <div class="flex flex-col h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
      <div class="flex items-center">
        <div class="w-10 h-10 bg-transparent rounded-full mr-3">
          <img src="/static/robot.png" alt="Robot Icon" class="w-full h-full object-cover" />
        </div>
        <h1 class="text-xl font-semibold">AI Chat with Grok</h1>
      </div>
</header>
  
    <!-- Chat Window -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4" style="scroll-behavior: smooth;">
      {#each chatHistory as msg}
        <div class={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            class={`max-w-xs lg:max-w-md p-3 rounded-lg ${msg.role === "user"
              ? "bg-blue-500 text-white"
              : "bg-white text-gray-800"} shadow-md`}
          >
            {msg.content}
          </div>
        </div>
      {/each}
    </div>
  
    <!-- Input Area -->
    <div class="p-4 bg-white border-t shadow-md">
      <form on:submit|preventDefault={sendMessage} class="flex items-center gap-2">
        <input
          type="text"
          bind:value={message}
          placeholder="Type a message..."
          class="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          class="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition duration-200"
        >
          Send
        </button>
      </form>
    </div>
  </div>    
  
  <style>
    /* Custom scrollbar for the chat window */
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
  </style>