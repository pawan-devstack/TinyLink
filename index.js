const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // agar frontend static serve karna hai

// --- Yeh code add karo ---
app.post('/api/links', async (req, res) => {
    const { url, code } = req.body;

    if (!url || !code) {
        return res.status(400).json({ error: "URL and code are required" });
    }

    const urlPattern = /^(http|https):\/\/[^ "]+$/;
    if (!urlPattern.test(url)) {
        return res.status(400).json({ error: "Invalid URL format" });
    }

    try {
        const check = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
        if (check.rows.length > 0) {
            return res.status(409).json({ error: "Code already exists" });
        }

        await pool.query('INSERT INTO links (code, url) VALUES ($1, $2)', [code, url]);
        res.status(201).json({ message: "Short link created", code, url });
    } catch (err) {
        console.error(err);   // <-- Ye add karo
        res.status(500).json({ error: "Server error" });
    }

});

app.get('/api/links', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM links ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

