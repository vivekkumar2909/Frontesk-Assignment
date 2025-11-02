// server/routes/ai.js
const express = require('express');
const db = require('../db');
const { getIO } = require('../socket');

const router = express.Router();

const insertCaller = db.prepare('INSERT OR IGNORE INTO callers (id,name,phone) VALUES (?,?,?)');
const findKnowledgeExact = db.prepare('SELECT * FROM knowledge WHERE question = ?');
const findKnowledgeLike = db.prepare('SELECT * FROM knowledge WHERE question LIKE ? LIMIT 1');
const insertHelpRequest = db.prepare('INSERT INTO help_requests (caller_id,question) VALUES (?,?)');
const insertHistory = db.prepare('INSERT INTO history (help_request_id,event,details) VALUES (?,?,?)');

router.post('/', (req, res) => {
    const { callerId, name = 'Guest', phone = 'unknown', question } = req.body;
    if (!callerId || !question) return res.status(400).json({ error: 'callerId and question required' });

    insertCaller.run(callerId, name, phone);

    const exact = findKnowledgeExact.get(question);
    if (exact) {
        console.log(`[AI] Answered caller ${callerId}: ${exact.answer}`);
        insertHistory.run(null, 'AI_ANSWERED', `Answered from KB: ${question} -> ${exact.answer}`);
        return res.json({ status: 'ANSWERED', answer: exact.answer });
    }

    const fuzzy = findKnowledgeLike.get(`%${question}%`);
    if (fuzzy) {
        console.log(`[AI] Fuzzy-matched answer for caller ${callerId}: ${fuzzy.answer}`);
        insertHistory.run(null, 'AI_ANSWERED_FUZZY', `Fuzzy matched ${question} -> ${fuzzy.question}`);
        return res.json({ status: 'ANSWERED', answer: fuzzy.answer });
    }

    const info = insertHelpRequest.run(callerId, question);
    const requestId = info.lastInsertRowid;
    insertHistory.run(requestId, 'CREATED', `Help request created for '${question}'`);

    const text = `Hey, I need help answering: "${question}" (request id: ${requestId})`;
    console.log(`[AI -> Supervisor TEXT] ${text}`);
    const io = getIO();
    if (io) io.emit('new_request', { id: requestId, callerId, question, text });

    res.json({ status: 'PENDING', requestId, message: 'Let me check with my supervisor and get back to you.' });
});

module.exports = router;
