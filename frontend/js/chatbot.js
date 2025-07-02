// /**
//  * @file Chatbot interaction logic for the main chat interface.
//  * @summary **Fixed Version**: Centralized and improved suggestion logic to be more context-aware.
//  * The "Test Now" button now only appears when relevant to the conversation (e.g., discussing symptoms or diagnosis).
//  * @version 5.0.0
//  */

// document.addEventListener("DOMContentLoaded", () => {
//   // --- Configuration Constants ---
//   const SELECTORS = {
//     chatBox: "chat-box",
//     userInput: "user-input",
//     sendButton: "send-button",
//     suggestionCardsContainer: "suggestion-cards",
//     themeToggleButton: "theme-toggle",
//     mainNav: ".main-nav",
//     mainContent: ".main-content",
//   };

//   const API_CONFIG = {
//     url: "http://127.0.0.1:8000/chat",
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//   };

//   const STORAGE_KEYS = {
//     theme: "theme",
//     triggerSummary: "triggerChatbotSummary",
//     predictionData: "parkinsonsPrediction",
//   };

//   // --- DOM Element Cache ---
//   const dom = {
//     chatBox: document.getElementById(SELECTORS.chatBox),
//     userInput: document.getElementById(SELECTORS.userInput),
//     sendButton: document.getElementById(SELECTORS.sendButton),
//     suggestionCardsContainer: document.getElementById(
//       SELECTORS.suggestionCardsContainer
//     ),
//     themeToggleButton: document.getElementById(SELECTORS.themeToggleButton),
//     body: document.body,
//     mainNav: document.querySelector(SELECTORS.mainNav),
//     mainContent: document.querySelector(SELECTORS.mainContent),
//   };

//   let chatHistory = [];
//   let isWaitingForResponse = false;

//   // --- Static Suggestion Data ---
//   const initialSuggestions = [
//     {
//       text: "What are the symptoms?",
//       query: "What are the common symptoms of Parkinson's disease?",
//     },
//     { text: "What is Parkinson's?", query: "What is Parkinson's disease?" },
//     {
//       text: "How is it diagnosed?",
//       query: "How is Parkinson's disease diagnosed?",
//     },
//     { text: "Suggest some Cures", query: "Suggest some Cures for Parkinson's" },
//   ];

//   // --- Utility Functions ---

//   const debounce = (func, delay) => {
//     let timeoutId;
//     return (...args) => {
//       clearTimeout(timeoutId);
//       timeoutId = setTimeout(() => func.apply(this, args), delay);
//     };
//   };

//   const autoScrollChat = () => {
//     if (!dom.mainContent) return;
//     requestAnimationFrame(() => {
//       dom.mainContent.scrollTop = dom.mainContent.scrollHeight;
//     });
//   };

//   // --- Core UI Functions ---

//   const appendMessage = (text, type) => {
//     if (!dom.chatBox) return null;

//     const wrapper = document.createElement("div");
//     wrapper.classList.add("message-wrapper", type);
//     wrapper.setAttribute("aria-live", "polite");

//     const iconHTML =
//       type === "bot" || type === "typing"
//         ? '<i class="ph-bold ph-brain" aria-hidden="true"></i>'
//         : '<i class="ph-bold ph-user" aria-hidden="true"></i>';

//     const iconDiv = document.createElement("div");
//     iconDiv.classList.add("message-icon");
//     iconDiv.innerHTML = iconHTML;

//     const msgDiv = document.createElement("div");
//     if (type === "typing") {
//       msgDiv.classList.add("loader-container");
//       msgDiv.innerHTML = `
//                 <svg class="loader-svg" viewBox="0 0 60 30"><path class="loader-path" d="M5,15 C25,30 25,-20 55,15"></path></svg>
//                 <svg class="loader-svg blur" viewBox="0 0 60 30"><path class="loader-path" d="M5,15 C25,30 25,-20 55,15"></path></svg>`;
//     } else {
//       msgDiv.classList.add(
//         "message",
//         type === "user" ? "user-message" : "bot-message"
//       );
//       if (type === "bot" && window.marked) {
//         msgDiv.innerHTML = marked.parse(text);
//       } else {
//         const p = document.createElement("p");
//         p.textContent = text;
//         msgDiv.appendChild(p);
//       }
//     }

