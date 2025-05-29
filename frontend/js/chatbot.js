document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");

  // Function to append a message to the chat box
  const appendMessage = (message, sender) => {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    messageDiv.classList.add(
      sender === "user" ? "user-message" : "bot-message"
    );

    if (sender === "bot") {
      // Parse Markdown content for bot messages
      messageDiv.innerHTML = marked.parse(message);
    } else {
      messageDiv.innerHTML = `<p>${message}</p>`; // User messages are plain text
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the bottom
  };

  // Store chat history (messages exchanged) for the LLM API
  let chatHistory = [];

  // Function to send message to backend /chat endpoint
  const sendMessage = async () => {
    const message = userInput.value.trim();
    if (message === "") return;

    appendMessage(message, "user");
    chatHistory.push({ role: "user", content: message });
    userInput.value = ""; // Clear input field

    try {
      // Indicate loading
      appendMessage("Bot is typing...", "bot");
      const loadingMessage = chatBox.lastChild; // Get the "Bot is typing..." message

      const response = await fetch("http://127.0.0.1:8000/chat", {
        // Adjust URL if your backend is on a different port
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: message, history: chatHistory }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      const botResponse = data.response;

      // Replace loading message with actual response
      chatBox.removeChild(loadingMessage);
      appendMessage(botResponse, "bot"); // This will now parse the Markdown
      chatHistory.push({ role: "assistant", content: botResponse });
    } catch (error) {
      console.error("Error sending message to chatbot:", error);
      // Replace loading message with error message or append a new one
      const loadingMessage = chatBox.lastChild;
      if (
        loadingMessage &&
        loadingMessage.textContent.includes("Bot is typing...")
      ) {
        chatBox.removeChild(loadingMessage);
      }
      appendMessage(
        "Oops! Something went wrong. Please try again later. If the issue persists, check the backend server.",
        "bot"
      );
    }
  };

  // Event Listeners
  sendButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  });
});
