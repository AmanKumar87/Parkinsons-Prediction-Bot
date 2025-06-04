// // document.addEventListener("DOMContentLoaded", () => {
// //   const chatBox = document.getElementById("chat-box");
// //   const userInput = document.getElementById("user-input");
// //   const sendButton = document.getElementById("send-button");

// //   const appendMessage = (message, sender) => {
// //     const messageDiv = document.createElement("div");
// //     messageDiv.classList.add("message");
// //     messageDiv.classList.add(
// //       sender === "user" ? "user-message" : "bot-message"
// //     );

// //     // Markdown parsing for bot messages
// //     if (sender === "bot") {
// //       messageDiv.innerHTML = marked.parse(message);
// //     } else {
// //       messageDiv.innerHTML = `<p>${message}</p>`;
// //     }

// //     chatBox.appendChild(messageDiv);
// //     chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the bottom
// //   };

// //   let chatHistory = []; // Stores conversation history for LLM

// //   const sendMessageToLLM = async (messageText) => {
// //     // Show typing indicator
// //     appendMessage("Bot is typing...", "bot");
// //     const loadingMessageDiv = chatBox.lastElementChild; // Get the "Bot is typing..." div

// //     try {
// //       console.log("Sending POST request to /chat...");
// //       const response = await fetch("http://127.0.0.1:8000/chat", {
// //         method: "POST",
// //         headers: {
// //           "Content-Type": "application/json",
// //         },
// //         body: JSON.stringify({ message: messageText, history: chatHistory }),
// //       });

// //       if (!response.ok) {
// //         const errorData = await response.json();
// //         throw new Error(
// //           errorData.detail || `HTTP error! status: ${response.status}`
// //         );
// //       }

// //       const data = await response.json();
// //       const botResponse = data.response;

// //       // Remove typing indicator and display actual message
// //       if (loadingMessageDiv) {
// //         chatBox.removeChild(loadingMessageDiv);
// //       }
// //       appendMessage(botResponse, "bot");
// //       chatHistory.push({ role: "assistant", content: botResponse }); // Add bot's response to history
// //     } catch (error) {
// //       console.error("Error communicating with chatbot backend:", error);
// //       if (loadingMessageDiv) {
// //         chatBox.removeChild(loadingMessageDiv);
// //       }
// //       appendMessage(
// //         "Oops! I couldn't connect or something went wrong. Please try again later. If the issue persists, ensure the backend server is running.",
// //         "bot"
// //       );
// //     }
// //   };

// //   // Handler for user input via text field or Enter key
// //   const handleUserInput = () => {
// //     const message = userInput.value.trim();
// //     if (message === "") return;

// //     appendMessage(message, "user"); // Display user's message
// //     chatHistory.push({ role: "user", content: message }); // Add user's message to history
// //     userInput.value = ""; // Clear input field

// //     sendMessageToLLM(message); // Send to LLM backend
// //   };

// //   // --- Initial Load Logic & Prediction Summary Trigger ---
// //   const initializeChatbot = () => {
// //     const triggerSummary = localStorage.getItem("triggerChatbotSummary");
// //     const predictionData = JSON.parse(
// //       localStorage.getItem("parkinsonsPrediction")
// //     );

// //     console.log("Chatbot Initializing...");
// //     console.log("localStorage triggerSummary:", triggerSummary);
// //     console.log("localStorage parkinsonsPrediction:", predictionData);

// //     if (triggerSummary === "true" && predictionData) {
// //       console.log(
// //         "Prediction summary trigger detected. Preparing message for LLM."
// //       );
// //       const isParkinsons = predictionData.prediction === 1;
// //       const probability = (predictionData.probability * 100).toFixed(2);

// //       let userSummaryQuery = `My recent prediction result indicates a ${probability}% probability of Parkinson's (meaning ${
// //         isParkinsons ? "a high likelihood" : "a low likelihood"
// //       } of Parkinson's). Can you provide a summary of what this means, including potential severity, recommendations, next steps, and what not to do?`;

// //       // Display standard greeting first
// //       appendMessage(
// //         "Hello! I'm here to provide information about Parkinson's Disease symptoms. Please remember, I cannot diagnose. For an accurate prediction, please visit the 'Prediction' section. What would you like to know?",
// //         "bot"
// //       );

// //       // Then, simulate the user asking for the summary and send it to LLM
// //       chatHistory.push({ role: "user", content: userSummaryQuery });
// //       sendMessageToLLM(userSummaryQuery);

