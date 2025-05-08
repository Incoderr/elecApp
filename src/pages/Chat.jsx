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
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

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
      document.body.style.overflow = "auto";
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

  // Handle image upload to imgBB
  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(
        `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      if (data.success) {
        return data.data.url;
      }
      throw new Error("Image upload failed");
    } catch (err) {
      setError("Failed to upload image");
      setTimeout(() => setError(""), 3000);
      return null;
    }
  };

  // Check if the message is a valid image URL
  const isImageUrl = (text) => {
    return text.match(/\.(jpeg|jpg|gif|png|webp)$/i) && text.startsWith("http");
  };

  // Handle paste event for images
  const handlePaste = async (e) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image")) {
        e.preventDefault();
        setIsUploading(true);
        const file = item.getAsFile();
        const imageUrl = await handleImageUpload(file);
        setIsUploading(false);

        if (imageUrl && socket) {
          socket.emit("chatMessage", {
            text: "",
            image: imageUrl,
          });
        }
      }
    }
  };

  // Handle sending messages with spam protection
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const currentTime = Date.now();
    const spamDelay = 1000;

    if (currentTime - lastMessageTime < spamDelay) {
      setError("Подождите перед отправкой следующего сообщения");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if ((message.trim() || selectedImage) && socket) {
      let imageUrl = null;
      if (selectedImage) {
        setIsUploading(true);
        imageUrl = await handleImageUpload(selectedImage);
        setIsUploading(false);
      } else if (isImageUrl(message.trim())) {
        imageUrl = message.trim();
      }

      socket.emit("chatMessage", {
        text: imageUrl ? "" : message,
        image: imageUrl,
      });

      setMessage("");
      setSelectedImage(null);
      setLastMessageTime(currentTime);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle Enter key press for sending messages
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Handle image selection
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
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
                {msg.text && <span className="break-words">{msg.text}</span>}
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="Chat image"
                    className="max-w-xs mt-2 rounded-md"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="p-2 flex flex-col gap-2" onSubmit={handleSendMessage}>
          <div className="flex">
            <textarea
              ref={textareaRef}
              placeholder="Введите сообщение или вставьте URL изображения..."
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              maxLength={2000}
              disabled={isUploading}
              className="p-2 bg-[#222327] mr-2 max-h-60 rounded-md w-full resize-none overflow-hidden leading-tight"
              rows={1}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
            />
            <button
              type="submit"
              disabled={isUploading}
              className="bg-blue-600 p-2 rounded-md disabled:bg-gray-500"
            >
              {isUploading ? "Загрузка..." : "Отправить"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isUploading}
              className="text-white"
            />
            {selectedImage && (
              <span className="text-sm text-gray-400">
                {selectedImage.name}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;