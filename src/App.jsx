import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

function App() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io("https://elecserver-production.up.railway.app");
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("message", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socket.on("userList", (userList) => {
      setUsers(userList);
    });

    socket.on("error", (errorMessage) => {
      setError(errorMessage);
      setTimeout(() => setError(""), 3000);
    });

    return () => {
      socket.off("message");
      socket.off("userList");
      socket.off("error");
    };
  }, [socket]);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Disable page scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto"; // Restore on unmount
    };
  }, []);

  // Handle user login
  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim() && socket) {
      socket.emit("join", username.trim());
      setIsLoggedIn(true);
    }
  };

  // Handle sending messages
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket) {
      socket.emit("chatMessage", message);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  // Handle Enter key press for sending messages
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent adding new line
      handleSendMessage(e); // Send message
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-3 bg-white rounded-md w-80">
          <h2 className="mb-4 text-center text-2xl text-black">Вход в чат</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleLogin} className="flex flex-col">
            <input
              type="text"
              placeholder="Введите имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-gray-700 text-white rounded-md p-2 mb-2 w-full"
            />
            <button
              type="submit"
              className="bg-blue-500 cursor-pointer text-white rounded-md p-2 w-full"
            >
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#1a1a1e]">
      <div className="border-r border-white/20 p-3 flex flex-col min-h-screen">
        <h2 className="mb-2 text-lg">Активные пользователи</h2>
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.name}
              {user.name === username && " (вы)"}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex w-full flex-col">
        <div className="p-3 bg-gray-600 flex items-center justify-between">
          <h2>Чат</h2>
          <span>
            Вы вошли как: <strong>{username}</strong>
          </span>
        </div>

        <div className="p-4 flex flex-col gap-2 grow max-h-[calc(100vh-120px)] overflow-y-auto">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.user === username
                  ? ""
                  : msg.user === "System"
                  ? "Systemmes"
                  : ""
              }`}
            >
              <div>
                <span className="text-xl">{msg.user}</span>
                <span className="text-[12px] ml-2">
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
              <div className="px-4">
                <span className="break-words">{msg.text}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="p-2 flex" onSubmit={handleSendMessage}>
          <textarea
            ref={textareaRef}
            placeholder="Введите сообщение..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown} // Add keydown handler
            required
            className="p-2 bg-[#222327] mr-2 max-h-60 rounded-md w-full resize-none overflow-hidden leading-tight"
            rows={1}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
          />
          <button type="submit" className="bg-blue-600 p-2 rounded-md">
            Отправить
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;