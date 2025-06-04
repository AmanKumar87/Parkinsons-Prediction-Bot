// Ensure marked.js is loaded in report_dashboard.html <head>
// <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
// Removed Chart.js and annotation plugin imports as they are not used

document.addEventListener("DOMContentLoaded", () => {
  const predictionSummaryDiv = document.getElementById("prediction-summary");
  const featureTableBody = document.querySelector("#feature-table tbody");
  const downloadPdfBtn = document.getElementById("download-pdf-btn");
  const loadingOverlay = document.getElementById("loading-overlay");

  // Get the "Go to Chatbot" button by ID
  const goToChatbotBtn = document.getElementById("go-to-chatbot-btn");

  // NEW: Get the report actions container
  const reportActionsDiv = document.querySelector(".report-actions");

  const predictionData = JSON.parse(
    localStorage.getItem("parkinsonsPrediction")
  );

  if (predictionData) {
    // Determine summary message based on prediction outcome
    const isParkinsons = predictionData.prediction === 1;
    const probability = (predictionData.probability * 100).toFixed(2);
    let summaryMessageMarkdown = "";
    let summaryClass = "";

    if (isParkinsons) {
      summaryMessageMarkdown = `### Likelihood of Parkinson's: <span style="color: #c62828;">HIGH</span>

Based on the provided vocal features, our model indicates a **${probability}% probability** of Parkinson's Disease.

**Disclaimer:** This result is for informational purposes only. For an accurate diagnosis, consult a healthcare professional.`;
      summaryClass = "parkinsons-positive";
    } else {
      summaryMessageMarkdown = `### Likelihood of Parkinson's: <span style="color: #2e7d32;">LOW</span>

Based on the provided vocal features, our model indicates a **${probability}% probability** of Parkinson's Disease (meaning a high probability of being healthy).

**Disclaimer:** This result is for informational purposes only. If you have concerns, consult a healthcare professional.`;
      summaryClass = "parkinsons-negative";
    }

    // Apply markdown parsing to the summary message
    predictionSummaryDiv.innerHTML = marked.parse(summaryMessageMarkdown);
    predictionSummaryDiv.classList.add(summaryClass);
    predictionSummaryDiv.classList.add("show");

    // Define ranges for table (visualization part of ranges object is no longer used for charts)
    const ranges = {
      "MDVP:Fo(Hz)": {
        healthy: [100, 180],
        parkinsons: [80, 160],
        type: "range",
      },
      "MDVP:Fhi(Hz)": {
        healthy: [120, 550],
        parkinsons: [90, 300],
        type: "range",
      },
      "MDVP:Flo(Hz)": {
        healthy: [60, 200],
        parkinsons: [50, 180],
        type: "range",
      },
      "MDVP:Jitter(%)": {
        healthy: [0.001, 0.005],
        parkinsons: [0.005, 0.05],
        type: "high_is_pd",
      },
      "MDVP:Jitter(Abs)": {
        healthy: [0.00001, 0.00005],
        parkinsons: [0.00005, 0.001],
        type: "high_is_pd",
      },
      "MDVP:RAP": {
        healthy: [0.0005, 0.003],
        parkinsons: [0.003, 0.03],
        type: "high_is_pd",
      },
      "MDVP:PPQ": {
        healthy: [0.0005, 0.003],
        parkinsons: [0.003, 0.03],
        type: "high_is_pd",
      },
      "Jitter:DDP": {
        healthy: [0.0015, 0.01],
        parkinsons: [0.01, 0.1],
        type: "high_is_pd",
      },
      "MDVP:Shimmer": {
        healthy: [0.005, 0.03],
        parkinsons: [0.03, 0.2],
        type: "high_is_pd",
      },
      "MDVP:Shimmer(dB)": {
        healthy: [0.05, 0.3],
        parkinsons: [0.3, 2.0],
        type: "high_is_pd",
      },
      "Shimmer:APQ3": {
        healthy: [0.002, 0.015],
        parkinsons: [0.015, 0.08],
        type: "high_is_pd",
      },
      "Shimmer:APQ5": {
        healthy: [0.003, 0.015],
        parkinsons: [0.015, 0.08],
        type: "high_is_pd",
      },
      "MDVP:APQ": {
        healthy: [0.005, 0.02],
        parkinsons: [0.02, 0.2],
        type: "high_is_pd",
      },
      "Shimmer:DDA": {
        healthy: [0.006, 0.05],
        parkinsons: [0.05, 0.2],
        type: "high_is_pd",
      },
      NHR: {
        healthy: [0.0001, 0.02],
        parkinsons: [0.02, 0.5],
        type: "high_is_pd",
      },
      HNR: { healthy: [20, 35], parkinsons: [0, 20], type: "low_is_pd" },
      RPDE: { healthy: [0.3, 0.5], parkinsons: [0.5, 0.8], type: "high_is_pd" },
      DFA: { healthy: [0.5, 0.7], parkinsons: [0.7, 0.9], type: "high_is_pd" },
      spread1: {
        healthy: [-7.0, -5.0],
        parkinsons: [-10.0, -5.0],
        type: "low_is_pd_negative",
      },
      spread2: {
        healthy: [0.1, 0.2],
        parkinsons: [0.2, 0.6],
        type: "high_is_pd",
      },
      D2: { healthy: [1.5, 2.5], parkinsons: [2.5, 4.0], type: "high_is_pd" },
      PPE: { healthy: [0.05, 0.2], parkinsons: [0.2, 0.8], type: "high_is_pd" },
    };

    // Populate detailed feature table
    const inputFeatures = predictionData.inputFeatures;

    for (const featureName in inputFeatures) {
      if (inputFeatures.hasOwnProperty(featureName)) {
        const value = inputFeatures[featureName];
        const row = featureTableBody.insertRow();
        const featureCell = row.insertCell(0);
        const valueCell = row.insertCell(1);
        const statusCell = row.insertCell(2);

        featureCell.textContent = featureName;
        valueCell.textContent = value.toFixed(5);

        let status = "Within healthy range";
        let className = "value-in-range";

        const range = ranges[featureName];
        if (range) {
          if (range.type === "high_is_pd") {
            if (value > range.healthy[1]) {
              status = `Elevated (common in PD)`;
              className = "value-out-of-range";
            }
          } else if (range.type === "low_is_pd") {
            if (value < range.healthy[0]) {
              status = `Lower (common in PD)`;
              className = "value-out-of-range";
            }
          } else if (range.type === "low_is_pd_negative") {
            if (value < range.healthy[0]) {
              status = `More negative (common in PD)`;
              className = "value-out-of-range";
            }
          } else if (range.type === "range") {
            if (value < range.healthy[0] || value > range.healthy[1]) {
              status = `Outside typical healthy range`;
              className = "value-out-of-range";
            }
          }
        }
        statusCell.textContent = status;
        valueCell.classList.add(className);
        statusCell.classList.add(className);
      }
    }

    // Clear the flag from localStorage as the summary is now displayed on the report page
    localStorage.removeItem("triggerChatbotSummary");
    console.log("triggerChatbotSummary flag removed by report_dashboard.js.");

    // PDF Download functionality
    downloadPdfBtn.addEventListener("click", async () => {
      loadingOverlay.style.display = "flex"; // Show loading overlay

      // NEW: Temporarily hide buttons
      if (reportActionsDiv) {
        reportActionsDiv.style.display = "none";
      }

      // A small delay to ensure all DOM elements are rendered before capturing
      await new Promise((resolve) => setTimeout(resolve, 500));

      const reportContainer = document.querySelector(
        ".report-dashboard-container"
      );

      html2canvas(reportContainer, {
        scale: 2, // Increase resolution for better PDF quality
        useCORS: true, // Allow cross-origin images (if any)
        logging: true, // Enable logging for debugging
      })
        .then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new window.jspdf.jsPDF("p", "mm", "a4"); // 'p' for portrait, 'mm' for millimeters, 'a4' size
          const imgWidth = 210; // A4 width in mm
          const pageHeight = 297; // A4 height in mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          let position = 0;

          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;

          // For multi-page PDF if content is too long
          while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
          }

          pdf.save("parkinsons_report.pdf");
        })
        .catch((error) => {
          console.error("Error generating PDF:", error);
          alert(
            "Failed to generate PDF. Please try again or check console for errors."
          );
        })
        .finally(() => {
          // Ensure buttons are shown again regardless of success/failure
          loadingOverlay.style.display = "none"; // Hide loading overlay
          if (reportActionsDiv) {
            reportActionsDiv.style.display = "flex"; // Show buttons again
          }
        });
    });

    // Event listener for "Go to Chatbot" button
    if (goToChatbotBtn) {
      goToChatbotBtn.addEventListener("click", (event) => {
        event.preventDefault(); // Prevent default link navigation
        console.log(
          "Go to Chatbot button clicked. Ensuring trigger is set and redirecting."
        );
        // Ensure the flag is set just before navigating
        localStorage.setItem("triggerChatbotSummary", "true");
        window.location.href = "chatbot.html"; // Manual redirection
      });
    }
  } else {
    // Handle case where no prediction data is found in localStorage
    predictionSummaryDiv.innerHTML = `<p class="error-message show">No prediction data found. Please go back to the <a href="prediction.html">prediction page</a> to submit your features.</p>`;
    predictionSummaryDiv.classList.add("show");
  }
});
