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

    router.get("/users/:userID", (req, res) => {
        let userID = req.params.userID;
        
        pool.query(`
            SELECT id, username
            FROM users
            WHERE id = $1;`, [userID])
        .then(result => {
            if (result.rows.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }
            
            res.json(result.rows[0]);
        })
        .catch(error => {
            console.error("Error loading user:", error);
            res.status(500).send("Error loading user");
        });
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

    router.get("/my-trades", async (req, res) => {
        let currentUserID = req.user.id;
        
        try {
            let incomingResult = await pool.query(`
                SELECT
                trades.id,
                trades.sender_id,
                trades.receiver_id,
                trades.status,
                trades.created_at,
                trades.resolved_at,
                users.username AS other_username
                FROM trades
                JOIN users ON trades.sender_id = users.id
                WHERE trades.receiver_id = $1
                AND trades.status = 'PENDING'
                ORDER BY trades.created_at DESC;`, [currentUserID]);
            
            let outgoingResult = await pool.query(`
                SELECT
                trades.id,
                trades.sender_id,
                trades.receiver_id,
                trades.status,
                trades.created_at,
                trades.resolved_at,
                users.username AS other_username
                FROM trades
                JOIN users ON trades.receiver_id = users.id
                WHERE trades.sender_id = $1
                AND trades.status = 'PENDING'
                ORDER BY trades.created_at DESC;`, [currentUserID]);
                
            let completedResult = await pool.query(`
                SELECT
                trades.id,
                trades.sender_id,
                trades.receiver_id,
                trades.status,
                trades.created_at,
                trades.resolved_at,
                CASE
                    WHEN trades.sender_id = $1 THEN receiver.username
                    ELSE sender.username
                END AS other_username
                FROM trades
                JOIN users AS sender ON trades.sender_id = sender.id
                JOIN users AS receiver ON trades.receiver_id = receiver.id
                WHERE (trades.sender_id = $1 OR trades.receiver_id = $1)
                AND trades.status != 'PENDING'
                ORDER BY trades.resolved_at DESC;`, [currentUserID]);
                
            res.json({
                incoming: incomingResult.rows,
                outgoing: outgoingResult.rows,
                completed: completedResult.rows
            });
        } catch (error) {
            console.error("Error loading trades:", error);
            res.status(500).send("Error loading trades");
        }
    });

    router.get("/:tradeID/cards", async (req, res) => {
        let currentUserID = req.user.id;
        let tradeID = req.params.tradeID;

        try {
            let tradeResult = await pool.query(`
                SELECT id
                FROM trades
                WHERE id = $1
                AND (sender_id = $2 OR receiver_id = $2);`, [tradeID, currentUserID]);
            
            if (tradeResult.rows.length === 0) {
                return res.status(404).json({ error: "Trade not found" });
            }
            
            let result = await pool.query(`
                SELECT
                trade_cards.trade_side,
                user_cards.id AS user_card_id,
                user_cards.cnd,
                cards.name,
                cards.set_name,
                cards.img_url
                FROM trade_cards
                JOIN user_cards ON trade_cards.user_card_id = user_cards.id
                JOIN cards ON user_cards.card_id = cards.id
                WHERE trade_cards.trade_id = $1;`, [tradeID]);
            
            res.json(result.rows);
        } catch (error) {
            console.error("Error loading trade cards:", error);
            res.status(500).send("Error loading trade cards");
        }
    });

    router.patch("/:tradeID/reject", async (req, res) => {
        let currentUserID = req.user.id;
        let tradeID = req.params.tradeID;
        
        try {
            let result = await pool.query(`
                UPDATE trades
                SET status = 'REJECTED',
                resolved_at = CURRENT_TIMESTAMP
                WHERE id = $1
                AND receiver_id = $2
                AND status = 'PENDING'
                RETURNING id;`, [tradeID, currentUserID]);
                
            if (result.rows.length === 0) {
                return res.status(400).json({ error: "Trade cannot be rejected" });
            }
                
            res.json({ message: "Trade rejected" });
        } catch (error) {
            console.error("Error rejecting trade:", error);
            res.status(500).send("Error rejecting trade");
        }
    });
    
    router.patch("/:tradeID/accept", async (req, res) => {
        let currentUserID = req.user.id;
        let tradeID = req.params.tradeID;

        let client = await pool.connect();
        
        try {
            await client.query("BEGIN");
            
            let tradeResult = await client.query(`
                SELECT id, sender_id, receiver_id, status
                FROM trades
                WHERE id = $1
                FOR UPDATE;`, [tradeID]);
                
            if (tradeResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ error: "Trade not found" });
            }
            
            let trade = tradeResult.rows[0];
            
            if (trade.receiver_id !== currentUserID) {
                await client.query("ROLLBACK");
                return res.status(403).json({ error: "Only the receiver can accept this trade" });
            }
                
            if (trade.status !== "PENDING") {
                await client.query("ROLLBACK");
                return res.status(400).json({ error: "Trade is no longer pending" });
            }
                
            let tradeCardsResult = await client.query(`
                SELECT
                trade_cards.user_card_id,
                trade_cards.trade_side,
                user_cards.user_id,
                user_cards.is_tradable
                FROM trade_cards
                JOIN user_cards
                ON trade_cards.user_card_id = user_cards.id
                WHERE trade_cards.trade_id = $1;`, [tradeID]);
                    
            let tradeCards = tradeCardsResult.rows;
                    
            for (let i = 0; i < tradeCards.length; i++) {
                let card = tradeCards[i];
                        
                if (card.is_tradable !== true) {
                    await client.query("ROLLBACK");
                    return res.status(400).json({ error: "One or more cards are no longer tradable" });
                }
                        
                if (card.trade_side === "OFFER" && card.user_id !== trade.sender_id) {
                    await client.query("ROLLBACK");
                    return res.status(400).json({ error: "One or more offered cards are no longer owned by the sender" });
                }
                        
                if (card.trade_side === "REQUEST" && card.user_id !== trade.receiver_id) {
                    await client.query("ROLLBACK");
                    return res.status(400).json({ error: "One or more requested cards are no longer owned by the receiver" });
                }
            }
                    
            await client.query(`
                DELETE FROM deck_cards
                WHERE user_card_id IN (
                    SELECT user_card_id
                    FROM trade_cards
                    WHERE trade_id = $1);`, [tradeID]);

            await client.query(`
                UPDATE user_cards
                SET user_id = $1,
                is_tradable = FALSE
                WHERE id IN (
                SELECT user_card_id
                FROM trade_cards
                WHERE trade_id = $2
                AND trade_side = 'OFFER');`, [trade.receiver_id, tradeID]);
                        
            await client.query(`
                UPDATE user_cards
                SET user_id = $1,
                is_tradable = FALSE
                WHERE id IN (
                SELECT user_card_id
                FROM trade_cards
                WHERE trade_id = $2
                AND trade_side = 'REQUEST');`, [trade.sender_id, tradeID]);

            await client.query(`
                UPDATE trades
                SET status = 'CANCELLED',
                resolved_at = CURRENT_TIMESTAMP
                WHERE status = 'PENDING'
                AND id != $1
                AND id IN (
                    SELECT DISTINCT trade_id
                    FROM trade_cards
                    WHERE user_card_id IN (
                        SELECT user_card_id
                        FROM trade_cards
                        WHERE trade_id = $1));`, [tradeID]); 
                    
            await client.query(`
                UPDATE trades
                SET status = 'COMPLETED',
                resolved_at = CURRENT_TIMESTAMP
                WHERE id = $1;`, [tradeID]);
                    
            await client.query("COMMIT");
            res.json({ message: "Trade accepted successfully" });
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("Error accepting trade:", error);
            res.status(500).send("Error accepting trade");
        } finally {
            client.release();
        }
    });
        
    return router;
};