🗣️ Frontdesk HITL (Human-in-the-Loop) Voice AI — LiveKit Demo

This project is a Human-in-the-Loop (HITL) Voice AI system built using LiveKit, Node.js, and Express.
It demonstrates an AI agent capable of real-time voice conversations and escalating help requests to a human supervisor when needed.

⚠️ Disclaimer:
This project must demonstrate a working LiveKit voice demo — not a chat or console simulation.
If you do not demo your LiveKit voice application talking to you, the application will be disqualified.

🚀 Features

✅ LiveKit Voice Integration — AI agent that listens and speaks in real-time.
✅ Knowledge Base (KB) — AI learns and retrieves information from a local database.
✅ Help Request System — If AI doesn’t know an answer, it escalates to a supervisor.
✅ Supervisor Dashboard — Web interface for reviewing and answering help requests.
✅ REST API Endpoints — Supervisor responses and KB updates handled via Express routes.
✅ SQLite Integration — Persistent local storage for requests and knowledge entries.

🧩 Project Structure
frontdesk-hitl/
│
├── server/
│   ├── index.js              # Main Express server
│   ├── aiAgent.js            # Handles LiveKit voice agent logic
│   ├── helpRequestHandler.js # Help request creation & tracking
│   ├── knowledgeBase.js      # Persistent KB read/write logic
│   ├── supervisorRoutes.js   # REST API endpoints for supervisor
│   └── db.js                 # SQLite database setup & schema
│
├── public/
│   ├── supervisor.html       # Dashboard UI for supervisors
│   ├── caller.html           # LiveKit browser voice call page
│   ├── styles.css            # Styling for dashboard
│
├── data/
│   └── frontdesk.db          # SQLite database file
│
├── .env                      # Environment variables (LiveKit credentials)
├── package.json
└── README.md

⚙️ Setup Instructions
1️⃣ Clone the Repository
git clone https://github.com/your-username/frontdesk-hitl.git
cd frontdesk-hitl

2️⃣ Install Dependencies
npm install

3️⃣ Set Up Environment Variables

Create a .env file in the root directory and add:

LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
PORT=3000


You can get your credentials from https://cloud.livekit.io
.

🧠 Database Initialization

The first run will automatically create data/frontdesk.db and the required tables.

If you want to reset the database:

rm -f data/frontdesk.db
node server/db.js

🗣️ Running the Voice AI Server

Start the Express server:

npm start


Visit:

AI Caller Interface: http://localhost:3000/caller.html

Supervisor Dashboard: http://localhost:3000/supervisor.html

🧑‍💼 Supervisor Dashboard Overview

The supervisor dashboard lets you:

View active help requests (when AI doesn’t know an answer)

Provide responses to AI queries

Add or update entries in the Knowledge Base

When a response is submitted:

It updates the KB automatically

The AI agent can use that information in future conversations

🧠 AI Agent Workflow

User calls via LiveKit → Voice captured via caller.html

AI listens → Attempts to answer using knowledgeBase.js

If AI doesn’t know → Creates a help request via helpRequestHandler.js

Supervisor responds → Stored in KB

AI learns → Future calls can auto-answer similar questions

📡 API Endpoints
Method	Endpoint	Description
GET	/api/requests	Fetch all active help requests
POST	/api/respond	Supervisor submits a response
GET	/api/knowledge	Get all knowledge base entries
POST	/api/knowledge	Add new KB entry manually
🧑‍💻 Demo Workflow

Open caller.html

Click Start Call

Speak — “What’s our refund policy?”

If AI doesn’t know, it creates a help request

Open supervisor.html, respond with “Refunds are processed in 5–7 days.”

AI learns — next time it answers automatically.

🛠️ Tech Stack
Layer	Technology
Voice Processing	LiveKit SDK (JavaScript)
Backend	Node.js, Express
Database	SQLite
Frontend	HTML, CSS, Vanilla JS
Deployment	ngrok (optional for LiveKit cloud testing)
