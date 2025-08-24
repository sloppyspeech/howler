// popup.js

console.log("Popup script loaded........");

// Declare global variables for timer and time display element
let timeTakenElement; // Will be initialized in DOMContentLoaded
let timerInterval = null; // Variable to hold the interval ID for the timer
let elapsedSeconds = 0; // Variable to track elapsed time for the ticker

// Function to start the time ticker (now globally accessible)
function startTimer() {
  elapsedSeconds = 0;
  if (timeTakenElement) { // Ensure element is available before updating
    timeTakenElement.innerText = `Time: 0.00 seconds`;
    timeTakenElement.style.visibility = 'visible';
    timeTakenElement.style.opacity = '1';
  }

  timerInterval = setInterval(() => {
    elapsedSeconds += 1; // Increment by 1 second
    if (timeTakenElement) { // Ensure element is available before updating
      timeTakenElement.innerText = `Time: ${elapsedSeconds.toFixed(0)} seconds`; // Display whole seconds
    }
  }, 1000); // Update every second
}

// Function to stop the time ticker (now globally accessible)
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Function to display a message using a custom message box (now globally accessible)
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

// Function to reset word counts
function resetWordCounts() {
    document.getElementById('inputWordCount').textContent = '0';
    document.getElementById('outputWordCount').textContent = '0';
}

document.addEventListener("DOMContentLoaded", function () {
  let currentTabId = null; // Variable to store the retrieved tab ID
  timeTakenElement = document.getElementById("timeTaken"); // Initialize the global time display element here

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
    resetWordCounts(); // Add this line at the start
    if (!currentTabId) {
      showMessageBox("Please wait, still determining the active tab.");
      return;
    }
    const model = document.getElementById("modelSelect").value;
    console.log("Summarizing page with model:", model);
    console.log("summarizePageBtn clicked");

    // Clear previous summary and time, show loading
    document.getElementById("summaryOutput").innerHTML = "<p>Loading summary...</p>";
    stopTimer(); // Stop any existing timer
    startTimer(); // Start new timer

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
      stopTimer(); // Stop timer on error
      console.error("Failed to extract page content:", err);
      showMessageBox("Failed to extract page content.");
      document.getElementById("summaryOutput").innerHTML = "<p>Error extracting content.</p>";
    });
  });

  document.getElementById("summarizeVideoBtn").addEventListener("click", () => {
    resetWordCounts(); // Add this line at the start
    if (!currentTabId) {
      showMessageBox("Please wait, still determining the active tab.");
      return;
    }
    const model = document.getElementById("modelSelect").value;
    console.log("Summarizing video with model:", model);
    console.log("summarizeVideoBtn clicked");

    // Clear previous summary and time, show loading
    document.getElementById("summaryOutput").innerHTML = "<p>Loading summary...</p>";
    stopTimer(); // Stop any existing timer
    startTimer(); // Start new timer

    chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      files: ["content.js"]
    }).then(() => {
      return chrome.scripting.executeScript({
        target: { tabId: currentTabId },
        func: getVideoTranscriptWrapper
      });
    }).then(results => {
      const videoData = results[0].result;
      console.log("Video data received in popup.js:", videoData);

      if (videoData.transcript === 'No transcript found or unsupported site.') {
        document.getElementById("summaryOutput").innerHTML = "<p style='color: orange;'>No video transcript found for this page. Please ensure captions are available or it's a YouTube video.</p>";
        console.warn("Video summarization aborted: No transcript found.");
        stopTimer(); // Stop timer if no transcript
        timeTakenElement.style.visibility = 'hidden'; // Hide time tracker
        timeTakenElement.style.opacity = '0';
      } else {
        // Pass both transcript and title to sendToOllama
        sendToOllama(videoData.transcript, model, "video", videoData.title);
      }
    }).catch(err => {
      stopTimer(); // Stop timer on error
      console.error("Failed to extract video transcript:", err);
      showMessageBox("Failed to extract video transcript.");
      document.getElementById("summaryOutput").innerHTML = "<p>Error extracting transcript.</p>";
    });
  });
//
document.getElementById("summarizeClipboardBtn").addEventListener("click", async () => {
    resetWordCounts(); // Add this line at the start
    const model = document.getElementById("modelSelect").value;
    console.log("Summarizing clipboard content with model:", model);

    try {
      // Clear previous summary and time, show loading
      document.getElementById("summaryOutput").innerHTML = "<p>Loading summary...</p>";
      stopTimer(); // Stop any existing timer
      startTimer(); // Start new timer

      // Read from clipboard
      const clipboardText = await navigator.clipboard.readText();
      
      if (!clipboardText.trim()) {
        throw new Error("Clipboard is empty");
      }

      // Send to Ollama for summarization
      sendToOllama(clipboardText, model, "clipboard");

    } catch (err) {
      stopTimer(); // Stop timer on error
      console.error("Failed to read clipboard:", err);
      showMessageBox("Failed to read clipboard content.");
      document.getElementById("summaryOutput").innerHTML = "<p>Error reading clipboard content.</p>";
    }
  });
