# Amba Community Repository Analysis

## 📂 Project Structure
The repository is a monorepo containing three distinct applications:

1.  **`client/`**: The Frontend Web Application (React + Vite).
2.  **`server/`**: The Backend API (Node.js + Express).
3.  **`ai-server/`**: A specialized AI Microservice (Python + FastAPI).

---

## 🛠️ Tech Stack

### 1. Client (Frontend)
*   **Framework**: React 19
*   **Build Tool**: Vite 7
*   **Styling**: Standard CSS (with `gsap` for animations).
*   **Routing**: React Router DOM 7.
*   **State/Data**: Axios for API calls, Context API.
*   **Visualization**: Recharts for data visualization.

### 2. Server (Backend)
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: MongoDB (with Mongoose).
*   **Authentication**: JWT (JSON Web Tokens) & Bcryptjs.
*   **Features**: CORS support, structured MVC pattern (Controllers, Models, Routes).

### 3. AI Server (Microservice)
*   **Runtime**: Python
*   **Framework**: FastAPI (with Uvicorn).
*   **AI Model**: Uses **Groq API** (running `llama-3.3-70b-versatile`).
*   **Key Dependencies**: `fastapi`, `uvicorn`, `groq`, `pydantic`.

---

## 🌟 Key Features

### Safety Analysis & AI (Via `ai-server`)
*   **Incident Analysis**: The `/analyze` endpoint takes an incident text and uses Llama-3 to assign a **Risk Score** (Extreme, High, Medium, Low) and provides a **Safety Tip**.
    *   *Logic*: Distinguishes between immediate physical danger (0.8-0.99) vs digital threats/infrastructure issues.
*   **Magic Rephrase**: The `/rephrase` endpoint converts informal or "Hinglish" text into professional, urgent English safety reports.

### Community & Safety (Via `client` & `server`)
*   **Authentication**: Secure user login and signup.
*   **Posts/Reports**: Users can create and view posts (likely safety incidents or community updates) served by the Express backend.
*   **Dashboard/UI**: React frontend likely displays these safety incidents, utilizing charts (`recharts`) for data and maps (if applicable).

---

## 🚀 Startup Instructions

### 1. Start AI Server
```bash
cd ai-server
pip install fastapi uvicorn groq pydantic
python main.py
# Runs on: http://127.0.0.1:8000
```

### 2. Start Backend Server
```bash
cd server
npm install
npm run dev
# Runs on: http://localhost:5000
```

### 3. Start Frontend Client
```bash
cd client
npm install
npm run dev
# Runs on: http://localhost:5173
```
