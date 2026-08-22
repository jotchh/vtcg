const express = require('express');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const router = express.Router();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'vtcg',
    password: process.env.DB_PASSWORD || 'your_password',
    port: process.env.DB_PORT || 5432,
});

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)';
        
        await pool.query(query, [username, email, hashedPassword]);
        res.redirect('/login.html');
    } catch (err) {
        res.status(500).send("An error occurred during registration.");
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
            return res.redirect('/login.html?error=true');
        }
        
        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        
        if (match) {
            req.session.userId = user.id;
            req.session.username = user.username;
            res.redirect('/dashboard.html'); 
        } else {
            res.redirect('/login.html?error=true');
        }
    } catch (err) {
        res.status(500).send("An error occurred during login.");
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login.html');
    });
});

module.exports = router;