//     wrapper.appendChild(iconDiv);
//     wrapper.appendChild(msgDiv);
//     dom.chatBox.appendChild(wrapper);

//     autoScrollChat();
//     return wrapper;
//   };

//   const renderSuggestions = (title, suggestions, showTestButton = false) => {
//     if (!dom.suggestionCardsContainer) return;
//     dom.suggestionCardsContainer.innerHTML = ""; // Clear previous content

//     const titleEl = document.createElement("p");
//     titleEl.className = "suggestion-title";
//     titleEl.textContent = title;
//     dom.suggestionCardsContainer.appendChild(titleEl);

//     suggestions.forEach((suggestion) => {
//       const card = document.createElement("button");
//       card.className = "suggestion-card";
//       card.textContent = suggestion.text;
//       card.addEventListener("click", () =>
//         handleSuggestionClick(suggestion.query)
//       );
//       dom.suggestionCardsContainer.appendChild(card);
//     });

//     if (showTestButton) {
//       renderTestNowButton();
//     }
//   };

//   const renderTestNowButton = () => {
//     const buttonLink = document.createElement("a");
//     buttonLink.href = "prediction.html";
//     buttonLink.classList.add("btn-53-link");
//     buttonLink.innerHTML = `
//             <button class="btn-53" type="button">
//                 <div class="original">Test Now</div>
//                 <div class="letters">
//                     <span>W</span><span>i</span><span>t</span><span>h</span><span>&nbsp;</span><span>V</span><span>o</span><span>i</span><span>c</span><span>e</span>
//                 </div>
//             </button>`;
//     if (dom.suggestionCardsContainer) {
//       dom.suggestionCardsContainer.appendChild(buttonLink);
//     }
//   };

//   // --- Chat Logic ---

//   /**
//    * **FIXED & REFACTORED**: Analyzes the bot's response to generate and render context-aware suggestions.
//    * This logic is now centralized and more robust.
//    * @param {string} botResponse The text response from the chatbot.
//    */
//   const updateDynamicSuggestions = (botResponse) => {
//     const lowerResponse = botResponse.toLowerCase();
//     let title = "You can also ask";
//     let suggestions = [];
//     let showTestButton = false;

//     // Keyword checks for different conversational contexts
//     const isSymptomRelated =
//       lowerResponse.includes("symptom") || lowerResponse.includes("sign");
//     const isDiagnosisRelated =
//       lowerResponse.includes("diagnos") ||
//       lowerResponse.includes("test") ||
//       lowerResponse.includes("check for");
//     const isTreatmentRelated =
//       lowerResponse.includes("treatment") ||
//       lowerResponse.includes("cure") ||
//       lowerResponse.includes("manage");
//     const isResultsRelated =
//       lowerResponse.includes("result") || lowerResponse.includes("prediction");
//     const isGreeting = ["hello", "hi", "hey", "greetings"].some((k) =>
//       lowerResponse.startsWith(k)
//     );

