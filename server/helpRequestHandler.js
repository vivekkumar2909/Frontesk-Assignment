// server/helpRequestHandler.js
const db = require('./db');
const { getIO } = require('./socket');

const insertCaller = db.prepare('INSERT OR IGNORE INTO callers (id,name,phone) VALUES (?,?,?)');
const insertHelpRequest = db.prepare('INSERT INTO help_requests (caller_id,question) VALUES (?,?)');
const insertHistory = db.prepare('INSERT INTO history (help_request_id,event,details) VALUES (?,?,?)');
const getPendingOlderThan = db.prepare("SELECT * FROM help_requests WHERE status='PENDING' AND datetime(created_at) <= datetime('now', ?)");
const markUnresolved = db.prepare("UPDATE help_requests SET status='UNRESOLVED', result='timeout', resolved_at=CURRENT_TIMESTAMP WHERE id=?");

// module-level io reference set at init
let io = null;

function init({ io: passedIo }) {
    io = passedIo;
}

/**
 * Create a help request and notify supervisor(s).
 * returns { requestId, ... }
 */
function createHelpRequest({ callerId, name = 'Guest', phone = 'unknown', question }) {
    insertCaller.run(callerId, name, phone);
    const info = insertHelpRequest.run(callerId, question);
    const requestId = info.lastInsertRowid;
    insertHistory.run(requestId, 'CREATED', `Help request created for '${question}'`);
    const text = `Hey supervisor: I need help answering: "${question}" (request id: ${requestId})`;

    console.log('[AI -> Supervisor TEXT]', text);
    if (io) io.emit('new_request', { id: requestId, callerId, question, text });
    return { requestId, callerId, question };
}

/**
 * Called by background job to mark pending requests older than timeout as UNRESOLVED.
 * @param {string} ageSpec - e.g. '-2 minutes'
 */
function processTimeouts(ageSpec = '-2 minutes') {
    const rows = getPendingOlderThan.all(ageSpec);
    rows.forEach(r => {
        markUnresolved.run(r.id);
        insertHistory.run(r.id, 'TIMEOUT', 'Marked UNRESOLVED by timeout');
        console.log(`[TIMEOUT] request ${r.id} marked UNRESOLVED`);
        if (io) io.emit('request_timeout', { id: r.id });
    });
}

module.exports = { init, createHelpRequest, processTimeouts };
