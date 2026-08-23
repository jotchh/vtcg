const express = require("express");

// TODO: using in place of auth, replace with checking logged in account
const DEV_USER_ID = 1;

// Shapes a deck row + its deck_cards/cards join rows into the API response:
// { id, userId, name, createdAt, cards: [{ cardId, name, set_name, rarity, img_url, quantity }] }
function toDeckDTO(deckRow, cardRows) {
  return {
    id: deckRow.id,
    userId: deckRow.user_id,
    name: deckRow.name,
    createdAt: deckRow.created_at,
    cards: cardRows.map(c => ({
      cardId: c.card_id,
      name: c.name,
      set_name: c.set_name,
      rarity: c.rarity,
      img_url: c.img_url,
      quantity: c.quantity,
    })),
  };
}

module.exports = function (pool) {
  const router = express.Router();

  async function getDeckCardRows(deckId) {
    let result = await pool.query(
      `SELECT dc.card_id, dc.quantity, c.name, c.set_name, c.rarity, c.img_url
       FROM deck_cards dc
       JOIN cards c ON c.id = dc.card_id
       WHERE dc.deck_id = $1
       ORDER BY c.name`,
      [deckId]
    );
    return result.rows;
  }

  async function findDeckRow(deckId, userId) {
    let result = await pool.query(
      "SELECT * FROM decks WHERE id = $1 AND user_id = $2",
      [deckId, userId]
    );
    return result.rows[0] || null;
  }

  // How many of this card the user owns, from their collection.
  async function getOwnedQuantity(userId, cardId) {
    let result = await pool.query(
      "SELECT COUNT(*)::int AS quantity FROM user_cards WHERE user_id = $1 AND card_id = $2",
      [userId, cardId]
    );
    return result.rows[0].quantity;
  }

  router.get("/", async (req, res) => {
    const userId = req.session?.userId ?? DEV_USER_ID;

    let result = await pool.query(
      "SELECT * FROM decks WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    let decks = await Promise.all(
      result.rows.map(async deckRow => toDeckDTO(deckRow, await getDeckCardRows(deckRow.id)))
    );
    res.status(200).json(decks);
  });

  router.get("/:id", async (req, res) => {
    const userId = req.session?.userId ?? DEV_USER_ID;
    let deckRow = await findDeckRow(parseInt(req.params.id, 10), userId);
    if (!deckRow) return res.status(404).send("Deck not found");
    res.status(200).json(toDeckDTO(deckRow, await getDeckCardRows(deckRow.id)));
  });

  router.post("/", async (req, res) => {
    const userId = req.session?.userId ?? DEV_USER_ID;
    let { name } = req.body;
    if (!name) return res.status(400).send("Deck name is required");

    let result = await pool.query(
      "INSERT INTO decks (user_id, name) VALUES ($1, $2) RETURNING *",
      [userId, name]
    );
    res.status(201).json(toDeckDTO(result.rows[0], []));
  });

  router.delete("/:id", async (req, res) => {
    const userId = req.session?.userId ?? DEV_USER_ID;
    let result = await pool.query(
      "DELETE FROM decks WHERE id = $1 AND user_id = $2 RETURNING id",
      [parseInt(req.params.id, 10), userId]
    );
    if (result.rows.length === 0) return res.status(404).send("Deck not found");
    res.status(204).send();
  });

  // Adds/increases a card in the deck, capped at how many of it the user owns.
  router.post("/:id/cards", async (req, res) => {
    const userId = req.session?.userId ?? DEV_USER_ID;
    let deckId = parseInt(req.params.id, 10);
    let deckRow = await findDeckRow(deckId, userId);
    if (!deckRow) return res.status(404).send("Deck not found");

    let cardId = req.body.cardId;
    let requestedQuantity = req.body.quantity || 1;
    let owned = await getOwnedQuantity(userId, cardId);
    if (requestedQuantity > owned) {
      return res.status(400).send(`You only own ${owned} of this card`);
    }

    await pool.query(
      `INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES ($1, $2, $3)
       ON CONFLICT (deck_id, card_id) DO UPDATE SET quantity = $3`,
      [deckId, cardId, requestedQuantity]
    );

    res.status(200).json(toDeckDTO(deckRow, await getDeckCardRows(deckId)));
  });

  router.delete("/:id/cards/:cardId", async (req, res) => {
    const userId = req.session?.userId ?? DEV_USER_ID;
    let deckId = parseInt(req.params.id, 10);
    let deckRow = await findDeckRow(deckId, userId);
    if (!deckRow) return res.status(404).send("Deck not found");

    await pool.query(
      "DELETE FROM deck_cards WHERE deck_id = $1 AND card_id = $2",
      [deckId, parseInt(req.params.cardId, 10)]
    );

    res.status(200).json(toDeckDTO(deckRow, await getDeckCardRows(deckId)));
  });

  return router;
};
