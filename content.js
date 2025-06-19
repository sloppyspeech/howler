(function () {
  // Function to extract content from the current webpage
  window.getPageContent = function () {
    const unwantedTags = ['script', 'style', 'nav', 'footer', 'aside'];
    // Remove unwanted elements to get cleaner text content
    unwantedTags.forEach(tag => {
      document.querySelectorAll(tag).forEach(el => el.remove());
    });

    // Extract innerText from the body and clean up excessive whitespace
    return document.body.innerText.replace(/\s+/g, ' ').trim();
  };

  // Function to extract transcript from YouTube videos
  window.getVideoTranscript = function () {
    // Select all elements that are part of YouTube captions
    const transcriptElements = document.querySelectorAll('.ytp-caption-segment');
    let transcript = '';

    // Concatenate text from all transcript segments
    transcriptElements.forEach(el => {
      transcript += el.innerText + '\n';
    });

    // If no transcript is found, return a specific message
    if (!transcript.trim()) {
      transcript = 'No transcript found or unsupported site.';
    }

    return transcript;
  };
})();
