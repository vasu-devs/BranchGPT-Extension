# 🌳 BranchGPT Extension

> **"Conversations are trees, not lists."**

BranchGPT Extension turns your standard linear chatbot (starting with ChatGPT) into a power-user tool that visualizes conversations as a **Directed Acyclic Graph (DAG)**. Fork any message, explore parallel ideas, and never lose context again.

![BranchGPT Extension](https://placehold.co/1200x600/18181b/white?text=BranchGPT+Preview)

## ✨ Features

-   **🌿 True Branching Logic**: Click "Fork" on any message to spawn a parallel reality.
-   **🔒 Privacy First**: All data is stored locally in your browser using IndexedDB. No external servers.
-   **⚡️ Seamless Integration**: Injects directly into the ChatGPT interface.
-   **📜 History Visualization**: A sleek side panel shows your entire conversation tree.

## 🚀 Installation

### From Source (Developer Mode)

1.  Clone this repository:
    ```bash
    git clone https://github.com/vasu-devs/BranchGPT-Extension.git
    cd BranchGPT-Extension
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the extension:
    ```bash
    npm run build
    ```
4.  Load into Chrome:
    -   Go to `chrome://extensions/`
    -   Enable **Developer mode** (top right).
    -   Click **Load unpacked**.
    -   Select the `dist` folder created by the build.

## 🛠️ Development

This extension is built with:
-   [Vite](https://vitejs.dev/)
-   [React](https://react.dev/)
-   [TypeScript](https://www.typescriptlang.org/)
-   [Tailwind CSS](https://tailwindcss.com/)
-   [Dexie.js](https://dexie.org/) (for IndexedDB)
-   [CRXJS](https://crxjs.dev/vite-plugin) (for Manifest V3)

To run in watch mode:
```bash
npm run dev
```

## 📄 License

MIT © [Vasu Devs]
