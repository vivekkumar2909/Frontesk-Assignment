// server/timeoutHandler.js
const db = require('./db');

const getPendingOlderThan = db.prepare("SELECT * FROM help_requests WHERE status='PENDING' AND datetime(created_at) <= datetime('now', ?)");
const resolveReq = db.prepare("UPDATE help_requests SET status='UNRESOLVED', result='timeout', resolved_at=CURRENT_TIMESTAMP WHERE id=?");
const insertHistory = db.prepare("INSERT INTO history (help_request_id,event,details) VALUES (?,?,?)");

function setupTimeoutHandler(io) {
    // Demo-friendly: check often. In real prod, use a more conservative interval.
    setInterval(() => {
        try {
            const rows = getPendingOlderThan.all('-2 minutes'); // demo: 2 minute timeout
            rows.forEach(r => {
                resolveReq.run(r.id);
                insertHistory.run(r.id, 'TIMEOUT', 'Marked UNRESOLVED by timeout');
                console.log('Timed out request', r.id);
                if (io) io.emit('request_timeout', { id: r.id });
            });
        } catch (err) {
            console.error('Timeout handler error', err);
        }
    }, 15 * 1000);
}

module.exports = { setupTimeoutHandler };
