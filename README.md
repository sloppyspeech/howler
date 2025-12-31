# Howler (Orbit Summarizer)

**Howler** (Inspired by now defunct  **Orbit Summarizer**) is a high-performance browser extension that enables users to summarize web pages, YouTube videos, and clipboard content using local AI via Ollama. It prioritizes privacy, providing a premium user experience with features like mind map generation and flexible export options.

## 🚀 Features

- 🌐 **Webpage Summarization**: Instantly summarize any article or webpage content.
- 🎥 **YouTube Video Summarization**: Automatically extracts transcripts and generates concise video summaries.
- 📋 **Clipboard Summarization**: Summarize text directly from your clipboard.
- 🧠 **Mind Map Generation**: Create markdown-based mind maps to visualize complex information.
- 💾 **Multi-Format Export**: Save your summaries as **Markdown (.md)** or **JSON (.json)**, including YouTube Video IDs.
- 🌑 **Premium UI**: Sleek, modern design with full **Dark Mode** support and micro-animations.
- 🔒 **Privacy First**: All processing runs locally via Ollama—your data nunca leaves your machine.
- ⏱️ **Performance Tracking**: Built-in timer to show summarization speed.

## 🛠️ Prerequisites

To use Howler, you need:

1.  **Ollama**: Install it locally from [ollama.com](https://ollama.com/).
2.  **AI Models**: Ensure you have models pulled (e.g., `ollama pull llama3`).
3.  **Local Proxy (Port 3000)**: Howler connects to Ollama via `http://localhost:3000`. You may need a simple proxy to handle CORS or route requests to the Ollama API.

## 📥 Installation

### Developer Mode (Chrome/Edge/Brave)

1.  Clone this repository.
2.  Go to `chrome://extensions/`.
3.  Enable **Developer mode**.
4.  Click **Load unpacked** and select the project directory.

### Firefox

1.  Run the `package_extension.bat` script to package the extension.
2.  Go to `about:debugging#/runtime/this-firefox`.
3.  Click **Load Temporary Add-on...** and select the generated ZIP file.

## 📖 Usage

1.  Click the Howler icon in your toolbar.
2.  Select your preferred **Model** from the dropdown.
3.  (Optional) Toggle **Include Mind Map** for a visual representation.
4.  Click the appropriate button for the content you want to summarize.
5.  Use **Copy to Clipboard** or the **Save** buttons to store your results.

## 📂 Project Structure

- `manifest.json`: Extension configuration and permissions.
- `popup.html` / `popup.js`: Main interface and application logic.
- `content.js`: Content extraction logic (Web/YouTube).
- `background.js`: Extension lifecycle management.
- `styles.css`: Advanced styling and dark mode implementation.
- `lib/`: Third-party libraries (`marked.js` for markdown, `DOMPurify` for security).

---

*Howler - Summarize Everything, Privately.*
