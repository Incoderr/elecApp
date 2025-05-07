<script>
  import { onMount, onDestroy } from "svelte";
  import io from "socket.io-client";

  export let socket;
  let users = [];
  let username = "";
  let error = "";

  onMount(() => {
    // Update user list when received from server
    socket.on("userList", (userList) => {
      users = userList;
    });

    // Handle error messages from server
    socket.on("error", (msg) => {
      error = msg;
      setTimeout(() => (error = ""), 3000);
    });

    return () => {
      socket.off("userList");
      socket.off("error");
    };
  });

  function joinChat() {
    if (username.trim()) {
      socket.emit("join", username);
      username = "";
    }
  }
</script>

<div class="usertab">
  {#if error}
    <p class="error">{error}</p>
  {/if}
  <div class="join-section">
    <input
      type="text"
      bind:value={username}
      placeholder="Enter your username"
      on:keydown={(e) => e.key === "Enter" && joinChat()}
    />
    <button on:click={joinChat}>Join Chat</button>
  </div>
  <h3>Current Chat Participants ({users.length})</h3>
  {#if users.length === 0}
    <p class="empty">No users in chat yet</p>
  {:else}
    <ul>
      {#each users as user}
        <li>
          <span class="user-name">{user.name}</span>
          <span class="online-indicator"></span>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .usertab {
    display: flex;
    flex-direction: column;
    padding: 15px;
    outline: solid 1px rgba(255, 255, 255, 0.411);
    border-radius: 10px;
    min-width: 220px;
    background: #3d3d3d;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .join-section {
    display: flex;
    gap: 8px;
    margin-bottom: 15px;
  }
  input {
    flex: 1;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 14px;
  }
  button {
    padding: 8px 12px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
  }
  button:hover {
    background-color: #218838;
  }
  h3 {
    margin: 10px 0;
    font-size: 16px;
    color: white;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 400px;
    overflow-y: auto;
  }
  li {
    display: flex;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid #eee;
    color: white;
  }
  .user-name {
    flex: 1;
  }
  .online-indicator {
    width: 10px;
    height: 10px;
    background-color: #28a745;
    border-radius: 50%;
    margin-left: 8px;
  }
  .error {
    color: #dc3545;
    font-size: 12px;
    margin-bottom: 10px;
  }
  .empty {
    color: #666;
    font-style: italic;
    text-align: center;
    margin: 10px 0;
  }
</style>
