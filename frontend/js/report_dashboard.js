document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Element Selection ---
  const summaryCard = document.getElementById("prediction-summary-pro");
  const featureTableBody = document.getElementById("feature-table-body-pro");
  const downloadPdfBtn = document.getElementById("download-pdf-btn-pro");
  const loadingOverlay = document.getElementById("loading-overlay"); // Ensure this ID is correct in HTML
  const goToChatbotBtn = document.getElementById("go-to-chatbot-btn-pro");
  const actionsDiv = document.querySelector(".report-actions-pro"); // Ensure this class is correct in HTML
  const reportContainer = document.querySelector(".report-pro-container");

  const themeToggleButton = document.getElementById("theme-toggle");
  const body = document.body;
  const mainNav = document.querySelector(".main-nav");
  const mainContent = document.querySelector(".main-content");

  const handleThemeToggle = () => {
    body.classList.toggle("light-mode");
    const currentTheme = body.classList.contains("light-mode")
      ? "light"
      : "dark";
    localStorage.setItem("theme", currentTheme);
  };

  const handleNavScroll = () => {
    if (!mainContent || !mainNav) return;
    mainNav.classList.toggle("scrolled", mainContent.scrollTop > 10);
  };

  const initializeTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      body.classList.add("light-mode");
    }
  };

  // --- Initialize Theme & Event Listeners ---
  initializeTheme();
  themeToggleButton.addEventListener("click", handleThemeToggle);
  if (mainContent) {
    mainContent.addEventListener("scroll", handleNavScroll);
  }

  // --- Initial Check for Prediction Data from LocalStorage ---
  const predictionData = JSON.parse(
    localStorage.getItem("parkinsonsPrediction")
  );

  if (predictionData) {
    displayReport(predictionData);
    // Clear the flag from localStorage as the summary is now displayed on the report page
    localStorage.removeItem("triggerChatbotSummary");
    console.log("triggerChatbotSummary flag removed by report_dashboard.js.");
  } else {
    handleNoData();
  }

  /**
   * Main function to render the entire report.
   * @param {object} data The prediction data from localStorage.
   */
  function displayReport(data) {
    renderSummaryCard(data);
    populateFeatureTable(data.inputFeatures);

    // --- Ensure downloadPdfBtn exists before adding listener ---
    if (downloadPdfBtn) {
      downloadPdfBtn.addEventListener("click", () => generatePdf(data));
    } else {
      console.error(
        "Download PDF button not found. PDF generation will not work."
      );
    }

    if (goToChatbotBtn) {
      goToChatbotBtn.addEventListener("click", navigateToChatbot);
    } else {
      console.error("Go to Chatbot button not found.");
    }
  }

  /**
   * Renders the main summary card with a gauge chart using dynamic data.
   * @param {object} data The prediction data.
   */
  function renderSummaryCard(data) {
    // Correctly use the dynamic data from the backend model
    const isParkinsons = data.prediction === 1;
    const probability = data.probability; // The raw probability (e.g., 0.7996)

    const statusClass = isParkinsons
      ? "parkinsons-positive"
      : "parkinsons-negative";
    const iconClass = isParkinsons
      ? "ph-bold ph-warning-circle"
      : "ph-bold ph-check-circle";
    const statusText = isParkinsons ? "High Likelihood" : "Low Likelihood";
    const summaryText = isParkinsons
      ? `Based on the analysis, the vocal markers show a high correlation with those common in Parkinson's Disease. A discussion with a healthcare professional is strongly recommended.`
      : `The analysis indicates that the vocal markers fall within a range typically considered healthy. Continue to monitor your health as advised by a professional.`;

    summaryCard.classList.add(statusClass);
    summaryCard.innerHTML = `
        <div class="gauge-container">
            ${createGauge(probability)}
        </div>
        <div class="result-heading">
            <i class="${iconClass} icon"></i>
            <span>${statusText}</span>
        </div>
        <p class.result-summary-text">${summaryText}</p>
    `;
  }

  /**
   * Creates the SVG for the gauge chart.
   * @param {number} value The probability value (0 to 1).
   */
  function createGauge(value) {
    const radius = 80;
    const strokeWidth = 22;
    const cx = 100;
    const cy = 100;
    const pathD = `M ${cx - radius},${cy} A ${radius},${radius} 0 0 1 ${
      cx + radius
    },${cy}`;
    const circumference = Math.PI * radius;
    const dashOffset = circumference * (1 - value);
    const color = value >= 0.5 ? "#e57373" : "#81c784";
    const percentageText = (value * 100).toFixed(0) + "%";

    return `
        <svg viewBox="0 0 200 110" width="200" height="110">
            <path class="gauge-bg" d="${pathD}" stroke-width="${strokeWidth}" fill="none"></path>
            <path class="gauge-fill" d="${pathD}" 
                  stroke="${color}" 
                  stroke-dasharray="${circumference}" 
                  stroke-dashoffset="${dashOffset}"
                  stroke-width="${strokeWidth}" fill="none"></path>
            <text x="100" y="${
              cy - 15
            }" class="gauge-text" text-anchor="middle">${percentageText}</text>
            <text x="100" y="${
              cy + 5
            }" class="gauge-label" text-anchor="middle">Probability</text>
        </svg>
      `;
  }

  /**
   * Populates the detailed feature analysis table using dynamic data.
   * @param {object} features The input features from the prediction data.
   */
  function populateFeatureTable(features) {
    featureTableBody.innerHTML = "";
    const ranges = getFeatureRanges(); // Using the original ranges logic

    for (const featureName in features) {
      if (features.hasOwnProperty(featureName)) {
        const value = features[featureName];
        const rangeInfo = ranges[featureName] || {};
        const { status, className } = getFeatureStatus(value, rangeInfo);

        const row = featureTableBody.insertRow();
        row.innerHTML = `
          <td>${featureName}</td>
          <td class="value-cell">${value.toFixed(4)}</td>
          <td>${rangeInfo.display || "N/A"}</td>
          <td class="status-cell-pro ${className}">
              <div class="status-indicator-pro"></div>
              <span>${status}</span>
          </td>
        `;
      }
    }
  }

  /**
   * Determines the status and class for a given feature value based on original logic.
   * @returns {{status: string, className: string}}
   */
  function getFeatureStatus(value, range) {
    if (!range.healthy) return { status: "N/A", className: "" };

    // This logic directly mirrors the original JS to ensure consistency
    if (
      (range.type === "high_is_pd" && value > range.healthy[1]) ||
      (range.type === "low_is_pd" && value < range.healthy[0]) ||
      (range.type === "low_is_pd_negative" && value < range.healthy[0]) ||
      (range.type === "range" &&
        (value < range.healthy[0] || value > range.healthy[1]))
    ) {
      return { status: "Outside Range", className: "value-out-of-range" };
    }
    return { status: "Normal", className: "value-in-range" };
  }

  /**
   * Handles the PDF generation process.
   * @param {object} data The prediction data (unused here, but can be passed for context)
   */
  async function generatePdf(data) {
    // Data parameter is optional if not used directly
    // --- FIX: Check if elements exist before accessing .style ---
    if (loadingOverlay) {
      loadingOverlay.style.display = "flex";
    } else {
      console.error("Error: loadingOverlay element not found.");
      alert("Failed to generate PDF. Loading indicator missing.");
      return; // Exit if critical element is missing
    }

    if (actionsDiv) {
      actionsDiv.style.opacity = "0";
    } else {
      console.warn("Warning: actionsDiv element not found."); // Not critical to stop, but good to know
    }

    await new Promise((resolve) => setTimeout(resolve, 300)); // Small delay for UI update

    const contentToCapture = document.getElementById(
      "report-content-to-capture"
    );
    if (!contentToCapture) {
      console.error("Error: Content to capture for PDF not found.");
      alert("Failed to generate PDF. Report content missing.");
      return;
    }

    try {
      const canvas = await html2canvas(contentToCapture, {
        scale: 2, // Higher scale for better resolution in PDF
        useCORS: true,
        backgroundColor: document.body.classList.contains("light-mode")
          ? "#ffffff"
          : "#0d1117", // Match theme
      });

      const imgData = canvas.toDataURL("image/png");

      // --- FIX: Correctly access jsPDF constructor ---
      // This is the most common and robust way to get jsPDF after it's loaded via UMD.
      // If `window.jspdf` is not defined, it will throw an error, caught by outer try-catch.
      const pdf = new jspdf.jsPDF("p", "mm", "a4");

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Add image to PDF, handling multiple pages if content is long
      // This basic multi-page handling assumes the image is larger than one page.
      // For truly responsive multi-page content, a more advanced loop splitting the canvas is needed.
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      while (position < pdfHeight) {
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        position += pageHeight;
        if (position < pdfHeight) {
          pdf.addPage();
        }
      }

      pdf.save("parkinsons_analysis_report.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      // Provide a user-friendly message, not alert()
      const errorMessage = `Failed to generate PDF: ${error.message}. Please try again.`;
      // You could display this in a temporary message box or a dedicated error div
      console.warn(errorMessage); // Log to console for debugging
      alert(errorMessage); // Temporarily using alert for direct user feedback
    } finally {
      // --- FIX: Check if elements exist before accessing .style in finally block ---
      if (loadingOverlay) {
        loadingOverlay.style.display = "none";
      }
      if (actionsDiv) {
        actionsDiv.style.opacity = "1";
      }
    }
  }

  /**
   * Navigates to the chatbot page.
   */
  function navigateToChatbot(event) {
    event.preventDefault();
    localStorage.setItem("triggerChatbotSummary", "true");
    window.location.href = "chatbot.html";
  }

  /**
   * Displays a message when no prediction data is found.
   */
  function handleNoData() {
    reportContainer.innerHTML = `
      <div class="page-title-container">
          <h1>No Data Found</h1>
          <p>We couldn't find any prediction data to generate a report.</p>
      </div>
      <div class="report-actions-pro" style="justify-content:center; border-top: none; margin-top: var(--space-lg);">
           <a href="prediction.html" class="action-btn-pro primary">
              <i class="ph-bold ph-arrow-left"></i>
              <span>Perform a New Analysis</span>
          </a>
      </div>
    `;
  }

  /**
   * Centralizes the defined healthy ranges from the original logic.
   * @returns {object}
   */
  function getFeatureRanges() {
    return {
      "MDVP:Fo(Hz)": {
        healthy: [100, 180],
        type: "range",
        display: "100-180 Hz",
      },
      "MDVP:Fhi(Hz)": {
        healthy: [120, 550],
        type: "range",
        display: "120-550 Hz",
      },
      "MDVP:Flo(Hz)": {
        healthy: [60, 200],
        type: "range",
        display: "60-200 Hz",
      },
      "MDVP:Jitter(%)": {
        healthy: [0, 0.005],
        type: "high_is_pd",
        display: "< 0.5%",
      },
      "MDVP:Jitter(Abs)": {
        healthy: [0, 0.00005],
        type: "high_is_pd",
        display: "< 0.00005s",
      },
      "MDVP:RAP": {
        healthy: [0, 0.003],
        type: "high_is_pd",
        display: "< 0.003",
      },
      "MDVP:PPQ": {
        healthy: [0, 0.003],
        type: "high_is_pd",
        display: "< 0.003",
      },
      "Jitter:DDP": {
        healthy: [0, 0.01],
        type: "high_is_pd",
        display: "< 0.01",
      },
      "MDVP:Shimmer": {
        healthy: [0, 0.03],
        type: "high_is_pd",
        display: "< 0.03",
      },
      "MDVP:Shimmer(dB)": {
        healthy: [0, 0.3],
        type: "high_is_pd",
        display: "< 0.3 dB",
      },
      "Shimmer:APQ3": {
        healthy: [0, 0.015],
        type: "high_is_pd",
        display: "< 0.015",
      },
      "Shimmer:APQ5": {
        healthy: [0, 0.015],
        type: "high_is_pd",
        display: "< 0.015",
      },
      "MDVP:APQ": { healthy: [0, 0.02], type: "high_is_pd", display: "< 0.02" }, // Using placeholder's general healthy range
      "Shimmer:DDA": {
        healthy: [0, 0.05],
        type: "high_is_pd",
        display: "< 0.05",
      },
      NHR: { healthy: [0, 0.02], type: "high_is_pd", display: "< 0.02" },
      HNR: { healthy: [20, Infinity], type: "low_is_pd", display: "> 20 dB" },
      RPDE: { healthy: [0, 0.5], type: "high_is_pd", display: "< 0.5" }, // Using placeholder's general healthy range
      DFA: { healthy: [0, 0.7], type: "high_is_pd", display: "< 0.7" }, // Using placeholder's general healthy range
      spread1: {
        healthy: [-7.0, -4.5],
        type: "low_is_pd_negative",
        display: "> -7.0",
      }, // More negative is PD
      spread2: { healthy: [0, 0.2], type: "high_is_pd", display: "< 0.2" },
      D2: { healthy: [0, 2.5], type: "high_is_pd", display: "< 2.5" },
      PPE: { healthy: [0, 0.2], type: "high_is_pd", display: "< 0.2" },
    };
  }
});
