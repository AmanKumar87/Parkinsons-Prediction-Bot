document.addEventListener("DOMContentLoaded", () => {
  // --- SELECTORS ---
  const predictionForm = document.getElementById("prediction-form");
  const errorMessageDiv = document.getElementById("error-message");
  const startRecordingBtn = document.getElementById("start-recording-btn");
  const stopRecordingBtn = document.getElementById("stop-recording-btn");
  const recordingStatus = document.getElementById("recording-status");
  const showManualFormBtn = document.getElementById("show-manual-form-btn");
  const manualInputWrapper = document.getElementById("manual-input-wrapper");
  const voiceFirstContainer = document.getElementById("voice-first-container");
  const tabs = document.querySelectorAll('[role="tab"]');
  const tabList = document.querySelector('[role="tablist"]');
  const visualizer = document.getElementById("voice-visualizer");
  const visualizerContext = visualizer.getContext("2d");
  const waveformIcon = document.getElementById("waveform-icon");
  const voiceContainerTitle = document.getElementById("voice-container-title");
  const voiceContainerP = document.getElementById("voice-container-p");
  const processingOverlay = document.getElementById("processing-overlay");
  const prevTabBtn = document.getElementById("prev-tab-btn");
  const nextTabBtn = document.getElementById("next-tab-btn");

  // --- THEME MANAGEMENT (STANDARDIZED) ---
  const themeToggleButton = document.getElementById("theme-toggle");
  const body = document.body;

  const initializeTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      body.classList.add("light-mode");
    }
    const currentTheme = body.classList.contains("light-mode")
      ? "light"
      : "dark";
    themeToggleButton.setAttribute(
      "aria-label",
      `Switch to ${currentTheme === "light" ? "dark" : "light"} mode`
    );
  };

  let mediaRecorder;
  let audioChunks = [];
  let audioContext;
  let analyser;
  let animationFrameId;

  // --- INITIALIZATION ---
  function init() {
    initUIEventListeners();
    if (tabs.length > 0 && tabList) {
      initAccessibleTabs();
    }
  }

  // --- SETUP EVENT LISTENERS ---
  function initUIEventListeners() {
    const nav = document.querySelector(".main-nav");
    const mainContent = document.querySelector(".main-content");
    if (nav && mainContent) {
      mainContent.addEventListener("scroll", () =>
        nav.classList.toggle("scrolled", mainContent.scrollTop > 10)
      );
    }
    const handleThemeToggle = () => {
      body.classList.toggle("light-mode");
      const currentTheme = body.classList.contains("light-mode")
        ? "light"
        : "dark";
      localStorage.setItem("theme", currentTheme);
      themeToggleButton.setAttribute(
        "aria-label",
        `Switch to ${currentTheme === "light" ? "dark" : "light"} mode`
      );
    };

    initializeTheme();
    themeToggleButton.addEventListener("click", handleThemeToggle);
    if (showManualFormBtn) {
      showManualFormBtn.addEventListener("click", () => {
        if (manualInputWrapper) manualInputWrapper.classList.add("visible");
        if (voiceFirstContainer) voiceFirstContainer.style.display = "none";
        if (tabs.length > 0 && tabs[0]) {
          activateTab(tabs[0], true);
        }
      });
    }

    if (startRecordingBtn) {
      startRecordingBtn.addEventListener("click", handleStartRecording);
    }

    if (stopRecordingBtn) {
      stopRecordingBtn.addEventListener("click", handleStopRecording);
    }

    if (predictionForm) {
      predictionForm.addEventListener("submit", handleFormSubmit);
    }

    if (prevTabBtn) {
      prevTabBtn.addEventListener("click", () => navigateTabs("prev"));
    }
    if (nextTabBtn) {
      nextTabBtn.addEventListener("click", () => navigateTabs("next"));
    }
  }

  // --- ACCESSIBLE TAB LOGIC & NAVIGATION ---

  function updateArrowButtonsState() {
    const tabNodes = Array.from(tabs);
    const currentTab = tabList.querySelector(
      '[role="tab"][aria-selected="true"]'
    );
    const currentIndex = tabNodes.indexOf(currentTab);

    if (prevTabBtn) {
      prevTabBtn.disabled = currentIndex === 0;
    }
    if (nextTabBtn) {
      nextTabBtn.disabled = currentIndex === tabNodes.length - 1;
    }
  }

  function navigateTabs(direction) {
    const tabNodes = Array.from(tabs);
    const currentTab = tabList.querySelector(
      '[role="tab"][aria-selected="true"]'
    );
    let currentIndex = tabNodes.indexOf(currentTab);
    if (currentIndex === -1) return;

    if (direction === "next") {
      if (currentIndex < tabNodes.length - 1) {
        currentIndex++;
      }
    } else if (direction === "prev") {
      if (currentIndex > 0) {
        currentIndex--;
      }
    }

    activateTab(tabNodes[currentIndex], true);
  }

  function initAccessibleTabs() {
    tabs.forEach((tab) => {
      tab.addEventListener("click", (e) => {
        activateTab(e.currentTarget, false);
      });

      tab.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activateTab(e.currentTarget, false);
        } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          e.stopPropagation();
          const nextTab = getNextTab(e.currentTarget, e.key);
          if (nextTab) {
            activateTab(nextTab, true);
          }
        }
      });
    });

    let initiallyActiveTab = tabList.querySelector(
      '[role="tab"][aria-selected="true"]'
    );
    if (!initiallyActiveTab && tabs.length > 0) {
      initiallyActiveTab = tabs[0];
    }

    if (initiallyActiveTab) {
      activateTab(initiallyActiveTab, false);
    }
  }

  function activateTab(tabToActivate, setFocus) {
    if (!tabToActivate) return;

    tabs.forEach((t) => {
      const isCurrentTabToActivate = t === tabToActivate;
      t.setAttribute("aria-selected", isCurrentTabToActivate.toString());
      t.setAttribute("tabindex", isCurrentTabToActivate ? "0" : "-1");
      t.classList.toggle("active", isCurrentTabToActivate);

      const panelId = t.getAttribute("aria-controls");
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.hidden = !isCurrentTabToActivate;
      }
    });

    if (setFocus) {
      tabToActivate.focus({ preventScroll: true });
    }
    updateArrowButtonsState();
  }

  function getNextTab(currentTab, key) {
    const tabNodes = Array.from(tabs);
    let index = tabNodes.indexOf(currentTab);
    if (index === -1) return null;

    if (key === "ArrowRight") {
      index = (index + 1) % tabNodes.length;
    } else if (key === "ArrowLeft") {
      index = (index - 1 + tabNodes.length) % tabNodes.length;
    }
    return tabNodes[index];
  }

  // --- EVENT HANDLERS ---
  async function handleStartRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (errorMessageDiv)
        showMessage(
          errorMessageDiv,
          "Microphone access is not supported by your browser.",
          true
        );
      if (recordingStatus)
        recordingStatus.textContent = "Error: Feature not supported.";
      if (startRecordingBtn) startRecordingBtn.disabled = true;
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      visualizer.classList.add("visible");
      waveformIcon.classList.add("hidden");
      voiceContainerTitle.style.display = "none";
      voiceContainerP.style.display = "none";

      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      visualize();

      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        await sendAudioToBackend(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorder.start();

      if (recordingStatus) recordingStatus.textContent = "Recording...";
      if (startRecordingBtn) startRecordingBtn.disabled = true;
      if (stopRecordingBtn) stopRecordingBtn.disabled = false;
      if (errorMessageDiv) hideMessage(errorMessageDiv);
    } catch (error) {
      let userMessage =
        "Error: Could not access microphone. Please ensure it's connected and permissions are granted.";
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        userMessage =
          "Microphone access denied. Please grant permission in your browser settings.";
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        userMessage = "No microphone found. Please connect a microphone.";
      }
      if (recordingStatus)
        recordingStatus.textContent = "Error: Mic access issue.";
      if (errorMessageDiv) showMessage(errorMessageDiv, userMessage, true);
      if (startRecordingBtn) startRecordingBtn.disabled = false;
      if (stopRecordingBtn) stopRecordingBtn.disabled = true;
    }
  }

  function handleStopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();

      cancelAnimationFrame(animationFrameId);
      visualizerContext.clearRect(0, 0, visualizer.width, visualizer.height);
      if (processingOverlay) {
        processingOverlay.hidden = false;
      }

      if (recordingStatus) recordingStatus.textContent = "Processing audio...";
      if (startRecordingBtn) startRecordingBtn.disabled = true;
      if (stopRecordingBtn) stopRecordingBtn.disabled = true;
    }
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    if (errorMessageDiv) hideMessage(errorMessageDiv);

    const formData = new FormData(predictionForm);
    const features = {};
    let isValid = true;
    let firstInvalidField = null;

    for (let [name, value] of formData.entries()) {
      const inputElement = predictionForm.elements[name];
      if (String(value).trim() === "" || isNaN(parseFloat(value))) {
        isValid = false;
        if (!firstInvalidField) {
          firstInvalidField = inputElement;
        }
      } else {
        features[name] = parseFloat(value);
      }
    }

    if (!isValid && firstInvalidField) {
      const fieldTabPane = firstInvalidField.closest(".tab-pane");
      if (fieldTabPane && fieldTabPane.hidden) {
        const tabButton = document.getElementById(
          fieldTabPane.getAttribute("aria-labelledby")
        );
        if (tabButton) activateTab(tabButton, false);
      }
      showMessage(
        errorMessageDiv,
        `Please enter a valid number for <strong>${
          firstInvalidField.labels[0]?.textContent || firstInvalidField.name
        }</strong>.`,
        true
      );
      firstInvalidField.focus();
      return;
    }

    const submitButton = predictionForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.querySelector("span").textContent = "Processing...";
    }

    try {
      const response = await fetch(
        "https://your-backend-name.onrender.com/predict",
        {
          // <<< CHANGE THIS
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ features }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Prediction failed: ${response.statusText}`
        );
      }
      response = await fetch(
        "https://your-backend-name.onrender.com/extract-features",
        { method: "POST", body: formData }
      ); // <<< CHANGE THIS
      localStorage.setItem(
        "parkinsonsPrediction",
        JSON.stringify({
          prediction: data.prediction,
          probability: data.probability,
          inputFeatures: features,
          timestamp: new Date().toISOString(),
        })
      );
      localStorage.setItem("triggerChatbotSummary", "true");
      window.location.href = "report_dashboard.html";
    } catch (error) {
      showMessage(
        errorMessageDiv,
        `Prediction failed: ${error.message}. Please check your inputs and try again.`,
        true
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.querySelector("span").textContent = "Get Prediction";
      }
    }
  }

  // --- HELPER FUNCTIONS ---
  function visualize() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    visualizer.width = visualizer.offsetWidth;
    visualizer.height = visualizer.offsetHeight;

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      visualizerContext.clearRect(0, 0, visualizer.width, visualizer.height);
      visualizerContext.lineWidth = 2;
      visualizerContext.strokeStyle = `rgba(${getComputedStyle(
        document.documentElement
      ).getPropertyValue("--color-primary-rgb")}, 0.7)`;
      visualizerContext.beginPath();

      const sliceWidth = (visualizer.width * 1.0) / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * visualizer.height) / 2;
        if (i === 0) {
          visualizerContext.moveTo(x, y);
        } else {
          visualizerContext.lineTo(x, y);
        }
        x += sliceWidth;
      }
      visualizerContext.lineTo(visualizer.width, visualizer.height / 2);
      visualizerContext.stroke();
    };
    draw();
  }

  async function sendAudioToBackend(audioBlob) {
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "recording.webm");

    try {
      const response = await fetch("http://localhost:8000/extract-features", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            `Feature extraction failed: ${response.statusText}`
        );
      }
      const data = await response.json();
      if (data.features) {
        manualInputWrapper.classList.add("visible");
        voiceFirstContainer.style.display = "none";
        populateFormWithFeatures(data.features);
        if (recordingStatus)
          recordingStatus.textContent =
            "Features extracted. Ready for prediction.";
        if (tabs.length > 0) activateTab(tabs[0], true);
      } else {
        throw new Error(data.message || "Backend did not return features.");
      }
    } catch (error) {
      showMessage(
        errorMessageDiv,
        `Audio processing failed: ${error.message}. Please try manual entry or record again.`,
        true
      );
      if (recordingStatus)
        recordingStatus.textContent = "Error processing audio.";
    } finally {
      if (processingOverlay) processingOverlay.hidden = true;
      if (voiceFirstContainer.style.display !== "none") {
        startRecordingBtn.disabled = false;
        stopRecordingBtn.disabled = true;
        if (recordingStatus) recordingStatus.textContent = "Ready to record.";
        visualizer.classList.remove("visible");
        waveformIcon.classList.remove("hidden");
        voiceContainerTitle.style.display = "block";
        voiceContainerP.style.display = "block";
      }
    }
  }

  function populateFormWithFeatures(features) {
    predictionForm.reset();
    Object.keys(features).forEach((key) => {
      const inputElement = document.getElementById(key);
      if (inputElement) {
        inputElement.value = features[key];
        inputElement.style.backgroundColor = `rgba(${getComputedStyle(
          document.documentElement
        ).getPropertyValue("--color-primary-rgb")}, 0.08)`;
      }
    });
    if (tabs.length > 0) {
      const firstPopulatedInput = document.getElementById(
        Object.keys(features)[0]
      );
      const tabPane = firstPopulatedInput?.closest(".tab-pane");
      const tabButton = tabPane
        ? document.getElementById(tabPane.getAttribute("aria-labelledby"))
        : tabs[0];
      activateTab(tabButton, true);
    }
  }

  function showMessage(element, message, isError) {
    if (!element) return;
    element.innerHTML = message;
    element.classList.toggle("error", isError);
    element.classList.add("show");
    element.setAttribute("role", isError ? "alert" : "status");
  }

  function hideMessage(element) {
    if (!element) return;
    element.innerHTML = "";
    element.classList.remove("show", "error");
    element.removeAttribute("role");
  }

  // --- START THE APP ---
  init();
});
