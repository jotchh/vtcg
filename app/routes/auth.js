const express = require("express");
const bcrypt = require("bcrypt");

module.exports = function(pool, tokenStorage, makeToken, cookieOptions) {
    const router = express.Router();

    function validUsername(username) {
        return /^[a-zA-Z0-9_]+$/.test(username)
    }

    function validateLogin(body) {
        if (!body || typeof body !== "object") {
            return false;
        }

        const { email, password } = body;
        return (typeof email === "string" && typeof password === "string" && email.length > 0 && password.length > 0);
    }

    function validateRegister(body) {
        if (!body || typeof body !== "object") {
            return false;
        }
        
        const { username, email, password } = body;
        
        if (typeof username !== "string" || typeof email !== "string" || typeof password !== "string") {
            return false;
        }

        const cleanUsername = username.trim();
        const cleanEmail = email.trim();

        return (cleanUsername.length >= 3 && cleanUsername.length <= 25 && validUsername(cleanUsername) && cleanEmail.length >= 3 && cleanEmail.length <= 100 && password.length >= 4 && password.length <= 128);
    }

    router.post("/register", async (req, res) => {
        if (!validateRegister(req.body)) {
            return res.sendStatus(400);
        }

        const { username, email, password } = req.body;

        let hash;

        try {
            hash = await bcrypt.hash(password, 10);
        } catch (error) {
            console.error("HASH FAILED", error);
            return res.sendStatus(500);
        }

        try {
            await pool.query("INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)", [username, email, hash]);
        } catch (error) {
            console.error("INSERT FAILED", error);
            return res.sendStatus(500);
        }

        return res.status(200).redirect('/login.html');
    });

    router.post("/login", async (req, res) => {
        if (!validateLogin(req.body)) {
            return res.redirect("/login.html?error=invalid");
        }

        const { email, password } = req.body;

        let result;

        try {
            result = await pool.query("SELECT id, username, email, password_hash FROM users WHERE email = $1", [email]);
        } catch (error) {
            console.error("SELECT FAILED", error);
            return res.sendStatus(500);
        }

        if (result.rows.length === 0) {
            return res.redirect("/login.html?error=invalid");
        }

        const user = result.rows[0];

        let verifyResult;

        try {
            verifyResult = await bcrypt.compare(password, user.password_hash);
        } catch (error) {
            console.error("VERIFY FAILED", error);
            return res.sendStatus(500);
        }

        if (!verifyResult) {
            return res.redirect("/login.html?error=invalid");
        }

        const token = makeToken();

        tokenStorage[token] = {
            id: user.id,
            username: user.username,
            email: user.email
        };

        res.cookie("token", token, cookieOptions);

        return res.status(200).redirect("/dashboard.html");
    });

    router.get("/logout", (req, res) => {
        const { token } = req.cookies;

        if (token === undefined) {
            return res.sendStatus(400);
        }

        if (!Object.prototype.hasOwnProperty.call(tokenStorage, token)) {
            return res.sendStatus(400);
        }

        delete tokenStorage[token];
        res.clearCookie("token", cookieOptions);

        return res.status(200).redirect("/index.html");
    });

    router.get("/me", (req, res) => {
        const { token } = req.cookies;

        if (!token || !Object.prototype.hasOwnProperty.call(tokenStorage, token)) {
            return res.sendStatus(401);
        }

        return res.json(tokenStorage[token]);
    });

    return router;
};
