// server/routes/kb.js
const express = require('express');
const db = require('../db');
const router = express.Router();

const getKB = db.prepare('SELECT * FROM knowledge ORDER BY created_at DESC');

router.get('/', (req, res) => {
    res.json(getKB.all());
});

module.exports = router;