//

    // Add copy to clipboard functionality
    document.getElementById("copyToClipboard").addEventListener("click", async () => {
        const summaryOutput = document.getElementById("summaryOutput");
        
        try {
            // Get the text content from the summary output
            const textToCopy = summaryOutput.textContent;
            
            // Copy to clipboard
            await navigator.clipboard.writeText(textToCopy);
            
            // Visual feedback
            const copyButton = document.getElementById("copyToClipboard");
            const originalText = copyButton.innerHTML;
            copyButton.innerHTML = '<span class="icon">✅</span> Copied!';
            
            // Reset button text after 2 seconds
            setTimeout(() => {
                copyButton.innerHTML = originalText;
            }, 2000);
            
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showMessageBox("Failed to copy to clipboard");
        }
    });
});

// Wrapper functions needed because popup can't directly reference getPageContent
function getPageContentWrapper() {
  return window.getPageContent();
}

function getVideoTranscriptWrapper() {
  return {
    transcript: window.getVideoTranscript(),
    title: document.querySelector('title').textContent
  };
}

// Communicate with local Ollama API
function sendToOllama(inputText, model, type, videoTitle = '') {
    // Get mind map checkbox state
    const includeMindMap = document.getElementById('includeMindMap').checked;
    
    // Update input word count
    const inputWordCount = inputText.trim().split(/\s+/).length;
    document.getElementById('inputWordCount').textContent = inputWordCount;

    // Record start time (for final precise measurement)
    const startTime = performance.now();

    const prompt = type === "page" 
        ? `Summarize the following webpage content comprehensively in bullet points${includeMindMap ? " & Create a mind map in markdown language from the following content. Include relevant topics, tools, and methodologies to clearly show the key points" : ""}:\n\n${inputText}`
        : type === "video" 
        ? `Summarize the following YouTube video transcript comprehensively in bullet points${includeMindMap ? " & Create a mind map in markdown language from the following content. Include relevant topics, tools, and methodologies to clearly show the key points" : ""}:\n\n${inputText}`
        : `Summarize the following text comprehensively in bullet points${includeMindMap ? " & Create a mind map in markdown language from the following content. Include relevant topics, tools, and methodologies to clearly show the key points" : ""}:\n\n${inputText}`; // For clipboard

    console.log("======================");
    console.log(JSON.stringify({model: model,prompt: prompt,stream: false})); // debug output
    console.log("======================");

    fetch("http://localhost:3000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: model,
            prompt: prompt,
            stream: false,
            think: false
        })
    })
    .then(response => response.json())
    .then(data => {
        // Remove both types of thinking tags and their content
        let cleanResponse = data.response
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .replace(/<thought>[\s\S]*?<\/thought>/g, '')
            .trim();

        // Update output word count with cleaned response
        const outputWordCount = cleanResponse ? cleanResponse.trim().split(/\s+/).length : 0;
        document.getElementById('outputWordCount').textContent = outputWordCount;
        
        stopTimer();
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        const formattedDuration = formatDuration(duration);
        
        timeTakenElement.innerHTML = `<span class="timer-icon">⏱️</span><span class="timer-text">Summarized in: ${formattedDuration}</span>`;

        // Ensure that `marked` and `DOMPurify` are loaded from popup.html
        if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
            let rawMarkdown = cleanResponse || "No summary provided.";
            
            // Add video title as header if it's a video summary
            if (type === "video" && videoTitle) {
                rawMarkdown = `# ${videoTitle}\n\n${rawMarkdown}`;
            }
            
            const html = marked.parse(rawMarkdown);
            const cleanHtml = DOMPurify.sanitize(html);
            document.getElementById("summaryOutput").innerHTML = cleanHtml;
        } else {
            console.warn("Marked.js or DOMPurify.js not loaded. Displaying raw text.");
            document.getElementById("summaryOutput").innerText = cleanResponse;
        }
    })
    .catch(err => {
      stopTimer(); // Stop timer on error
      const endTime = performance.now(); // Record end time even on error
      const duration = ((endTime - startTime) / 1000).toFixed(2); // Calculate duration in seconds
      console.error("Fetch error:", err);
      showMessageBox("Error contacting Ollama. Make sure it's running and the proxy is active on port 3000.");
      document.getElementById("summaryOutput").innerHTML = `<p>Error during summarization. Check console for details.</p><p>Attempted in: ${duration} seconds</p>`;
      // Hide timeTaken on error or if it's not a successful summary
      timeTakenElement.style.visibility = 'hidden';
      timeTakenElement.style.opacity = '0';
      timeTakenElement.innerText = '';
    });
}

// Add this new function before sendToOllama
function formatDuration(seconds) {
    if (seconds < 60) {
        return `${seconds} seconds`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes} min ${remainingSeconds} sec`;
}

// Add this function to fetch available models
async function fetchAvailableModels() {
    try {
        const response = await fetch('http://localhost:3000/v1/models');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching models:', error);
        showMessageBox('Failed to fetch available models');
        return [];
    }
}

// Add this function to populate the model select dropdown
function populateModelSelect(models) {
    const modelSelect = document.getElementById('modelSelect');
    modelSelect.innerHTML = ''; // Clear existing options

    if (models.length === 0) {
        modelSelect.innerHTML = '<option value="">No models available</option>';
        return;
    }

    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.id;
        modelSelect.appendChild(option);
    });
}

// Modify the DOMContentLoaded event listener to include model fetching
document.addEventListener("DOMContentLoaded", async function () {
    // ...existing code...

    // Fetch and populate models
    const models = await fetchAvailableModels();
    populateModelSelect(models);

    // Dark mode implementation
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        darkModeToggle.checked = savedTheme === 'dark';
    }

    // Handle theme toggle
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });

    // ...existing code...
});


