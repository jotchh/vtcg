const express = require("express");

// TODO: using in place of auth, replace with checking logged in account
const DEV_USER_ID = 1;

// Shapes a deck row + its grouped deck_cards/cards join rows into the API response:
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

  // Each deck_cards row is one specific owned copy assigned to the deck; group
  // by card_id so the API still reports a single quantity per card, like before.
  async function getDeckCardRows(deckId) {
    let result = await pool.query(
      `SELECT c.id AS card_id, c.name, c.set_name, c.rarity, c.img_url, COUNT(*)::int AS quantity
       FROM deck_cards dc
       JOIN user_cards uc ON uc.id = dc.user_card_id
       JOIN cards c ON c.id = uc.card_id
       WHERE dc.deck_id = $1
       GROUP BY c.id, c.name, c.set_name, c.rarity, c.img_url
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
    try {
      const userId = req.user.id ?? DEV_USER_ID;

      let result = await pool.query(
        "SELECT * FROM decks WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      );
      let decks = await Promise.all(
        result.rows.map(async deckRow => toDeckDTO(deckRow, await getDeckCardRows(deckRow.id)))
      );
      res.status(200).json(decks);
    } catch (error) {
      console.error("Error loading decks:", error);
      res.status(500).send("Error loading decks");
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const userId = req.user.id ?? DEV_USER_ID;
      let deckRow = await findDeckRow(parseInt(req.params.id, 10), userId);
      if (!deckRow) return res.status(404).send("Deck not found");
      res.status(200).json(toDeckDTO(deckRow, await getDeckCardRows(deckRow.id)));
    } catch (error) {
      console.error("Error loading deck:", error);
      res.status(500).send("Error loading deck");
    }
  });

  router.post("/", async (req, res) => {
    try {
      const userId = req.user.id ?? DEV_USER_ID;
      let { name } = req.body;
      if (!name) return res.status(400).send("Deck name is required");

      let result = await pool.query(
        "INSERT INTO decks (user_id, name) VALUES ($1, $2) RETURNING *",
        [userId, name]
      );
      res.status(201).json(toDeckDTO(result.rows[0], []));
    } catch (error) {
      console.error("Error creating deck:", error);
      res.status(500).send("Error creating deck");
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const userId = req.user.id ?? DEV_USER_ID;
      let result = await pool.query(
        "DELETE FROM decks WHERE id = $1 AND user_id = $2 RETURNING id",
        [parseInt(req.params.id, 10), userId]
      );
      if (result.rows.length === 0) return res.status(404).send("Deck not found");
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting deck:", error);
      res.status(500).send("Error deleting deck");
    }
  });

  // Sets this deck's quantity of a card to an absolute total (matches the "how many
  // do you want" UI). Assigns/unassigns specific owned copies (user_cards rows) under
  // the hood: increasing picks more of the user's copies not already in this deck;
  // decreasing frees some of this deck's copies back up. Capped at total owned.
  router.post("/:id/cards", async (req, res) => {
    try {
      const userId = req.user.id ?? DEV_USER_ID;
      let deckId = parseInt(req.params.id, 10);
      let deckRow = await findDeckRow(deckId, userId);
      if (!deckRow) return res.status(404).send("Deck not found");

      let cardId = req.body.cardId;
      let targetQuantity = req.body.quantity || 1;
      let owned = await getOwnedQuantity(userId, cardId);
      if (targetQuantity > owned) {
        return res.status(400).send(`You only own ${owned} of this card`);
      }

      let currentResult = await pool.query(
        `SELECT uc.id FROM deck_cards dc
         JOIN user_cards uc ON uc.id = dc.user_card_id
         WHERE dc.deck_id = $1 AND uc.card_id = $2`,
        [deckId, cardId]
      );
      let currentCopyIds = currentResult.rows.map(r => r.id);
      let diff = targetQuantity - currentCopyIds.length;

      if (diff > 0) {
        let availableResult = await pool.query(
          `SELECT id FROM user_cards
           WHERE user_id = $1 AND card_id = $2 AND id != ALL($3::int[])
           LIMIT $4`,
          [userId, cardId, currentCopyIds, diff]
        );
        for (let row of availableResult.rows) {
          await pool.query(
            "INSERT INTO deck_cards (deck_id, user_card_id) VALUES ($1, $2)",
            [deckId, row.id]
          );
        }
      } else if (diff < 0) {
        let copiesToRemove = currentCopyIds.slice(0, -diff);
        await pool.query(
          "DELETE FROM deck_cards WHERE deck_id = $1 AND user_card_id = ANY($2::int[])",
          [deckId, copiesToRemove]
        );
      }

      res.status(200).json(toDeckDTO(deckRow, await getDeckCardRows(deckId)));
    } catch (error) {
      console.error("Error adding card to deck:", error);
      res.status(500).send("Error adding card to deck");
    }
  });

  router.delete("/:id/cards/:cardId", async (req, res) => {
    try {
      const userId = req.user.id ?? DEV_USER_ID;
      let deckId = parseInt(req.params.id, 10);
      let deckRow = await findDeckRow(deckId, userId);
      if (!deckRow) return res.status(404).send("Deck not found");

      await pool.query(
        `DELETE FROM deck_cards
         WHERE deck_id = $1 AND user_card_id IN (
           SELECT id FROM user_cards WHERE card_id = $2
         )`,
        [deckId, parseInt(req.params.cardId, 10)]
      );

      res.status(200).json(toDeckDTO(deckRow, await getDeckCardRows(deckId)));
    } catch (error) {
      console.error("Error removing card from deck:", error);
      res.status(500).send("Error removing card from deck");
    }
  });

  return router;
};
