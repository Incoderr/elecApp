import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('https://elecserver-production.up.railway.app');
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for incoming messages
    socket.on('message', (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    // Listen for user list updates
    socket.on('userList', (userList) => {
      setUsers(userList);
    });

    // Listen for errors
    socket.on('error', (errorMessage) => {
      setError(errorMessage);
      setTimeout(() => setError(''), 3000);
    });

    return () => {
      socket.off('message');
      socket.off('userList');
      socket.off('error');
    };
  }, [socket]);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle user login
  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim() && socket) {
      socket.emit('join', username.trim());
      setIsLoggedIn(true);
    }
  };

  // Handle sending messages
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      socket.emit('chatMessage', message);
      setMessage('');
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h2>Вход в чат</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Введите имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className='ring-1 ring-black'
            />
            <button type="submit">Войти</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="sidebar">
        <h2>Активные пользователи</h2>
        <ul className="user-list">
          {users.map((user) => (
            <li key={user.id} className="user-item">
              {user.name}
              {user.name === username && " (вы)"}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="chat-main">
        <div className="chat-header">
          <h2>Чат</h2>
          <span>Вы вошли как: <strong>{username}</strong></span>
        </div>
        
        <div className="messages-container">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.user === username ? 'own-message' : msg.user === 'System' ? 'system-message' : ''}`}
            >
              <div className="message-header">
                <span className="message-user">{msg.user === username ? 'Вы' : msg.user}</span>
                <span className="message-time">{formatTimestamp(msg.timestamp)}</span>
              </div>
              <div className="message-text">{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <form className="message-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Введите сообщение..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <button type="submit">Отправить</button>
        </form>
      </div>
    </div>
  );
}

export default App;