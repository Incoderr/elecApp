<script>
    import { onMount, onDestroy } from 'svelte';
    import io from 'socket.io-client';
  
    export let socket;
    let messages = [];
    let message = '';
  
    onMount(() => {
      socket.on('message', (msg) => {
        messages = [...messages, msg];
      });
  
      const messagesDiv = document.querySelector('.messages');
      const observer = new MutationObserver(() => {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      });
      observer.observe(messagesDiv, { childList: true });
  
      return () => {
        socket.off('message');
        observer.disconnect();
      };
    });
  
    function sendMessage() {
      if (message.trim()) {
        socket.emit('chatMessage', message);
        message = '';
      }
    }
  </script>
  
  <div class="chattab">
    <div class="messages">
      {#each messages as msg}
        <div class="message {msg.user === 'System' ? 'system' : ''}">
          <span class="user">{msg.user}</span>
          <span class="text">{msg.text}</span>
          <span class="timestamp">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </span>
        </div>
      {/each}
    </div>
    <div class="input-section">
      <input
        type="text"
        bind:value={message}
        placeholder="Type your message..."
        on:keydown={(e) => e.key === 'Enter' && sendMessage()}
      />
      <button on:click={sendMessage}>Send</button>
    </div>
  </div>
  
  <style>
    .chattab {
      display: flex;
      flex-direction: column;
      padding: 15px;
      outline: solid 1px rgba(255, 255, 255, 0.411);
      border-radius: 10px;
      width: 450px;
      height: 550px;
      background: #3d3d3d;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      
      background: #5c5c5c;
      border-radius: 5px;
      margin-bottom: 10px;
    }
    .message {
      display: flex;
      flex-wrap: wrap;
      padding: 8px;
      margin: 5px 0;
      border-radius: 5px;
    }
    .system {
      background: #e9ecef;
      font-style: italic;
    }
    .user {
      font-weight: bold;
      color: #007bff;
      margin-right: 8px;
    }
    .text {
      flex: 1;
      color: white;
    }
    .timestamp {
      font-size: 0.75em;
      color: #888;
      margin-left: 10px;
    }
    .input-section {
      display: flex;
      gap: 8px;
    }
    input {
      flex: 1;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 14px;
    }
    button {
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    }
    button:hover {
      background-color: #0056b3;
    }
  </style>