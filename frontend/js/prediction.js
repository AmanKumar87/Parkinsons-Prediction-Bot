document.addEventListener("DOMContentLoaded", () => {
  const predictionForm = document.getElementById("prediction-form");
  const errorMessageDiv = document.getElementById("error-message");

  // Function to show/hide error messages
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

  predictionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("Form submission prevented!");

    hideMessage(errorMessageDiv);

    const formData = new FormData(predictionForm);
    const features = {}; // This object will store the input features
    let isValid = true;

    console.log("Collecting form data...");

    for (let [name, value] of formData.entries()) {
      const inputElement = document.getElementById(name);
      const numValue = parseFloat(value);

      if (isNaN(numValue)) {
        showMessage(
          errorMessageDiv,
          `Please enter a valid number for <strong>${name}</strong>.`,
          true
        );
        isValid = false;
        console.error(`Validation error: ${name} is not a valid number.`);
        break;
      }

      features[name] = numValue; // Store the numerical value
    }

    if (!isValid) {
      console.log("Form validation failed, stopping submission.");
      return;
    }

    console.log("Form validation passed. Sending prediction request...");
    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ features: features }),
      });

      console.log("Fetch request completed. Checking response...");
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend response not OK:", response.status, errorData);
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log("Received data from backend:", data);

      // Combine prediction data with input features before storing
      const dataToStore = {
        prediction: data.prediction,
        probability: data.probability,
        inputFeatures: features, // Store the raw input features here
      };

      localStorage.setItem("parkinsonsPrediction", JSON.stringify(dataToStore));
      console.log(
        "Prediction and input data stored in localStorage. Redirecting..."
      );

      window.location.href = "report_dashboard.html";
    } catch (error) {
      console.error("Error during prediction fetch or processing:", error);
      showMessage(
        errorMessageDiv,
        `Prediction failed: ${error.message}. Please ensure the backend is running and input values are correct.`,
        true
      );
    }
    console.log("End of submit event listener.");
  });
});
