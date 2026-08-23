const express = require("express");

// TODO: using in place of auth, replace with checking logged in account
const DEV_USER_ID = 1;

module.exports = function (pool) {
  const router = express.Router();

  async function getWishlistRows(userId) {
    let result = await pool.query(
      `SELECT wc.card_id, wc.quantity, c.name, c.set_name, c.rarity, c.img_url
       FROM wishlist_cards wc
       JOIN cards c ON c.id = wc.card_id
       WHERE wc.user_id = $1
       ORDER BY c.name`,
      [userId]
    );
    return result.rows.map(c => ({
      cardId: c.card_id,
      name: c.name,
      set_name: c.set_name,
      rarity: c.rarity,
      img_url: c.img_url,
      quantity: c.quantity,
    }));
  }

  router.get("/", async (req, res) => {
    const userId = req.session?.userId ?? DEV_USER_ID;
    res.status(200).json(await getWishlistRows(userId));
  });

  router.post("/", async (req, res) => {
    const userId = req.session?.userId ?? DEV_USER_ID;
    let { cardId, quantity } = req.body;

    await pool.query(
      `INSERT INTO wishlist_cards (user_id, card_id, quantity) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, card_id) DO UPDATE SET quantity = $3`,
      [userId, cardId, quantity || 1]
    );

    res.status(200).json(await getWishlistRows(userId));
  });

  router.delete("/:cardId", async (req, res) => {
    const userId = req.session?.userId ?? DEV_USER_ID;
    await pool.query(
      "DELETE FROM wishlist_cards WHERE user_id = $1 AND card_id = $2",
      [userId, parseInt(req.params.cardId, 10)]
    );
    res.status(200).json(await getWishlistRows(userId));
  });

  return router;
};
