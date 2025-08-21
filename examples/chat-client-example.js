// Chat Client Example
// This file demonstrates how to use the chat API and WebSocket functionality

// Configuration
const API_BASE_URL = "http://localhost:3001/api";
const SOCKET_URL = "http://localhost:3001";

// Chat API Client Class
class ChatClient {
  constructor(token) {
    this.token = token;
    this.socket = null;
    this.currentBookingId = null;
    this.messageHandlers = new Map();
    this.typingUsers = new Set();
  }

  // Initialize WebSocket connection
  connect() {
    this.socket = io(SOCKET_URL, {
      auth: {
        token: this.token,
      },
    });

    this.setupSocketListeners();
  }

  // Setup WebSocket event listeners
  setupSocketListeners() {
    this.socket.on("connect", () => {
      console.log("Connected to chat server");
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from chat server");
    });

    this.socket.on("new_message", (data) => {
      this.handleNewMessage(data);
    });

    this.socket.on("typing_start", (data) => {
      this.handleTypingStart(data);
    });

    this.socket.on("typing_stop", (data) => {
      this.handleTypingStop(data);
    });

    this.socket.on("messages_read", (data) => {
      this.handleMessagesRead(data);
    });

    this.socket.on("location_updated", (data) => {
      this.handleLocationUpdate(data);
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  }

  // Join a specific booking chat room
  joinBookingChat(bookingId) {
    if (this.currentBookingId) {
      this.socket.emit("leave_room", { bookingId: this.currentBookingId });
    }

    this.currentBookingId = bookingId;
    this.socket.emit("join_room", { bookingId });
    console.log(`Joined chat room for booking: ${bookingId}`);
  }

  // Send a text message
  async sendMessage(bookingId, message) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          bookingId,
          message,
          messageType: "text",
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Message sent successfully:", data.data);
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  }

  // Send a location message
  async sendLocation(bookingId, latitude, longitude, address = "") {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          bookingId,
          location: {
            latitude,
            longitude,
            address,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Location sent successfully");
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Failed to send location:", error);
      throw error;
    }
  }

  // Send typing indicator
  sendTypingIndicator(bookingId, isTyping) {
    if (this.socket) {
      this.socket.emit(isTyping ? "typing_start" : "typing_stop", {
        bookingId,
      });
    }
  }

  // Get chat history
  async getChatHistory(bookingId, limit = 50, before = null) {
    try {
      let url = `${API_BASE_URL}/chat/messages/${bookingId}?limit=${limit}`;
      if (before) {
        url += `&before=${before}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Failed to get chat history:", error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(messageIds) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/messages/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ messageIds }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Messages marked as read");
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
      throw error;
    }
  }

  // Get recent conversations
  async getRecentConversations() {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Failed to get conversations:", error);
      throw error;
    }
  }

  // Get unread count
  async getUnreadCount(bookingId = null) {
    try {
      let url = `${API_BASE_URL}/chat/unread-count`;
      if (bookingId) {
        url += `?bookingId=${bookingId}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        return data.data.unreadCount;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Failed to get unread count:", error);
      throw error;
    }
  }

  // Get online status
  async getOnlineStatus(bookingId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/chat/online-status/${bookingId}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Failed to get online status:", error);
      throw error;
    }
  }

  // Event handlers
  handleNewMessage(data) {
    console.log("New message received:", data);
    // Emit custom event for UI updates
    this.emit("new_message", data);
  }

  handleTypingStart(data) {
    console.log("User started typing:", data);
    this.typingUsers.add(data.userId);
    this.emit("typing_start", data);
  }

  handleTypingStop(data) {
    console.log("User stopped typing:", data);
    this.typingUsers.delete(data.userId);
    this.emit("typing_stop", data);
  }

  handleMessagesRead(data) {
    console.log("Messages marked as read:", data);
    this.emit("messages_read", data);
  }

  handleLocationUpdate(data) {
    console.log("Location updated:", data);
    this.emit("location_updated", data);
  }

  // Event emitter methods
  on(event, handler) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Usage Example
async function example() {
  // Replace with actual JWT token
  const token = "your-jwt-token-here";
  const chatClient = new ChatClient(token);

  // Connect to WebSocket
  chatClient.connect();

  // Wait for connection
  setTimeout(async () => {
    try {
      // Join a specific booking chat
      const bookingId = "507f1f77bcf86cd799439011";
      chatClient.joinBookingChat(bookingId);

      // Send a message
      await chatClient.sendMessage(bookingId, "Hello! When will you arrive?");

      // Get chat history
      const messages = await chatClient.getChatHistory(bookingId);
      console.log("Chat history:", messages);

      // Get recent conversations
      const conversations = await chatClient.getRecentConversations();
      console.log("Recent conversations:", conversations);

      // Get unread count
      const unreadCount = await chatClient.getUnreadCount();
      console.log("Unread messages:", unreadCount);

      // Listen for new messages
      chatClient.on("new_message", (message) => {
        console.log("New message in UI:", message);
        // Update UI here
      });

      // Listen for typing indicators
      chatClient.on("typing_start", (data) => {
        console.log("Show typing indicator for:", data.userId);
        // Show typing indicator in UI
      });

      // Send typing indicator
      chatClient.sendTypingIndicator(bookingId, true);

      // Stop typing indicator after 2 seconds
      setTimeout(() => {
        chatClient.sendTypingIndicator(bookingId, false);
      }, 2000);
    } catch (error) {
      console.error("Example error:", error);
    }
  }, 1000);
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ChatClient;
}

// Run example if this file is executed directly
if (typeof window === "undefined" && require.main === module) {
  example();
}
