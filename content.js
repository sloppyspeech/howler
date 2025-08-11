(function () {
  // Function to extract content from the current webpage (unchanged)
  window.getPageContent = function () {
    const unwantedTags = ['script', 'style', 'nav', 'footer', 'aside'];
    unwantedTags.forEach(tag => {
      document.querySelectorAll(tag).forEach(el => el.remove());
    });
    return document.body.innerText.replace(/\s+/g, ' ').trim();
  };

  // Function to find elements recursively through Shadow DOMs
  function findElementsDeep(root, selector) {
    let elements = [];
    const queue = [root];

    while (queue.length > 0) {
      const current = queue.shift();

      try {
        current.querySelectorAll(selector).forEach(el => elements.push(el));
      } catch (e) {
        // Ignore errors from querying invalid contexts
      }

      if (current.shadowRoot) {
        queue.push(current.shadowRoot);
      }

      if (current.children && current.children.length > 0) {
        Array.from(current.children).forEach(child => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            queue.push(child);
          }
        });
      }
    }
    return elements;
  }

  // Function to extract transcript from YouTube videos
  window.getVideoTranscript = function () {
    let transcript = '';
    console.log("[content.js] Attempting to find YouTube transcript elements (v4 - enhanced search).");

    // Strategy 1: Look for the text within the transcript panel itself
    // This targets the main transcript container and extracts its entire text content.
    // This is often the most reliable way to get the full transcript if the panel is open.
    const transcriptPanelContainerSelector = 'ytd-transcript-renderer #segments-container'; // Or a more general parent like 'ytd-transcript-renderer'
    const transcriptContainer = findElementsDeep(document.body, transcriptPanelContainerSelector);

    if (transcriptContainer.length > 0) {
      // Assuming the full text is within the innerText of this container
      transcript = transcriptContainer[0].innerText.trim();
      console.log(`[content.js] Extracted transcript from panel container (length: ${transcript.length}).`);
    }

    // Strategy 2: Fallback to individual caption segments if Strategy 1 yields no result
    if (!transcript.trim()) {
      console.log("[content.js] No transcript from panel, falling back to visible .ytp-caption-segment elements.");
      const captionSegments = findElementsDeep(document.body, '.ytp-caption-segment');
      if (captionSegments.length > 0) {
        captionSegments.forEach(el => {
          transcript += el.innerText.trim() + '\n';
        });
        console.log(`[content.js] Extracted transcript from visible captions (length: ${transcript.length}).`);
      }
    }

    if (!transcript.trim()) {
      transcript = 'No transcript found or unsupported site. Please ensure the YouTube video has captions/transcript available and try opening the transcript panel by clicking "..." below the video.';
      console.log("[content.js] Final transcript: 'No transcript found or unsupported site.'");
    } else {
      console.log(`[content.js] Final transcript length: ${transcript.length} characters.`);
      // console.log("[content.js] Final transcript snippet:", transcript.substring(0, 200) + '...'); // Uncomment for snippet debugging
    }

    return transcript;
  };
})();
