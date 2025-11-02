// server/knowledgeBase.js
const db = require('./db');

const findExact = db.prepare('SELECT * FROM knowledge WHERE question = ?');
const findFuzzy = db.prepare('SELECT * FROM knowledge WHERE question LIKE ? LIMIT 1');
const insertKB = db.prepare('INSERT OR IGNORE INTO knowledge (question,answer) VALUES (?,?)');
const listAll = db.prepare('SELECT * FROM knowledge ORDER BY created_at DESC');

module.exports = {
    /**
     * Try exact match (case-sensitive exact)
     * @param {string} question
     * @returns {object|null}
     */
    getExact: (question) => {
        if (!question) return null;
        return findExact.get(question) || null;
    },

    /**
     * Try a simple fuzzy match using LIKE (contains)
     * @param {string} question
     * @returns {object|null}
     */
    getFuzzy: (question) => {
        if (!question) return null;
        return findFuzzy.get(`%${question}%`) || null;
    },

    /**
     * Add learned answer to the knowledge base.
     * Uses INSERT OR IGNORE so duplicates don't blow up.
     * @param {string} question
     * @param {string} answer
     */
    addAnswer: (question, answer) => {
        if (!question || !answer) return null;
        return insertKB.run(question, answer);
    },

    list: () => {
        return listAll.all();
    }
};