// //       // Crucially, remove the flag once it's acted upon
// //       localStorage.removeItem("triggerChatbotSummary");
// //       console.log("triggerChatbotSummary flag removed from localStorage.");
// //     } else {
// //       console.log(
// //         "No prediction summary trigger. Displaying standard initial message."
// //       );
// //       appendMessage(
// //         "Hello! I'm here to provide information about Parkinson's Disease symptoms. Please remember, I cannot diagnose. For an accurate prediction, please visit the 'Prediction' section. What would you like to know?",
// //         "bot"
// //       );
// //     }
// //   };

// //   // Event Listeners
// //   sendButton.addEventListener("click", handleUserInput);
// //   userInput.addEventListener("keypress", (event) => {
// //     if (event.key === "Enter") {
// //       handleUserInput();
// //     }
// //   });

// //   // Initialize chatbot on page load
// //   initializeChatbot();
// // });
// document.addEventListener("DOMContentLoaded", () => {
//   const chatBox = document.getElementById("chat-box");
//   const userInput = document.getElementById("user-input");
//   const sendButton = document.getElementById("send-button");

//   const appendMessage = (message, sender) => {
//     const messageDiv = document.createElement("div");
//     messageDiv.classList.add("message");
//     messageDiv.classList.add(
//       sender === "user" ? "user-message" : "bot-message"
//     );

//     // Markdown parsing for bot messages
//     if (sender === "bot") {
//       messageDiv.innerHTML = marked.parse(message);
//     } else {
//       messageDiv.innerHTML = `<p>${message}</p>`;
//     }

//     chatBox.appendChild(messageDiv);
//     chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the bottom
//   };

//   let chatHistory = []; // Stores conversation history for LLM

//   const sendMessageToLLM = async (messageText) => {
//     // Show typing indicator
//     appendMessage("Bot is typing...", "bot");
//     const loadingMessageDiv = chatBox.lastElementChild; // Get the "Bot is typing..." div

//     try {
//       console.log("Sending POST request to /chat...");
//       const response = await fetch("http://127.0.0.1:8000/chat", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ message: messageText, history: chatHistory }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(
//           errorData.detail || `HTTP error! status: ${response.status}`
//         );
//       }

//       const data = await response.json();
//       const botResponse = data.response;

//       // Remove typing indicator and display actual message
//       if (loadingMessageDiv) {
//         chatBox.removeChild(loadingMessageDiv);
//       }
//       appendMessage(botResponse, "bot");
//       chatHistory.push({ role: "assistant", content: botResponse }); // Add bot's response to history
//     } catch (error) {
//       console.error("Error communicating with chatbot backend:", error);
//       if (loadingMessageDiv) {
//         chatBox.removeChild(loadingMessageDiv);
//       }
//       appendMessage(
//         "Oops! I couldn't connect or something went wrong. Please try again later. If the issue persists, ensure the backend server is running.",
//         "bot"
//       );
//     }
//   };

//   // Handler for user input via text field or Enter key
//   const handleUserInput = () => {
//     const message = userInput.value.trim();
//     if (message === "") return;

//     appendMessage(message, "user"); // Display user's message
//     chatHistory.push({ role: "user", content: message }); // Add user's message to history
//     userInput.value = ""; // Clear input field

//     sendMessageToLLM(message); // Send to LLM backend
//   };

//   // --- Initial Load Logic & Prediction Summary Trigger ---
//   const initializeChatbot = () => {
//     const triggerSummary = localStorage.getItem("triggerChatbotSummary");
//     const predictionData = JSON.parse(
//       localStorage.getItem("parkinsonsPrediction")
//     );

//     console.log("Chatbot Initializing...");
//     console.log("localStorage triggerSummary:", triggerSummary);
//     console.log("localStorage parkinsonsPrediction:", predictionData);

//     if (triggerSummary === "true" && predictionData) {
//       console.log(
//         "Prediction summary trigger detected. Preparing message for LLM."
//       );
//       const isParkinsons = predictionData.prediction === 1;
//       const probability = (predictionData.probability * 100).toFixed(2);

//       let userSummaryQuery = `My recent prediction result indicates a ${probability}% probability of Parkinson's (meaning ${
//         isParkinsons ? "a high likelihood" : "a low likelihood"
//       } of Parkinson's). Can you provide a summary of what this means, including potential severity, recommendations, next steps, and what not to do?`;