//     if (isResultsRelated) {
//       title = "Based on Your Results";
//       suggestions = [
//         {
//           text: "Summarize my results",
//           query:
//             "Can you provide a detailed summary of my recent prediction results?",
//         },
//         {
//           text: "General Medical Help",
//           query:
//             "What general medical advice can you offer based on my results?",
//         },
//         {
//           text: "Find Nearest Medical Help",
//           query: "How can I find the nearest neurologist or medical center?",
//         },
//       ];
//       showTestButton = false; // Test is already done
//     } else if (isSymptomRelated) {
//       title = "More on Symptoms";
//       suggestions = [
//         {
//           text: "Early Symptoms",
//           query: "Tell me about early signs of Parkinson's.",
//         },
//         {
//           text: "Non-motor Signs",
//           query: "What are non-motor symptoms of Parkinson's?",
//         },
//         {
//           text: "Progression of Symptoms",
//           query: "How do symptoms progress over time?",
//         },
//       ];
//       showTestButton = true; // Relevant to offer a test
//     } else if (isDiagnosisRelated) {
//       title = "Explore Diagnosis";
//       suggestions = [
//         {
//           text: "Tests Used",
//           query: "What tests are used to diagnose Parkinson's?",
//         },
//         {
//           text: "Is it Hereditary?",
//           query: "Is Parkinson's disease hereditary?",
//         },
//         {
//           text: "Finding a Specialist",
//           query: "How do I find a movement disorder specialist?",
//         },
//       ];
//       showTestButton = true; // Highly relevant to offer a test
//     } else if (isTreatmentRelated) {
//       title = "Treatment Options";
//       suggestions = [
//         {
//           text: "Medications",
//           query: "What are the common medications for Parkinson's?",
//         },
//         {
//           text: "Therapies",
//           query: "What therapy options exist besides medication?",
//         },
//         {
//           text: "Lifestyle Advice",
//           query: "What lifestyle changes help with Parkinson's?",
//         },
//       ];
//       showTestButton = false; // Not directly relevant to testing
//     } else if (isGreeting) {
//       title = "How can I help you?";
//       suggestions = initialSuggestions;
//       showTestButton = true; // It's a good general entry point to offer the test
//     } else {
//       // Default case for any other response
//       title = "What's next?";
//       suggestions = [
//         {
//           text: "What are the main symptoms?",
//           query: "What are the main symptoms of Parkinson's?",
//         },
//         {
//           text: "How is it treated?",
//           query: "How is Parkinson's disease treated?",
//         },
//         {
//           text: "Tell me a surprising fact.",
//           query: "Tell me a surprising fact about Parkinson's research.",
//         },
//       ];
//       showTestButton = false; // Avoid showing the button on generic, non-symptom-related talk
//     }

//     renderSuggestions(title, suggestions, showTestButton);
//   };

//   const sendMessageToLLM = async (messageText) => {
//     isWaitingForResponse = true;
//     const typingIndicator = appendMessage("", "typing");

//     try {
//       const response = await fetch(API_CONFIG.url, {
//         method: API_CONFIG.method,
//         headers: API_CONFIG.headers,
//         body: JSON.stringify({ message: messageText, history: chatHistory }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(
//           errorData.detail || `HTTP error! Status: ${response.status}`
//         );
//       }

//       const data = await response.json();
//       const botResponse = data.response;

//       chatHistory.push({ role: "assistant", content: botResponse });

//       if (typingIndicator && dom.chatBox.contains(typingIndicator)) {
//         dom.chatBox.removeChild(typingIndicator);
//       }

//       appendMessage(botResponse, "bot");
//       // Generate suggestions based on the bot's reply for better context
//       updateDynamicSuggestions(botResponse);
//     } catch (error) {
//       console.error("Error communicating with chatbot backend:", error);
//       if (typingIndicator && dom.chatBox.contains(typingIndicator)) {
//         dom.chatBox.removeChild(typingIndicator);
//       }
//       appendMessage(
//         "I'm having some trouble connecting. Please check your connection and try again.",
//         "bot"
//       );
//     } finally {
//       isWaitingForResponse = false;
//     }
//   };

//   // --- Event Handlers ---

//   const handleUserInput = () => {
//     if (isWaitingForResponse) return;
//     const message = dom.userInput.value.trim();
//     if (message === "") return;

//     appendMessage(message, "user");
//     chatHistory.push({ role: "user", content: message });
//     dom.userInput.value = "";
//     dom.suggestionCardsContainer.innerHTML = ""; // Clear suggestions immediately

//     sendMessageToLLM(message);
//   };

//   const handleSuggestionClick = (query) => {
//     if (isWaitingForResponse) return;
//     appendMessage(query, "user");
//     chatHistory.push({ role: "user", content: query });
//     dom.suggestionCardsContainer.innerHTML = "";

//     sendMessageToLLM(query);
//   };

