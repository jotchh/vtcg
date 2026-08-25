let express = require("express");
let router = express.Router();

module.exports = function(pool) {
    router.get("/users", (req, res) => {
        let currentUserID = req.user.id;

        if (!currentUserID) {
            return res.status(401).json({ error: "Not logged in" });
        }
        pool.query(`
            SELECT users.id, users.username, COUNT(user_cards.id) AS tradable_cards
            FROM users
            JOIN user_cards ON users.id = user_cards.user_id
            WHERE is_tradable = TRUE
            AND users.id != $1
            GROUP BY users.id, users.username;`, [currentUserID])
            .then(result => {
                res.json(result.rows);
            })
            .catch(error => {
                console.error("Error loading users:", error);
                res.status(500).send("Error loading users");
            });
    });
    
    router.get("/search-cards", async (req, res) => {
        let currentUserID = req.user.id;
        let search = req.query.search;

        if (!search) {
            return res.json([]);
        }
        
        try {
            let result = await pool.query(`
                SELECT users.id AS user_id,
                users.username,
                cards.id AS card_id,
                cards.name,
                cards.game,
                cards.set_name,
                cards.rarity,
                cards.img_url,
                COUNT(user_cards.id) AS tradable_copies
                FROM user_cards
                JOIN users ON user_cards.user_id = users.id
                JOIN cards ON user_cards.card_id = cards.id
                WHERE user_cards.is_tradable = TRUE
                AND users.id != $1
                AND cards.name ILIKE $2
                GROUP BY
                users.id,
                users.username,
                cards.id,
                cards.name,
                cards.game,
                cards.set_name,
                cards.rarity,
                cards.img_url
                ORDER BY cards.name, users.username;`, [currentUserID, `%${search}%`]);
                res.json(result.rows);
            } catch (error) {
                console.error("Error searching tradable cards:", error);
                res.status(500).send("Error searching tradable cards");
        }
    });

    router.get("/users/:userID/cards", (req, res) => {
        let currentUserID = req.user.id;
        
        if (!currentUserID) {
            return res.status(401).json({ error: "Not logged in" });
        }
        let userID = req.params.userID;
        
        pool.query(`
            SELECT user_cards.id AS user_card_id,
            user_cards.user_id,
            user_cards.card_id,
            user_cards.cnd,
            cards.name,
            cards.set_name,
            cards.rarity,
            cards.img_url
            FROM user_cards
            JOIN cards on user_cards.card_id = cards.id
            WHERE user_cards.user_id = $1 
            AND user_cards.is_tradable = TRUE;`, [userID])
            .then(result => {
                res.json(result.rows);
            })
            .catch(error => {
                console.error("Error loading cards:", error);
                res.status(500).send("Error loading cards");
        });
    });
    
    router.post("/", async (req, res) => {
        let senderID = req.user.id;
        let receiverID = req.body.receiverID;
        let offeredCardIDs = req.body.offeredCardIDs;
        let requestedCardIDs = req.body.requestedCardIDs;
        
        if (!senderID) {
            return res.status(401).json({ error: "Not logged in" });
        }
        
        if (senderID == receiverID) {
            return res.status(400).json({ error: "Cannot trade with yourself" });
        }
        
        try {
            let result = await pool.query(`
                INSERT INTO trades (sender_id, receiver_id)
                VALUES ($1, $2)
                RETURNING id;`, [senderID, receiverID]);
                
                let tradeID = result.rows[0].id;
                
                for (let i = 0; i < offeredCardIDs.length; i++) {
                    await pool.query(`
                        INSERT INTO trade_cards (trade_id, user_card_id, trade_side)
                        VALUES ($1, $2, 'OFFER');`, [tradeID, offeredCardIDs[i]]);
                }
                
                for (let i = 0; i < requestedCardIDs.length; i++) {
                    await pool.query(`
                        INSERT INTO trade_cards (trade_id, user_card_id, trade_side)
                        VALUES ($1, $2, 'REQUEST');`, [tradeID, requestedCardIDs[i]]);
                }
                
                res.status(201).json({
                    message: "Trade created successfully",
                    tradeID: tradeID
                });
            } catch (error) {
                console.error("Error creating trade:", error);
                res.status(500).send("Error creating trade");
        }
    });

    router.get("/my-cards", (req, res) => {
        let userID = req.user.id;
        
        if (!userID) {
            return res.status(401).json({ error: "Not logged in" });
        }
        
        pool.query(`
            SELECT user_cards.id AS user_card_id,
            user_cards.user_id,
            user_cards.card_id,
            user_cards.cnd,
            cards.name,
            cards.set_name,
            cards.rarity,
            cards.img_url
            FROM user_cards
            JOIN cards ON user_cards.card_id = cards.id
            WHERE user_cards.user_id = $1
            AND user_cards.is_tradable = TRUE;`, [userID])
            .then(result => {
                res.json(result.rows);
            })
            .catch(error => {
                console.error("Error loading cards:", error);
                res.status(500).send("Error loading cards");
        });
    });
        
    return router;
};
