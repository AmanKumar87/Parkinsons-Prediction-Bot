document.addEventListener("DOMContentLoaded", () => {
  const predictionForm = document.getElementById("prediction-form");
  const errorMessageDiv = document.getElementById("error-message");

  // Voice recording elements
  const startRecordingBtn = document.getElementById("start-recording-btn");
  const stopRecordingBtn = document.getElementById("stop-recording-btn");
  const recordingStatus = document.getElementById("recording-status");

  let mediaRecorder;
  let audioChunks = [];
  let audioBlob; // To store the final audio blob

  const showMessage = (element, message, isError = false) => {
    element.innerHTML = message;
    element.classList.add("show");
    if (isError) {
      element.classList.add("error");
    } else {
      element.classList.remove("error");
    }
  };

  const hideMessage = (element) => {
    element.innerHTML = "";
    element.classList.remove("show", "error");
  };

  // --- Voice Recording Functions ---
  startRecordingBtn.addEventListener("click", async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        audioBlob = new Blob(audioChunks, { type: "audio/webm" }); // Use webm for broader compatibility
        console.log("Audio recorded:", audioBlob);
        recordingStatus.textContent = "Audio recorded. Processing...";

        // Now, send the audio to a new backend endpoint
        await sendAudioToBackend(audioBlob);
      };

      mediaRecorder.start();
      recordingStatus.textContent = "Recording...";
      startRecordingBtn.disabled = true;
      stopRecordingBtn.disabled = false;
      hideMessage(errorMessageDiv); // Clear any previous errors
    } catch (error) {
      console.error("Error accessing microphone:", error);
      recordingStatus.textContent = "Error: Could not access microphone.";
      showMessage(
        errorMessageDiv,
        "Error: Could not access microphone. Please ensure it's connected and permissions are granted.",
        true
      );
      startRecordingBtn.disabled = false;
      stopRecordingBtn.disabled = true;
    }
  });

  stopRecordingBtn.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      recordingStatus.textContent = "Stopping recording...";
      startRecordingBtn.disabled = false;
      stopRecordingBtn.disabled = true;
    }
  });

  async function sendAudioToBackend(audioBlob) {
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "recording.webm");

    recordingStatus.textContent = "Uploading audio for feature extraction...";
    try {
      // This is a new endpoint for raw audio, NOT the /predict endpoint yet
      const response = await fetch("http://localhost:8000/extract-features", {
        method: "POST",
        body: formData, // No Content-Type header needed for FormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `HTTP error! Status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Features extracted by backend:", data);

      if (data.features) {
        // If features are successfully extracted, populate the form and then submit it for prediction
        populateFormWithFeatures(data.features);
        recordingStatus.textContent =
          "Features extracted. Ready for prediction.";
        // Optionally, automatically submit the form after populating.
        // predictionForm.requestSubmit(); // This triggers the form's submit event listener
      } else {
        showMessage(
          errorMessageDiv,
          "Backend could not extract features. Please try again.",
          true
        );
        recordingStatus.textContent = "Error extracting features.";
      }
    } catch (error) {
      console.error("Error sending audio or extracting features:", error);
      showMessage(
        errorMessageDiv,
        `Audio processing failed: ${error.message}. Please try again.`,
        true
      );
      recordingStatus.textContent = "Error processing audio.";
    }
  }

  function populateFormWithFeatures(features) {
    // Clear any existing form values
    predictionForm.reset();

    for (const key in features) {
      if (features.hasOwnProperty(key)) {
        const inputElement = document.getElementById(key); // Ensure input IDs match feature keys
        if (inputElement) {
          inputElement.value = features[key];
          // You might want to visually indicate these were filled by voice
          inputElement.style.backgroundColor = "#e6ffe6"; // Light green background
        } else {
          console.warn(`Input element for feature "${key}" not found.`);
        }
      }
    }
  }

  // --- Original Form Submission Functions (now also used after voice input) ---
  predictionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("Form submission intercepted.");

    hideMessage(errorMessageDiv);

    const formData = new FormData(predictionForm);
    const features = {};
    let isValid = true;

    console.log("Collecting and validating form data...");
    for (let [name, value] of formData.entries()) {
      const numValue = parseFloat(value);

      if (isNaN(numValue)) {
        showMessage(
          errorMessageDiv,
          `Please enter a valid number for <strong>${name}</strong>.`,
          true
        );
        isValid = false;
        console.error(
          `Validation failed for ${name}: "${value}" is not a number.`
        );
        break;
      }
      features[name] = numValue;
    }

    if (!isValid) {
      console.log("Form validation failed. Stopping prediction process.");
      return;
    }

    console.log("Validation successful. Collected features:", features);
    console.log("Sending POST request to /predict endpoint...");

    try {
      const response = await fetch("http://localhost:8000/predict", {
        // Ensure this URL is correct
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ features: features }),
      });

      console.log("Response received from /predict. Checking status...");
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Backend error (${response.status}):`, errorData);
        throw new Error(
          errorData.detail ||
            `Prediction failed with status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Prediction successful. Data received:", data);

      const dataToStore = {
        prediction: data.prediction,
        probability: data.probability,
        inputFeatures: features,
      };
      localStorage.setItem("parkinsonsPrediction", JSON.stringify(dataToStore));
      localStorage.setItem("triggerChatbotSummary", "true");
      console.log(
        "Prediction data and summary trigger flag saved to localStorage."
      );

      window.location.href = "report_dashboard.html";
    } catch (error) {
      console.error("Error during prediction process (caught):", error);
      showMessage(
        errorMessageDiv,
        `Prediction failed: ${error.message}. Please ensure the backend is running and all input values are valid.`,
        true
      );
    }
    console.log("End of prediction form submission handler.");
  });
});