//   const handleThemeToggle = () => {
//     dom.body.classList.toggle("light-mode");
//     const currentTheme = dom.body.classList.contains("light-mode")
//       ? "light"
//       : "dark";
//     localStorage.setItem(STORAGE_KEYS.theme, currentTheme);
//     dom.themeToggleButton.setAttribute(
//       "aria-label",
//       `Switch to ${currentTheme === "light" ? "dark" : "light"} mode`
//     );
//   };

//   const handleNavScroll = debounce(() => {
//     if (!dom.mainContent || !dom.mainNav) return;
//     const scrolledPastThreshold = dom.mainContent.scrollTop > 10;
//     dom.mainNav.classList.toggle("scrolled", scrolledPastThreshold);
//   }, 100);

//   // --- Initialization ---

//   const setupEventListeners = () => {
//     dom.sendButton.addEventListener("click", handleUserInput);
//     dom.userInput.addEventListener("keydown", (event) => {
//       if (event.key === "Enter" && !event.shiftKey) {
//         event.preventDefault();
//         handleUserInput();
//       }
//     });
//     dom.themeToggleButton.addEventListener("click", handleThemeToggle);
//     if (dom.mainContent) {
//       dom.mainContent.addEventListener("scroll", handleNavScroll);
//     }
//   };

//   const initializeChatbot = () => {
//     const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
//     if (savedTheme === "light") {
//       dom.body.classList.add("light-mode");
//     }
//     dom.themeToggleButton.setAttribute(
//       "aria-label",
//       `Switch to ${
//         dom.body.classList.contains("light-mode") ? "dark" : "light"
//       } mode`
//     );

//     const triggerSummary = localStorage.getItem(STORAGE_KEYS.triggerSummary);
//     if (triggerSummary === "true") {
//       // If coming from the report page, ask the bot to summarize
//       const summaryQuery =
//         "Please summarize my recent prediction results in a compassionate and understandable way.";
//       appendMessage(summaryQuery, "user");
//       sendMessageToLLM(summaryQuery);
//       localStorage.removeItem(STORAGE_KEYS.triggerSummary);
//     } else {
//       // Standard welcome
//       const initialBotMessage =
//         "Hello! I'm your AI assistant. How can I help you understand Parkinson's today?";
//       appendMessage(initialBotMessage, "bot");
//       updateDynamicSuggestions(initialBotMessage);
//     }

//     setupEventListeners();
//     dom.userInput.focus();
//   };

