// background.js

// Listen for when the extension's action (toolbar button) is clicked
chrome.action.onClicked.addListener((tab) => { // 'tab' object is passed to the listener
  // Store the ID of the current active tab in local storage
  // This tabId will be used by popup.js to execute content scripts on the correct tab.
  chrome.storage.local.set({ activeTabId: tab.id })
    .then(() => {
      console.log("Active tab ID stored:", tab.id);

      // Define the properties for the new window that will host our popup.html
      chrome.windows.create({
        url: chrome.runtime.getURL("popup.html"), // Get the full URL to popup.html within the extension
        type: "popup",                             // Specify the window type as 'popup'
        width: 650,                                // Set a fixed width for the popup window
        height: 800,                               // Set a fixed height for the popup window
        focused: true                              // Ensure the new window is focused upon creation
      }, (window) => {
        // Optional: You can do something with the created window object here if needed
        console.log("Popup opened in a new window:", window.id);
      });
    })
    .catch(error => {
      console.error("Error storing active tab ID:", error);
    });
});
