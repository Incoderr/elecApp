<script>
    import { onMount } from 'svelte';
    import io from 'socket.io-client';
    import Users from './components/Users.svelte';
    import Chat from './components/Chat.svelte';
  
    let socket;
  
    onMount(() => {
      socket = io('http://localhost:3000');
      return () => socket.disconnect();
    });
  </script>
  
  <div class="home">
    <Users {socket} />
    <Chat {socket} />
  </div>
  
  <style>
    .home {
      flex-direction: row;
      display: flex;
      gap: 1.5rem;
      font-size: larger;
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }
  </style>