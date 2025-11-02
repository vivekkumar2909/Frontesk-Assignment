// server/aiAgent.js
const kb = require('./knowledgeBase');
const helpHandler = require('./helpRequestHandler');
const db = require('./db');
const { getIO } = require('./socket');

// small helper statements
const insertHistory = db.prepare('INSERT INTO history (help_request_id,event,details) VALUES (?,?,?)');

// internal io reference set in init
let io = null;
function init({ io: passedIo }) {
    io = passedIo;
}

/**
 * Main entry: handle incoming call/question.
 * - If KB can answer -> return {status: 'ANSWERED', answer}
 * - Else create help request and return {status: 'PENDING', requestId, message}
 *
 * Additionally emits events:
 * - 'ai_answer' when answered (so frontends/agents can speak)
 * - 'new_request' via helpHandler (supervisor notif)
 */
async function handleIncomingCall({ callerId, name = 'Guest', phone = 'unknown', question }) {
    if (!callerId || !question) throw new Error('callerId and question required');

    // 1) exact match
    const exact = kb.getExact(question);
    if (exact) {
        insertHistory.run(null, 'AI_ANSWERED', `Answered from KB: ${question} -> ${exact.answer}`);
        // notify agent(s) to speak
        if (io) io.emit('ai_answer', { callerId, question, answer: exact.answer });
        console.log(`[AI] answered from KB: ${exact.answer}`);
        return { status: 'ANSWERED', answer: exact.answer };
    }

    // 2) fuzzy match
    const fuzzy = kb.getFuzzy(question);
    if (fuzzy) {
        insertHistory.run(null, 'AI_ANSWERED_FUZZY', `Fuzzy matched ${question} -> ${fuzzy.question}`);
        if (io) io.emit('ai_answer', { callerId, question, answer: fuzzy.answer });
        console.log(`[AI] fuzzy matched: ${fuzzy.answer}`);
        return { status: 'ANSWERED', answer: fuzzy.answer };
    }

    // 3) unknown -> escalate
    const { requestId } = helpHandler.createHelpRequest({ callerId, name, phone, question });
    // Notify caller reply text (response message)
    const message = 'Let me check with my supervisor and get back to you.';
    // we *also* emit an event so any connected agent UIs know there's a pending request
    if (io) io.emit('pending_created', { requestId, callerId, question });
    return { status: 'PENDING', requestId, message };
}

module.exports = { init, handleIncomingCall };
