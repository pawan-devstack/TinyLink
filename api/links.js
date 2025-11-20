app.post('/api/links', async (req, res) => {
  const { url, code } = req.body;

  // Basic validation
  if (!url || !code) {
    return res.status(400).json({ error: "URL and code are required" });
  }
  
  // URL format check (simple regex)
  const urlPattern = /^(http|https):\/\/[^ "]+$/;
  if (!urlPattern.test(url)) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  try {
    // Check for duplicate code
    const check = await pool.query('SELECT * FROM links WHERE code = $1', [code]);
    if (check.rows.length > 0) {
      return res.status(409).json({ error: "Code already exists" });
    }

    // Insert into DB
    await pool.query(
      'INSERT INTO links (code, url) VALUES ($1, $2)',
      [code, url]
    );
    res.status(201).json({ message: "Short link created", code, url });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get('/api/links', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM links ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