//       // Display standard greeting first
//       appendMessage(
//         "Hello! I'm here to provide information about Parkinson's Disease symptoms. Please remember, I cannot diagnose. For an accurate prediction, please visit the 'Prediction' section. What would you like to know?",
//         "bot"
//       );

//       // Then, simulate the user asking for the summary and send it to LLM
//       chatHistory.push({ role: "user", content: userSummaryQuery });
//       sendMessageToLLM(userSummaryQuery);

//       // Crucially, remove the flag once it's acted upon
//       localStorage.removeItem("triggerChatbotSummary");
//       console.log("triggerChatbotSummary flag removed from localStorage.");
//     } else {
//       console.log(
//         "No prediction summary trigger. Displaying standard initial message."
//       );
//       appendMessage(
//         "Hello! I'm here to provide information about Parkinson's Disease symptoms. Please remember, I cannot diagnose. For an accurate prediction, please visit the 'Prediction' section. What would you like to know?",
//         "bot"
//       );
//     }
//   };

//   // Event Listeners
//   sendButton.addEventListener("click", handleUserInput);
//   userInput.addEventListener("keypress", (event) => {
//     if (event.key === "Enter") {
//       handleUserInput();
//     }
//   });

//   // Initialize chatbot on page load
//   initializeChatbot();
// });
document.addEventListener("DOMContentLoaded", () => {
  const chatBox = document.getElementById("chat-box");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");

  const appendMessage = (message, sender) => {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");
    messageDiv.classList.add(
      sender === "user" ? "user-message" : "bot-message"
    );

    // Markdown parsing for bot messages
    if (sender === "bot") {
      messageDiv.innerHTML = marked.parse(message);
    } else {
      messageDiv.innerHTML = `<p>${message}</p>`;
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the bottom
  };

  let chatHistory = []; // Stores conversation history for LLM

  const sendMessageToLLM = async (messageText) => {
    // Show typing indicator
    appendMessage("Bot is typing...", "bot");
    const loadingMessageDiv = chatBox.lastElementChild; // Get the "Bot is typing..." div

    try {
      console.log("Sending POST request to /chat...");
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageText, history: chatHistory }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      const botResponse = data.response;

      // Remove typing indicator and display actual message
      if (loadingMessageDiv) {
        chatBox.removeChild(loadingMessageDiv);
      }
      appendMessage(botResponse, "bot");
      chatHistory.push({ role: "assistant", content: botResponse }); // Add bot's response to history
    } catch (error) {
      console.error("Error communicating with chatbot backend:", error);
      if (loadingMessageDiv) {
        chatBox.removeChild(loadingMessageDiv);
      }
      appendMessage(
        "Oops! I couldn't connect or something went wrong. Please try again later. If the issue persists, ensure the backend server is running.",
        "bot"
      );
    }
  };

  // Handler for user input via text field or Enter key
  const handleUserInput = () => {
    const message = userInput.value.trim();
    if (message === "") return;

    appendMessage(message, "user"); // Display user's message
    chatHistory.push({ role: "user", content: message }); // Add user's message to history
    userInput.value = ""; // Clear input field

    sendMessageToLLM(message); // Send to LLM backend
  };

  // --- Initial Load Logic & Prediction Summary Trigger ---
  const initializeChatbot = () => {
    const triggerSummary = localStorage.getItem("triggerChatbotSummary");
    const predictionData = JSON.parse(
      localStorage.getItem("parkinsonsPrediction")
    );

    console.log("Chatbot Initializing...");
    console.log("localStorage triggerSummary:", triggerSummary);
    console.log("localStorage parkinsonsPrediction:", predictionData);

    if (triggerSummary === "true" && predictionData) {
      console.log(
        "Prediction summary trigger detected. Preparing message for LLM."
      );
      const isParkinsons = predictionData.prediction === 1;
      const probability = (predictionData.probability * 100).toFixed(2);
      const inputFeatures = predictionData.inputFeatures; // Get the raw input features

      // Define ranges (should match report_dashboard.js for consistency)
      const ranges = {
        "MDVP:Fo(Hz)": { healthy_min: 100, healthy_max: 180 },
        "MDVP:Fhi(Hz)": { healthy_min: 120, healthy_max: 550 },
        "MDVP:Flo(Hz)": { healthy_min: 60, healthy_max: 200 },
        "MDVP:Jitter(%)": { healthy_max: 0.005 },
        "MDVP:Jitter(Abs)": { healthy_max: 0.00005 },
        "MDVP:RAP": { healthy_max: 0.003 },
        "MDVP:PPQ": { healthy_max: 0.003 },
        "Jitter:DDP": { healthy_max: 0.01 },
        "MDVP:Shimmer": { healthy_max: 0.03 },
        "MDVP:Shimmer(dB)": { healthy_max: 0.3 },
        "Shimmer:APQ3": { healthy_max: 0.015 },
        "Shimmer:APQ5": { healthy_max: 0.015 },
        "MDVP:APQ": { healthy_max: 0.02 },
        "Shimmer:DDA": { healthy_max: 0.05 },
        NHR: { healthy_max: 0.02 },
        HNR: { healthy_min: 20 }, // HNR lower values indicate PD
        RPDE: { healthy_max: 0.5 },
        DFA: { healthy_max: 0.7 },
        spread1: { healthy_max: -5.0 }, // More negative indicates PD
        spread2: { healthy_max: 0.2 },
        D2: { healthy_max: 2.5 },
        PPE: { healthy_max: 0.2 },
      };

      let featureInsights = "";
      let concerningFeatures = [];

      for (const featureName in inputFeatures) {
        if (inputFeatures.hasOwnProperty(featureName) && ranges[featureName]) {
          const value = inputFeatures[featureName];
          const range = ranges[featureName];

          let isConcerning = false;
          let deviationType = "";

          if (
            featureName.includes("Jitter") ||
            featureName.includes("Shimmer") ||
            featureName === "NHR" ||
            featureName === "RPDE" ||
            featureName === "DFA" ||
            featureName === "spread2" ||
            featureName === "D2" ||
            featureName === "PPE"
          ) {
            if (value > range.healthy_max) {
              isConcerning = true;
              deviationType = "elevated";
            }
          } else if (featureName === "HNR") {
            if (value < range.healthy_min) {
              isConcerning = true;
              deviationType = "lower";
            }
          } else if (featureName === "spread1") {
            // spread1: more negative is concerning (e.g., -6.0 is more concerning than -4.0)
            // if the value is less than the healthy_max (which is a negative number like -5.0)
            if (value < range.healthy_max) {
              isConcerning = true;
              deviationType = "more negative";
            }
          } else if (featureName.includes("Fo(Hz)")) {
            if (value < range.healthy_min || value > range.healthy_max) {
              isConcerning = true;
              deviationType = "outside typical range";
            }
          }

          if (isConcerning) {
            concerningFeatures.push(
              `**${featureName}** (Value: ${value.toFixed(
                3
              )}, which is ${deviationType} than typical healthy ranges)`
            );
          }
        }
      }

      if (concerningFeatures.length > 0) {
        featureInsights = `\n\nBased on the detailed analysis, some vocal features were identified as potentially concerning: ${concerningFeatures.join(
          "; "
        )}.`;
      } else {
        featureInsights =
          "\n\nNo specific vocal features were identified as significantly outside typical healthy ranges in this analysis.";
      }

      let userSummaryQuery = `My recent prediction result indicates a **${probability}% probability** of Parkinson's. The model classified it as ${
        isParkinsons
          ? "a high likelihood of Parkinson's"
          : "a low likelihood of Parkinson's"
      }.${featureInsights} Can you provide a summary of what this means, including potential severity, general recommendations, next steps, and what not to do?`;

      // Display standard greeting first
      appendMessage(
        "Hello! I'm here to provide information about Parkinson's Disease symptoms. Please remember, I cannot diagnose. For an accurate prediction, please visit the 'Prediction' section. What would you like to know?",
        "bot"
      );

      // Then, simulate the user asking for the summary and send it to LLM
      chatHistory.push({ role: "user", content: userSummaryQuery });
      sendMessageToLLM(userSummaryQuery);

      // Crucially, remove the flag once it's acted upon
      localStorage.removeItem("triggerChatbotSummary");
      console.log("triggerChatbotSummary flag removed from localStorage.");
    } else {
      console.log(
        "No prediction summary trigger. Displaying standard initial message."
      );
      appendMessage(
        "Hello! I'm here to provide information about Parkinson's Disease symptoms. Please remember, I cannot diagnose. For an accurate prediction, please visit the 'Prediction' section. What would you like to know?",
        "bot"
      );
    }
  };

  // Event Listeners
  sendButton.addEventListener("click", handleUserInput);
  userInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      handleUserInput();
    }
  });

  // Initialize chatbot on page load
  initializeChatbot();
});