//   // --- Start the Application ---
//   initializeChatbot();
// });
/**
 * @file Chatbot interaction logic for the main chat interface.
 * @summary **Fixed Version**: Centralized and improved suggestion logic to be more context-aware.
 * The "Test Now" button now only appears when relevant to the conversation (e.g., discussing symptoms or diagnosis).
 * @version 5.0.0
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- Configuration Constants ---
  const SELECTORS = {
    chatBox: "chat-box",
    userInput: "user-input",
    sendButton: "send-button",
    suggestionCardsContainer: "suggestion-cards",
    themeToggleButton: "theme-toggle",
    mainNav: ".main-nav",
    mainContent: ".main-content",
  };

  const API_CONFIG = {
    url: "https://your-backend-name.onrender.com/chat", // <<< CHANGE THIS
    method: "POST",
    headers: { "Content-Type": "application/json" },
  };

  const STORAGE_KEYS = {
    theme: "theme",
    triggerSummary: "triggerChatbotSummary",
    predictionData: "parkinsonsPrediction",
  };

  // --- DOM Element Cache ---
  const dom = {
    chatBox: document.getElementById(SELECTORS.chatBox),
    userInput: document.getElementById(SELECTORS.userInput),
    sendButton: document.getElementById(SELECTORS.sendButton),
    suggestionCardsContainer: document.getElementById(
      SELECTORS.suggestionCardsContainer
    ),
    themeToggleButton: document.getElementById(SELECTORS.themeToggleButton),
    body: document.body,
    mainNav: document.querySelector(SELECTORS.mainNav),
    mainContent: document.querySelector(SELECTORS.mainContent),
  };

  let chatHistory = [];
  let isWaitingForResponse = false;

  // --- Static Suggestion Data ---
  const initialSuggestions = [
    {
      text: "What are the symptoms?",
      query: "What are the common symptoms of Parkinson's disease?",
    },
    { text: "What is Parkinson's?", query: "What is Parkinson's disease?" },
    {
      text: "How is it diagnosed?",
      query: "How is Parkinson's disease diagnosed?",
    },
    { text: "Suggest some Cures", query: "Suggest some Cures for Parkinson's" },
  ];

  // --- Feature Ranges for LLM Context (must match report_dashboard.js) ---
  const FEATURE_RANGES = {
    "MDVP:Fo(Hz)": { healthy: [100, 180], type: "range" },
    "MDVP:Fhi(Hz)": { healthy: [120, 550], type: "range" },
    "MDVP:Flo(Hz)": { healthy: [60, 200], type: "range" },
    "MDVP:Jitter(%)": { healthy: [0, 0.005], type: "high_is_pd" },
    "MDVP:Jitter(Abs)": { healthy: [0, 0.00005], type: "high_is_pd" },
    "MDVP:RAP": { healthy: [0, 0.003], type: "high_is_pd" },
    "MDVP:PPQ": { healthy: [0, 0.003], type: "high_is_pd" },
    "Jitter:DDP": { healthy: [0, 0.01], type: "high_is_pd" },
    "MDVP:Shimmer": { healthy: [0, 0.03], type: "high_is_pd" },
    "MDVP:Shimmer(dB)": { healthy: [0, 0.3], type: "high_is_pd" },
    "Shimmer:APQ3": { healthy: [0, 0.015], type: "high_is_pd" },
    "Shimmer:APQ5": { healthy: [0, 0.015], type: "high_is_pd" },
    "MDVP:APQ": { healthy: [0, 0.02], type: "high_is_pd" }, // Using placeholder's general healthy range
    "Shimmer:DDA": { healthy: [0, 0.05], type: "high_is_pd" },
    NHR: { healthy: [0, 0.02], type: "high_is_pd" },
    HNR: { healthy: [20, Infinity], type: "low_is_pd" },
    RPDE: { healthy: [0, 0.5], type: "high_is_pd" }, // Using placeholder's general healthy range
    DFA: { healthy: [0, 0.7], type: "high_is_pd" }, // Using placeholder's general healthy range
    spread1: { healthy: [-7.0, -4.5], type: "low_is_pd_negative" }, // More negative is PD
    spread2: { healthy: [0, 0.2], type: "high_is_pd" },
    D2: { healthy: [0, 2.5], type: "high_is_pd" },
    PPE: { healthy: [0, 0.2], type: "high_is_pd" },
  };

  // --- Utility Functions ---

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  const autoScrollChat = () => {
    if (!dom.mainContent) return;
    requestAnimationFrame(() => {
      dom.mainContent.scrollTop = dom.mainContent.scrollHeight;
    });
  };

  // --- Core UI Functions ---

  const appendMessage = (text, type) => {
    if (!dom.chatBox) return null;

    const wrapper = document.createElement("div");
    wrapper.classList.add("message-wrapper", type);
    wrapper.setAttribute("aria-live", "polite");

    const iconHTML =
      type === "bot" || type === "typing"
        ? '<i class="ph-bold ph-brain" aria-hidden="true"></i>'
        : '<i class="ph-bold ph-user" aria-hidden="true"></i>';

    const iconDiv = document.createElement("div");
    iconDiv.classList.add("message-icon");
    iconDiv.innerHTML = iconHTML;

    const msgDiv = document.createElement("div");
    if (type === "typing") {
      msgDiv.classList.add("loader-container");
      msgDiv.innerHTML = `
                <svg class="loader-svg" viewBox="0 0 60 30"><path class="loader-path" d="M5,15 C25,30 25,-20 55,15"></path></svg>
                <svg class="loader-svg blur" viewBox="0 0 60 30"><path class="loader-path" d="M5,15 C25,30 25,-20 55,15"></path></svg>`;
    } else {
      msgDiv.classList.add(
        "message",
        type === "user" ? "user-message" : "bot-message"
      );
      if (type === "bot" && window.marked) {
        msgDiv.innerHTML = marked.parse(text);
      } else {
        const p = document.createElement("p");
        p.textContent = text;
        msgDiv.appendChild(p);
      }
    }

    wrapper.appendChild(iconDiv);
    wrapper.appendChild(msgDiv);
    dom.chatBox.appendChild(wrapper);

    autoScrollChat();
    return wrapper;
  };

  const renderSuggestions = (title, suggestions, showTestButton = false) => {
    if (!dom.suggestionCardsContainer) return;
    dom.suggestionCardsContainer.innerHTML = ""; // Clear previous content

    const titleEl = document.createElement("p");
    titleEl.className = "suggestion-title";
    titleEl.textContent = title;
    dom.suggestionCardsContainer.appendChild(titleEl);

    suggestions.forEach((suggestion) => {
      const card = document.createElement("button");
      card.className = "suggestion-card";
      card.textContent = suggestion.text;
      card.addEventListener("click", () =>
        handleSuggestionClick(suggestion.query)
      );
      dom.suggestionCardsContainer.appendChild(card);
    });

    if (showTestButton) {
      renderTestNowButton();
    }
  };

  const renderTestNowButton = () => {
    const buttonLink = document.createElement("a");
    buttonLink.href = "prediction.html";
    buttonLink.classList.add("btn-53-link");
    buttonLink.innerHTML = `
            <button class="btn-53" type="button">
                <div class="original">Test Now</div>
                <div class="letters">
                    <span>W</span><span>i</span><span>t</span><span>h</span><span>&nbsp;</span><span>V</span><span>o</span><span>i</span><span>c</span><span>e</span>
                </div>
            </button>`;
    if (dom.suggestionCardsContainer) {
      dom.suggestionCardsContainer.appendChild(buttonLink);
    }
  };

  // --- Chat Logic ---

  /**
   * **FIXED & REFACTORED**: Analyzes the bot's response to generate and render context-aware suggestions.
   * This logic is now centralized and more robust.
   * @param {string} botResponse The text response from the chatbot.
   */
  const updateDynamicSuggestions = (botResponse) => {
    const lowerResponse = botResponse.toLowerCase();
    let title = "You can also ask";
    let suggestions = [];
    let showTestButton = false;

    // Keyword checks for different conversational contexts
    const isSymptomRelated =
      lowerResponse.includes("symptom") || lowerResponse.includes("sign");
    const isDiagnosisRelated =
      lowerResponse.includes("diagnos") ||
      lowerResponse.includes("test") ||
      lowerResponse.includes("check for");
    const isTreatmentRelated =
      lowerResponse.includes("treatment") ||
      lowerResponse.includes("cure") ||
      lowerResponse.includes("manage");
    const isResultsRelated =
      lowerResponse.includes("result") || lowerResponse.includes("prediction");
    const isGreeting = ["hello", "hi", "hey", "greetings"].some((k) =>
      lowerResponse.startsWith(k)
    );

    if (isResultsRelated) {
      title = "Based on Your Results";
      suggestions = [
        {
          text: "Summarize my results",
          query:
            "Can you provide a detailed summary of my recent prediction results?",
        },
        {
          text: "General Medical Help",
          query:
            "What general medical advice can you offer based on my results?",
        },
        {
          text: "Find Nearest Medical Help",
          query: "How can I find the nearest neurologist or medical center?",
        },
      ];
      showTestButton = false; // Test is already done
    } else if (isSymptomRelated) {
      title = "More on Symptoms";
      suggestions = [
        {
          text: "Early Symptoms",
          query: "Tell me about early signs of Parkinson's.",
        },
        {
          text: "Non-motor Signs",
          query: "What are non-motor symptoms of Parkinson's?",
        },
        {
          text: "Progression of Symptoms",
          query: "How do symptoms progress over time?",
        },
      ];
      showTestButton = true; // Relevant to offer a test
    } else if (isDiagnosisRelated) {
      title = "Explore Diagnosis";
      suggestions = [
        {
          text: "Tests Used",
          query: "What tests are used to diagnose Parkinson's?",
        },
        {
          text: "Is it Hereditary?",
          query: "Is Parkinson's disease hereditary?",
        },
        {
          text: "Finding a Specialist",
          query: "How do I find a movement disorder specialist?",
        },
      ];
      showTestButton = true; // Highly relevant to offer a test
    } else if (isTreatmentRelated) {
      title = "Treatment Options";
      suggestions = [
        {
          text: "Medications",
          query: "What are the common medications for Parkinson's?",
        },
        {
          text: "Therapies",
          query: "What therapy options exist besides medication?",
        },
        {
          text: "Lifestyle Advice",
          query: "What lifestyle changes help with Parkinson's?",
        },
      ];
      showTestButton = false; // Not directly relevant to testing
    } else if (isGreeting) {
      title = "How can I help you?";
      suggestions = initialSuggestions;
      showTestButton = true; // It's a good general entry point to offer the test
    } else {
      // Default case for any other response
      title = "What's next?";
      suggestions = [
        {
          text: "What are the main symptoms?",
          query: "What are the main symptoms of Parkinson's?",
        },
        {
          text: "How is it treated?",
          query: "How is Parkinson's disease treated?",
        },
        {
          text: "Tell me a surprising fact.",
          query: "Tell me a surprising fact about Parkinson's research.",
        },
      ];
      showTestButton = false; // Avoid showing the button on generic, non-symptom-related talk
    }

    renderSuggestions(title, suggestions, showTestButton);
  };

  const sendMessageToLLM = async (messageText) => {
    isWaitingForResponse = true;
    const typingIndicator = appendMessage("", "typing");

    try {
      const response = await fetch(API_CONFIG.url, {
        method: API_CONFIG.method,
        headers: API_CONFIG.headers,
        body: JSON.stringify({ message: messageText, history: chatHistory }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP error! Status: ${response.status}`
        );
      }

      const data = await response.json();
      const botResponse = data.response;

      chatHistory.push({ role: "assistant", content: botResponse });

      if (typingIndicator && dom.chatBox.contains(typingIndicator)) {
        dom.chatBox.removeChild(typingIndicator);
      }

      appendMessage(botResponse, "bot");
      // Generate suggestions based on the bot's reply for better context
      updateDynamicSuggestions(botResponse);
    } catch (error) {
      console.error("Error communicating with chatbot backend:", error);
      if (typingIndicator && dom.chatBox.contains(typingIndicator)) {
        dom.chatBox.removeChild(typingIndicator);
      }
      appendMessage(
        "I'm having some trouble connecting. Please check your connection and try again.",
        "bot"
      );
    } finally {
      isWaitingForResponse = false;
    }
  };

  // --- Event Handlers ---

  const handleUserInput = () => {
    if (isWaitingForResponse) return;
    const message = dom.userInput.value.trim();
    if (message === "") return;

    appendMessage(message, "user");
    chatHistory.push({ role: "user", content: message });
    dom.userInput.value = "";
    dom.suggestionCardsContainer.innerHTML = ""; // Clear suggestions immediately

    sendMessageToLLM(message);
  };

  const handleSuggestionClick = (query) => {
    if (isWaitingForResponse) return;
    appendMessage(query, "user");
    chatHistory.push({ role: "user", content: query });
    dom.suggestionCardsContainer.innerHTML = "";

    sendMessageToLLM(query);
  };

  const handleThemeToggle = () => {
    dom.body.classList.toggle("light-mode");
    const currentTheme = dom.body.classList.contains("light-mode")
      ? "light"
      : "dark";
    localStorage.setItem(STORAGE_KEYS.theme, currentTheme);
    dom.themeToggleButton.setAttribute(
      "aria-label",
      `Switch to ${currentTheme === "light" ? "dark" : "light"} mode`
    );
  };

  const handleNavScroll = debounce(() => {
    if (!dom.mainContent || !dom.mainNav) return;
    const scrolledPastThreshold = dom.mainContent.scrollTop > 10;
    dom.mainNav.classList.toggle("scrolled", scrolledPastThreshold);
  }, 100);

  // --- Initialization ---

  const setupEventListeners = () => {
    dom.sendButton.addEventListener("click", handleUserInput);
    dom.userInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleUserInput();
      }
    });
    dom.themeToggleButton.addEventListener("click", handleThemeToggle);
    if (dom.mainContent) {
      dom.mainContent.addEventListener("scroll", handleNavScroll);
    }
  };

  const initializeChatbot = () => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    if (savedTheme === "light") {
      dom.body.classList.add("light-mode");
    }
    dom.themeToggleButton.setAttribute(
      "aria-label",
      `Switch to ${
        dom.body.classList.contains("light-mode") ? "dark" : "light"
      } mode`
    );

    const triggerSummary = localStorage.getItem(STORAGE_KEYS.triggerSummary);
    if (triggerSummary === "true") {
      // --- NEW: Retrieve prediction data from localStorage ---
      const predictionDataString = localStorage.getItem(
        STORAGE_KEYS.predictionData
      );
      const predictionData = predictionDataString
        ? JSON.parse(predictionDataString)
        : null;

      if (predictionData) {
        const isParkinsons = predictionData.prediction === 1;
        const probability = (predictionData.probability * 100).toFixed(2);
        const inputFeatures = predictionData.inputFeatures;

        let featureInsights = "";
        let concerningFeatures = [];

        for (const featureName in inputFeatures) {
          if (
            inputFeatures.hasOwnProperty(featureName) &&
            FEATURE_RANGES[featureName]
          ) {
            const value = inputFeatures[featureName];
            const range = FEATURE_RANGES[featureName];

            let isConcerning = false;
            let deviationType = "";

            if (range.type === "high_is_pd") {
              if (value > range.healthy[1]) {
                isConcerning = true;
                deviationType = "elevated";
              }
            } else if (
              range.type === "low_is_pd" ||
              range.type === "low_is_pd_negative"
            ) {
              if (value < range.healthy[0]) {
                isConcerning = true;
                deviationType = "lower";
              }
            } else if (range.type === "range") {
              if (value < range.healthy[0] || value > range.healthy[1]) {
                isConcerning = true;
                deviationType = "outside typical range";
              }
            }

            if (isConcerning) {
              concerningFeatures.push(
                `**${featureName}** (Value: ${value.toFixed(
                  4
                )}, which is ${deviationType} than typical healthy ranges ${
                  range.display ? `(${range.display})` : ""
                })`
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

        const likelihoodText = isParkinsons
          ? "a high likelihood of Parkinson's"
          : "a low likelihood of Parkinson's";
        const summaryQuery = `My recent prediction result indicates a **${probability}% probability** of Parkinson's, which the model classified as ${likelihoodText}.${featureInsights} Can you provide a summary of what this means, including potential severity, general recommendations, next steps, and what not to do?`;

        appendMessage(summaryQuery, "user");
        sendMessageToLLM(summaryQuery);
        localStorage.removeItem(STORAGE_KEYS.triggerSummary);
      } else {
        // Fallback to standard welcome if no prediction data found
        const initialBotMessage =
          "Hello! I'm your AI assistant. How can I help you understand Parkinson's today?";
        appendMessage(initialBotMessage, "bot");
        updateDynamicSuggestions(initialBotMessage);
      }
    } else {
      // Standard welcome if no summary trigger
      const initialBotMessage =
        "Hello! I'm your AI assistant. How can I help you understand Parkinson's today?";
      appendMessage(initialBotMessage, "bot");
      updateDynamicSuggestions(initialBotMessage);
    }

    setupEventListeners();
    dom.userInput.focus();
  };

  // --- Start the Application ---
  initializeChatbot();
});
