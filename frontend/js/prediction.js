// document.addEventListener("DOMContentLoaded", () => {
//   const predictionForm = document.getElementById("prediction-form");
//   const errorMessageDiv = document.getElementById("error-message");

//   const showMessage = (element, message, isError = false) => {
//     element.innerHTML = message;
//     element.classList.add("show");
//     if (isError) {
//       element.classList.add("error");
//     } else {
//       element.classList.remove("error");
//     }
//   };

//   const hideMessage = (element) => {
//     element.innerHTML = "";
//     element.classList.remove("show", "error");
//   };

//   predictionForm.addEventListener("submit", async (event) => {
//     event.preventDefault(); // Prevent default form submission
//     console.log("Form submission intercepted (event.preventDefault() called).");

//     hideMessage(errorMessageDiv); // Clear any previous error messages

//     const features = {}; // Object to store collected input features
//     let isValid = true; // Flag for validation status

//     console.log("Collecting and validating form data...");
//     const formData = new FormData(predictionForm);

//     // Iterate through form fields to collect data and perform basic validation
//     for (let [name, value] of formData.entries()) {
//       const numValue = parseFloat(value);

//       if (isNaN(numValue)) {
//         showMessage(
//           errorMessageDiv,
//           `Please enter a valid number for <strong>${name}</strong>.`,
//           true
//         );
//         isValid = false; // Set flag to false if validation fails
//         console.error(
//           `Validation failed for <span class="math-inline">\{name\}\: "</span>{value}" is not a number.`
//         );
//         break; // Stop on first validation error
//       }
//       features[name] = numValue; // Store numerical value
//     }

//     if (!isValid) {
//       console.log("Form validation failed. Stopping prediction process.");
//       return; // Exit if validation failed
//     }

//     console.log("Validation successful. Collected features:", features);
//     console.log("Sending POST request to /predict endpoint...");

//     try {
//       // Send prediction request to your backend FastAPI
//       const response = await fetch("http://127.0.0.1:8000/predict", {
//         method: "POST", // Explicitly define POST method
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ features: features }),
//       });

//       console.log("Response received from /predict. Checking status...");
//       if (!response.ok) {
//         // If response is not OK (e.g., 400, 500 status)
//         const errorData = await response.json();
//         console.error(`Backend error (${response.status}):`, errorData);
//         throw new Error(
//           errorData.detail ||
//             `Prediction failed with status: ${response.status}`
//         );
//       }

//       const data = await response.json(); // Parse the JSON response from the backend
//       console.log("Prediction successful. Data received:", data);

//       // Store prediction results and input features in localStorage
//       const dataToStore = {
//         prediction: data.prediction,
//         probability: data.probability,
//         inputFeatures: features,
//       };
//       localStorage.setItem("parkinsonsPrediction", JSON.stringify(dataToStore));

//       // Set flag to trigger chatbot summary on next chatbot.html load
//       localStorage.setItem("triggerChatbotSummary", "true");
//       console.log(
//         "Prediction data and summary trigger flag saved to localStorage."
//       );

//       // Redirect to the report dashboard
//       window.location.href = "report_dashboard.html";
//     } catch (error) {
//       console.error("Error during prediction process (caught):", error); // Updated log message
//       showMessage(
//         errorMessageDiv,
//         `Prediction failed: ${error.message}. Please ensure the backend is running and all input values are valid.`,
//         true
//       );
//     }
//     console.log("End of prediction form submission handler.");
//   });
// });
document.addEventListener("DOMContentLoaded", () => {
  const predictionForm = document.getElementById("prediction-form");
  const errorMessageDiv = document.getElementById("error-message");

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
    event.preventDefault(); // Prevent default form submission
    console.log("Form submission intercepted (event.preventDefault() called).");

    hideMessage(errorMessageDiv); // Clear any previous error messages

    const features = {}; // Object to store collected input features
    let isValid = true; // Flag for validation status

    console.log("Collecting and validating form data...");
    const formData = new FormData(predictionForm);

    // Iterate through form fields to collect data and perform basic validation
    for (let [name, value] of formData.entries()) {
      const numValue = parseFloat(value);

      if (isNaN(numValue)) {
        showMessage(
          errorMessageDiv,
          `Please enter a valid number for <strong>${name}</strong>.`,
          true
        );
        isValid = false; // Set flag to false if validation fails
        console.error(
          `Validation failed for ${name}: "${value}" is not a number.`
        );
        break; // Stop on first validation error
      }
      features[name] = numValue; // Store numerical value
    }

    if (!isValid) {
      console.log("Form validation failed. Stopping prediction process.");
      return; // Exit if validation failed
    }

    console.log("Validation successful. Collected features:", features);
    console.log("Sending POST request to /predict endpoint...");

    try {
      // Send prediction request to your backend FastAPI
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST", // Explicitly define POST method
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ features: features }),
      });

      console.log("Response received from /predict. Checking status...");
      if (!response.ok) {
        // If response is not OK (e.g., 400, 500 status)
        const errorData = await response.json();
        console.error(`Backend error (${response.status}):`, errorData);
        throw new Error(
          errorData.detail ||
            `Prediction failed with status: ${response.status}`
        );
      }

      const data = await response.json(); // Parse the JSON response from the backend
      console.log("Prediction successful. Data received:", data);

      // Combine prediction data with input features before storing
      const dataToStore = {
        prediction: data.prediction,
        probability: data.probability,
        inputFeatures: features,
      };
      localStorage.setItem("parkinsonsPrediction", JSON.stringify(dataToStore));

      // Set flag to trigger chatbot summary on next chatbot.html load
      localStorage.setItem("triggerChatbotSummary", "true");
      console.log(
        "Prediction data and summary trigger flag saved to localStorage."
      );

      // Redirect to the report dashboard
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
