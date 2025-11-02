// server/routes/supervisor.js
const express = require('express');
const db = require('../db');
const { getIO } = require('../socket');

const router = express.Router();

const getPendingRequests = db.prepare("SELECT hr.*, c.name as caller_name, c.phone as caller_phone FROM help_requests hr LEFT JOIN callers c ON c.id = hr.caller_id WHERE hr.status='PENDING' ORDER BY hr.created_at DESC");
const getAllRequests = db.prepare("SELECT hr.*, c.name as caller_name, c.phone as caller_phone FROM help_requests hr LEFT JOIN callers c ON c.id = hr.caller_id ORDER BY hr.created_at DESC");
const getRequestById = db.prepare('SELECT * FROM help_requests WHERE id=?');
const resolveRequest = db.prepare('UPDATE help_requests SET status=?,result=?,resolved_at=CURRENT_TIMESTAMP WHERE id=?');
const insertKB = db.prepare('INSERT OR IGNORE INTO knowledge (question,answer) VALUES (?,?)');
const insertHistory = db.prepare('INSERT INTO history (help_request_id,event,details) VALUES (?,?,?)');

router.get('/pending', (req, res) => res.json(getPendingRequests.all()));
router.get('/all', (req, res) => res.json(getAllRequests.all()));

router.post('/:id/answer', (req, res) => {
    const id = Number(req.params.id);
    const { answer, supervisor = 'supervisor' } = req.body;
    if (!answer) return res.status(400).json({ error: 'answer required' });
    const request = getRequestById.get(id);
    if (!request) return res.status(404).json({ error: 'request not found' });

    insertKB.run(request.question, answer);
    resolveRequest.run('RESOLVED', answer, id);
    insertHistory.run(id, 'RESOLVED', `Supervisor ${supervisor} answered: ${answer}`);

    const notify = `Notifying caller ${request.caller_id}: "${answer}" (in response to your question: ${request.question})`;
    console.log(`[AI -> Caller] ${notify}`);

    const io = getIO();
    if (io) io.emit('request_resolved', { id, answer });

    res.json({ status: 'RESOLVED', id, answer });
});

module.exports = router;
