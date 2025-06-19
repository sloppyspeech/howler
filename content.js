(function () {
  // Function to extract content from the current webpage (unchanged)
  window.getPageContent = function () {
    const unwantedTags = ['script', 'style', 'nav', 'footer', 'aside'];
    unwantedTags.forEach(tag => {
      document.querySelectorAll(tag).forEach(el => el.remove());
    });
    return document.body.innerText.replace(/\s+/g, ' ').trim();
  };

  // Function to extract transcript from YouTube videos
  window.getVideoTranscript = function () {
    let transcript = '';
    console.log("[content.js] Attempting to find YouTube transcript elements (v3 - refined search).");

    // Re-use findElementsDeep for robust Shadow DOM traversal
    function findElementsDeep(root, selector) {
      let elements = [];
      const queue = [root]; // Start with the initial root element/document

      while (queue.length > 0) {
        const current = queue.shift();

        // 1. Check for elements directly in the current node (light DOM)
        try {
          current.querySelectorAll(selector).forEach(el => elements.push(el));
        } catch (e) {
          // Ignore errors from querying invalid contexts (e.g., non-element nodes)
          // console.warn("Error querying selector in node:", e); // Uncomment for more verbose debugging
        }

        // 2. If current node has a shadow DOM, add its shadowRoot to the queue
        if (current.shadowRoot) {
          queue.push(current.shadowRoot);
        }

        // 3. Add light DOM children (if any) to the queue for further traversal
        // Ensure we're only adding actual elements to avoid errors on non-element nodes
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

    // --- Primary Strategy: Target the full transcript panel segments ---
    // This selector targets the text segments within the transcript sidebar.
    // YouTube's DOM can be complex, so this is a common path.
    const transcriptPanelSegmentSelector = 'ytd-transcript-renderer #segments-container > ytd-transcript-segment-renderer';
    let transcriptElements = findElementsDeep(document.body, transcriptPanelSegmentSelector);

    console.log(`[content.js] Found ${transcriptElements.length} elements with primary selector '${transcriptPanelSegmentSelector}'.`);

    // --- Fallback Strategy: If no elements found in the transcript panel, try the visible captions ---
    if (transcriptElements.length === 0) {
        console.log("[content.js] No elements found in transcript panel, falling back to .ytp-caption-segment (visible captions).");
        transcriptElements = findElementsDeep(document.body, '.ytp-caption-segment');
        console.log(`[content.js] Found ${transcriptElements.length} elements with fallback selector '.ytp-caption-segment'.`);
    }

    if (transcriptElements.length > 0) {
      transcriptElements.forEach(el => {
        transcript += el.innerText.trim() + '\n';
      });
    }

    if (!transcript.trim()) {
      // More descriptive message if nothing is found
      transcript = 'No transcript found or unsupported site. Please ensure the YouTube video has captions/transcript available and try opening the transcript panel.';
      console.log("[content.js] Final transcript: 'No transcript found or unsupported site.'");
    } else {
      console.log(`[content.js] Final transcript length: ${transcript.length} characters.`);
      // console.log("[content.js] Final transcript snippet:", transcript.substring(0, 200) + '...'); // Uncomment for snippet debugging
    }

    return transcript;
  };
})();
