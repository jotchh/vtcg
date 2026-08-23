let express = require("express");
let router = express.Router();

module.exports = function(pool) {
    router.get("/users", (req, res) => {
        pool.query(`
            SELECT users.id, users.username, COUNT(user_cards.id) AS tradable_cards
            FROM users
            JOIN user_cards ON users.id = user_cards.user_id
            WHERE is_tradable = TRUE
            GROUP BY users.id, users.username;
            `)
            .then(result => {
                res.json(result.rows);
            })
            .catch(error => {
                console.error("Error loading users:", error);
                res.status(500).send("Error loading users");
            });
    });

    router.get("/users/:userID/cards", (req, res) => {
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
                res.status(500).send("Error loading cards")
        });
    });
    
    router.post("/", async (req, res) => {
        let senderID = req.body.senderID;
        let receiverID = req.body.receiverID;
        let offeredCardIDs = req.body.offeredCardIDs;
        let requestedCardIDs = req.body.requestedCardIDs;
        
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
        
    return router;
};