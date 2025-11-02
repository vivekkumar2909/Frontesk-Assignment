// server/index.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');

// local modules
const db = require('./db');
const { initSocket } = require('./socket');
const aiAgent = require('./aiAgent');
const helpRequestHandler = require('./helpRequestHandler');
const supervisorRoutes = require('./supervisorRoutes');
const kbRoutes = require('./knowledgeBase');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// init http + socket.io
const server = http.createServer(app);
const io = initSocket(server);

// pass io to modules that emit events
aiAgent.init({ io });
helpRequestHandler.init({ io });

// Routes
app.use('/api/call', async (req, res) => {
    // delegate to aiAgent
    try {
        const { callerId, name, phone, question } = req.body;
        const result = await aiAgent.handleIncomingCall({ callerId, name, phone, question });
        res.json(result);
    } catch (err) {
        console.error('Error in /api/call', err);
        res.status(500).json({ error: 'internal' });
    }
});
app.use('/api/requests', supervisorRoutes);
app.use('/api/kb', kbRoutes);

// LiveKit token generation endpoint (simple)
const LivekitServer = require('livekit-server-sdk'); // make sure installed
const LIVEKIT_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_SECRET = process.env.LIVEKIT_API_SECRET;
const ROOM_NAME = process.env.ROOM_NAME || 'frontdesk_demo_room';

app.get('/api/token', (req, res) => {
    try {
        const identity = req.query.identity || `user_${Math.floor(Math.random() * 10000)}`;
        const at = new LivekitServer.AccessToken(LIVEKIT_KEY, LIVEKIT_SECRET, { identity });
        at.addGrant({ roomJoin: true, room: ROOM_NAME });
        const token = at.toJwt();
        res.json({ token, identity, room: ROOM_NAME, livekitUrl: process.env.LIVEKIT_URL || null });
    } catch (err) {
        console.error('token error', err);
        res.status(500).json({ error: 'token_error' });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
    console.log(`Supervisor UI -> http://localhost:${PORT}/supervisor.html`);
    console.log(`Caller UI -> http://localhost:${PORT}/caller.html`);
    console.log(`Agent UI -> http://localhost:${PORT}/agent.html`);
});
