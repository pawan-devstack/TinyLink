// index.js (project ke root me)
const express = require('express');
const cors = require('cors');
const pool = require('./db'); // /db/index.js
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// CREATE Short Link
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
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// GET ALL Links
app.get('/api/links', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM links ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// GET Link Stats (single link details)
app.get('/api/links/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const result = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// DELETE Link
app.delete('/api/links/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const result = await pool.query('DELETE FROM links WHERE code = $1 RETURNING *', [code]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Not found" });
        }
        res.json({ message: "Link deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Health Check
app.get('/healthz', (req, res) => {
    res.status(200).send("OK");
});

// REDIRECT: place at the end!
app.get('/:code', async (req, res) => {
    const { code } = req.params;
    try {
        const result = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
        if (result.rows.length === 0) {
            return res.status(404).send('Link not found');
        }
        const link = result.rows[0];
        await pool.query(
            'UPDATE links SET clicks = clicks + 1, last_clicked = NOW() WHERE code = $1',
            [code]
        );
        res.redirect(link.url);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
