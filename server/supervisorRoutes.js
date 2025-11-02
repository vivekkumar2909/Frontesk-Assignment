// server/supervisorRoutes.js
const express = require('express');
const db = require('./db');
const kb = require('./knowledgeBase');
const { getIO } = require('./socket');

const router = express.Router();

const getPending = db.prepare("SELECT hr.*, c.name as caller_name, c.phone as caller_phone FROM help_requests hr LEFT JOIN callers c ON c.id = hr.caller_id WHERE hr.status='PENDING' ORDER BY hr.created_at DESC");
const getAll = db.prepare("SELECT hr.*, c.name as caller_name, c.phone as caller_phone FROM help_requests hr LEFT JOIN callers c ON c.id = hr.caller_id ORDER BY hr.created_at DESC");
const getRequest = db.prepare("SELECT * FROM help_requests WHERE id=?");
const resolveReq = db.prepare("UPDATE help_requests SET status=?, result=?, resolved_at=CURRENT_TIMESTAMP WHERE id=?");
const insertHistory = db.prepare("INSERT INTO history (help_request_id,event,details) VALUES (?,?,?)");

router.get('/pending', (req, res) => {
    try {
        const rows = getPending.all();
        res.json(rows);
    } catch (err) {
        console.error(err); res.status(500).json({ error: 'internal' });
    }
});

router.get('/all', (req, res) => {
    try {
        res.json(getAll.all());
    } catch (err) { console.error(err); res.status(500).json({ error: 'internal' }); }
});

/**
 * Supervisor answers a request:
 * - add to KB
 * - mark request RESOLVED
 * - notify caller (emit 'request_resolved' and 'ai_answer' so agent can speak)
 */
router.post('/:id/answer', (req, res) => {
    try {
        const id = Number(req.params.id);
        const { answer, supervisor = 'supervisor' } = req.body;
        if (!answer) return res.status(400).json({ error: 'answer required' });

        const reqRow = getRequest.get(id);
        if (!reqRow) return res.status(404).json({ error: 'request not found' });

        // save to KB, resolve request
        kb.addAnswer(reqRow.question, answer);
        resolveReq.run('RESOLVED', answer, id);
        insertHistory.run(id, 'RESOLVED', `Supervisor ${supervisor} answered: ${answer}`);

        // Notify client UIs + agent to speak
        const io = getIO();
        if (io) {
            io.emit('request_resolved', { id, answer, question: reqRow.question, callerId: reqRow.caller_id });
            // also instruct agent(s) to speak the answer to the caller via 'ai_answer'
            io.emit('ai_answer', { callerId: reqRow.caller_id, question: reqRow.question, answer });
        }

        // console log simulating notifying caller (or webhook)
        console.log(`[AI -> Caller] Notifying caller ${reqRow.caller_id}: ${answer}`);

        res.json({ status: 'RESOLVED', id, answer });
    } catch (err) {
        console.error('answer error', err);
        res.status(500).json({ error: 'internal' });
    }
});

module.exports = router;
