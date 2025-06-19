// popup.js

console.log("Popup script loaded........");
document.addEventListener("DOMContentLoaded", function () {
  let currentTabId = null; // Variable to store the retrieved tab ID

  // Get the stored activeTabId as soon as the popup loads
  chrome.storage.local.get("activeTabId").then((result) => {
    if (result.activeTabId) {
      currentTabId = result.activeTabId;
      console.log("Retrieved active tab ID:", currentTabId);
    } else {
      console.error("No active tab ID found in storage.");
      showMessageBox("Could not determine the active tab for summarization.");
    }
  }).catch(error => {
    console.error("Error retrieving active tab ID:", error);
    showMessageBox("Error preparing summarizer.");
  });


  document.getElementById("summarizePageBtn").addEventListener("click", () => {
    if (!currentTabId) {
      showMessageBox("Please wait, still determining the active tab.");
      return;
    }
    const model = document.getElementById("modelSelect").value;
    console.log("Summarizing page with model:", model);
    console.log("summarizePageBtn clicked");

    // Show loading indicator
    document.getElementById("summaryOutput").innerHTML = "<p>Loading summary...</p>";

    // Use the stored currentTabId here
    chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      files: ["content.js"]
    }).then(() => {
      return chrome.scripting.executeScript({
        target: { tabId: currentTabId },
        func: getPageContentWrapper
      });
    }).then(results => {
      const content = results[0].result;
      sendToOllama(content, model, "page");
    }).catch(err => {
      console.error("Failed to extract page content:", err);
      showMessageBox("Failed to extract page content.");
      document.getElementById("summaryOutput").innerHTML = "<p>Error extracting content.</p>";
    });
  });

  document.getElementById("summarizeVideoBtn").addEventListener("click", () => {
    if (!currentTabId) {
      showMessageBox("Please wait, still determining the active tab.");
      return;
    }
    const model = document.getElementById("modelSelect").value;
    console.log("Summarizing page with model:", model);
    console.log("summarizeVideoBtn clicked");

    // Show loading indicator
    document.getElementById("summaryOutput").innerHTML = "<p>Loading summary...</p>";

    // Use the stored currentTabId here
    chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      files: ["content.js"]
    }).then(() => {
      return chrome.scripting.executeScript({
        target: { tabId: currentTabId },
        func: getVideoTranscriptWrapper
      });
    }).then(results => {
      const transcript = results[0].result;
      sendToOllama(transcript, model, "video");
    }).catch(err => {
      console.error("Failed to extract video transcript:", err);
      showMessageBox("Failed to extract video transcript.");
      document.getElementById("summaryOutput").innerHTML = "<p>Error extracting transcript.</p>";
    });
  });
});

// Wrapper functions needed because popup can't directly reference getPageContent
function getPageContentWrapper() {
  return window.getPageContent();
}

function getVideoTranscriptWrapper() {
  return window.getVideoTranscript();
}

// Communicate with local Ollama API
function sendToOllama(inputText, model, type) {

    const prompt = type === "page"
    ? `Summarize the following webpage content comprehensively in bullet points:\n\n${inputText}`
    : `Summarize the following YouTube video transcript comprehensively in bullet points:\n\n${inputText}`;

    console.log("======================");
    console.log(JSON.stringify({model: model,prompt: prompt,stream: false})); // debug output
    console.log("======================");

    fetch("http://localhost:3000/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false
    })
  })
    .then(res => {
        console.log("=====>Response status:", res.status); // debug output
        if (!res.ok) {
            throw new Error("HTTP error! status: " + res.status);
        }
        return res.text(); // get raw text first
        })
        .then(text => {
        console.log("Raw response:", text); // debug output
        const data = JSON.parse(text);

        // --- NEW: Markdown parsing and sanitization ---
        // Ensure that `marked` and `DOMPurify` are loaded from popup.html
        if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
          const rawMarkdown = data.response || "No summary provided.";
          // Convert Markdown to HTML
          const html = marked.parse(rawMarkdown);
          // Sanitize the HTML to prevent XSS attacks
          const cleanHtml = DOMPurify.sanitize(html);
          document.getElementById("summaryOutput").innerHTML = cleanHtml;
        } else {
          // Fallback if marked or DOMPurify are not loaded
          console.warn("Marked.js or DOMPurify.js not loaded. Displaying raw text.");
          document.getElementById("summaryOutput").innerText = data.response;
        }
        // --- END NEW ---

        })
    .catch(err => {
      console.error("Fetch error:", err);
      showMessageBox("Error contacting Ollama. Make sure it's running and the proxy is active on port 3000.");
      document.getElementById("summaryOutput").innerHTML = "<p>Error during summarization. Check console for details.</p>";
    });
}

// Function to display a message using a custom message box (instead of alert)
function showMessageBox(message) {
  const messageBox = document.createElement("div");
  messageBox.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
    padding: 15px;
    border-radius: 5px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    text-align: center;
    box-shadow: 0 0 10px rgba(0,0,0,0.2);
  `;
  messageBox.innerText = message;
  document.body.appendChild(messageBox);

  setTimeout(() => {
    document.body.removeChild(messageBox);
  }, 3000); // Remove after 3 seconds
}
