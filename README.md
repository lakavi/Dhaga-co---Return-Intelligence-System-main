# Dhaga & Co. - Return Intelligence System

Welcome to the Dhaga & Co. Return Intelligence System! This project is a modern, AI-powered command center built to manage, classify, and autonomously resolve e-commerce returns for a D2C fashion brand. It leverages Google's Gemini API to turn messy, unstructured return reasons into actionable insights and doorstep exchange opportunities.

## 🏗️ Architecture

The application is structured as a client-server architecture with an intelligent AI layer processing the data flow.

*   **Frontend**: React (Vite) Single Page Application styled with Tailwind CSS v4.
*   **Backend**: Node.js & Express API, running locally with `tsx`.
*   **AI Integration**: Google Gemini API (`@google/genai`) for text classification and report generation.
*   **Storage**: Fast, in-memory data storage (simulating a DB) loaded via CSV uploads.

For a deeper dive, including detailed component breakdowns and a Mermaid diagram of the data flow, please read our dedicated [Architecture Document](docs/architecture.md).

## 📖 How to Read This Project

The repository is organized to separate the user interface, backend logic, and documentation clearly. Here is a guide to navigating the codebase:

*   **`/src/`**: Contains the React frontend.
    *   `App.tsx` & `main.tsx`: The main entry points and routing for the dashboard views.
    *   `api.ts`: API client for communicating with the backend.
    *   `/components/`: Modular React UI components (e.g., `ReviewQueueView.tsx`, `UploadView.tsx`).
*   **`/server/`**: Contains the backend business logic and AI orchestration.
    *   `classify.ts`: Interfaces with the Gemini API to categorize return comments.
    *   `overview.ts`: Interfaces with the Gemini API to generate weekly business briefs.
    *   `store.ts`: The in-memory database and data manipulation logic.
    *   `ingest.ts`: Handles parsing and batching of CSV uploads.
    *   `resolutionAgent.ts`: Simulates autonomous agent workflows (e.g., WhatsApp negotiation).
*   **`server.ts`**: The main Express server file that mounts the API endpoints and serves the Vite frontend.
*   **`/docs/`**: Project documentation, including the architecture guide and solution approach.
*   **`/data/`**: Sample CSV data used to seed the application or for manual upload testing.

## 🚀 How to Run This Project

You can run this project locally using either **Bun** or **npm**. Bun is recommended for the fastest installation and execution.

### Prerequisites
1.  **Environment Variables**: Create a `.env` file in the root directory by copying `.env.example`. Ensure your `GEMINI_API_KEY` is properly set up inside.
2.  Node.js or Bun installed on your system.

### Option A: Using Bun (Recommended)
1.  **Install dependencies**:
    ```bash
    bun install
    ```
2.  **Start the development server**:
    ```bash
    bun run dev
    ```

### Option B: Using npm
1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Start the development server**:
    ```bash
    npm run dev
    ```

### Viewing the Dashboard
Once the server starts, open your browser and navigate to:
**http://localhost:3000**

## 🔍 How to Get Details About This Project

If you need more details about the project's inception, algorithms, or future roadmap:
1.  **Read the Docs**: Check the `/docs/` folder for comprehensive guides like `architecture.md` and `solution_approach.md`.
2.  **Check the Brief**: The `/brief/` folder contains original context on the Dhaga & Co. business problem and MVP specifications.
3.  **Review the Code**: The `server/` directory is well-commented and acts as the brain of the application. Check `server/classify.ts` to see exactly how prompts are structured for the AI.
4.  **Try it out**: Run the app locally, upload the sample CSV found in `data/sample/returns_other.csv`, and interact with the human-in-the-loop review queue to see the intelligence in action!
