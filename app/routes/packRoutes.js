const express = require("express");
const router = express.Router();

const DEFAULT_RARITY_ODDS = { M: 0.02, R: 0.08, U: 0.2, C: 0.7 };
const CONDITION_ODDS = [
  ["NM", 0.85],
  ["LP", 0.1],
  ["MP", 0.04],
  ["HP", 0.01],
];

function pickWeighted(entries) {
  const roll = Math.random();
  let cumulative = 0;
  for (const [value, weight] of entries) {
    cumulative += weight;
    if (roll <= cumulative) return value;
  }
  return entries[entries.length - 1][0];
}

// TODO: remove once real authenticatoin is added. lets packs work without a logged-in session
const DEV_USER_ID = 1;

module.exports = function (pool, env) {
  const economy = env.economy || {};
  const DAILY_FREE_OPENS = economy.dailyFreeOpens ?? 5;
  const PACK_SIZE = economy.packSize ?? 5;
  const SCRAP_COST = economy.scrapCost ?? 10;
  const RARITY_ODDS = Object.entries(economy.rarityOdds ?? DEFAULT_RARITY_ODDS);

  async function resetDailyOpensIfNeeded(client, userId) {
    await client.query(
      `UPDATE users SET daily_pack_opens = $2, pack_reset_date = CURRENT_DATE
       WHERE id = $1 AND pack_reset_date < CURRENT_DATE`,
      [userId, DAILY_FREE_OPENS]
    );
  }

  async function pullPack(client, userId, game, set_name) {
    const cardPool = await client.query(
      "SELECT * FROM cards WHERE game = $1 AND set_name = $2",
      [game, set_name]
    );

    if (cardPool.rows.length === 0) {
      return null;
    }

    const byRarity = {};
    for (const card of cardPool.rows) {
      (byRarity[card.rarity] ??= []).push(card);
    }

    const pulled = [];
    for (let i = 0; i < PACK_SIZE; i++) {
      const rarity = pickWeighted(RARITY_ODDS);
      const options = byRarity[rarity]?.length ? byRarity[rarity] : cardPool.rows;
      pulled.push(options[Math.floor(Math.random() * options.length)]);
    }

    const historyResult = await client.query(
      "INSERT INTO pack_history (user_id, game, set_name) VALUES ($1, $2, $3) RETURNING id",
      [userId, game, set_name]
    );
    const packHistoryId = historyResult.rows[0].id;

    for (const card of pulled) {
      await client.query(
        `INSERT INTO user_cards (card_id, user_id, pack_history_id, cnd)
         VALUES ($1, $2, $3, $4)`,
        [card.id, userId, packHistoryId, pickWeighted(CONDITION_ODDS)]
      );
    }

    await client.query(
      "UPDATE users SET packs_opened = packs_opened + 1, cards_owned = cards_owned + $2 WHERE id = $1",
      [userId, pulled.length]
    );

    return pulled;
  }

  router.get("/", async (req, res) => {
    const client = await pool.connect();

    const userId = req.session.userId ?? DEV_USER_ID;

    try {
      await resetDailyOpensIfNeeded(client, userId);

      const { rows } = await client.query(
        "SELECT daily_pack_opens FROM users WHERE id = $1",
        [userId]
      );
      const sets = await client.query(
        "SELECT DISTINCT game, set_name FROM cards ORDER BY game, set_name"
      );

      res.json({
        dailyPackOpens: rows[0].daily_pack_opens,
        packSize: PACK_SIZE,
        scrapCost: SCRAP_COST,
        sets: sets.rows,
      });
    } catch (err) {
      console.error("Error loading pack info:", err);
      res.status(500).send("Error loading pack info");
    } finally {
      client.release();
    }
  });

  router.post("/open", async (req, res) => {
    const { game, set_name } = req.body;
    if (!game || !set_name) {
      return res.status(400).send("game and set_name are required");
    }

    const userId = req.session.userId ?? DEV_USER_ID;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await resetDailyOpensIfNeeded(client, userId);

      const spend = await client.query(
        "UPDATE users SET daily_pack_opens = daily_pack_opens - 1 WHERE id = $1 AND daily_pack_opens > 0 RETURNING daily_pack_opens",
        [userId]
      );
      if (spend.rows.length === 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .send("No free pack opens left today. Scrap 10 cards for a free pack instead.");
      }

      const pulled = await pullPack(client, userId, game, set_name);
      if (!pulled) {
        await client.query("ROLLBACK");
        return res.status(404).send("No cards found for that game/set");
      }

      await client.query("COMMIT");
      res.status(200).json({ cards: pulled });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error opening pack:", err);
      res.status(500).send("Error opening pack");
    } finally {
      client.release();
    }
  });

  router.post("/scrap-open", async (req, res) => {
    const { game, set_name, user_card_ids } = req.body;
    if (!game || !set_name) {
      return res.status(400).send("game and set_name are required");
    }
    if (!Array.isArray(user_card_ids) || user_card_ids.length !== SCRAP_COST) {
      return res.status(400).send(`Exactly ${SCRAP_COST} card ids are required to scrap`);
    }

    const userId = req.session.userId ?? DEV_USER_ID;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const owned = await client.query(
        "SELECT id FROM user_cards WHERE id = ANY($1::int[]) AND user_id = $2 FOR UPDATE",
        [user_card_ids, userId]
      );
      if (owned.rows.length !== SCRAP_COST) {
        await client.query("ROLLBACK");
        return res.status(400).send("One or more cards are not in your collection");
      }

      await client.query("DELETE FROM user_cards WHERE id = ANY($1::int[])", [user_card_ids]);
      await client.query("UPDATE users SET cards_owned = cards_owned - $2 WHERE id = $1", [
        userId,
        SCRAP_COST,
      ]);

      const pulled = await pullPack(client, userId, game, set_name);
      if (!pulled) {
        await client.query("ROLLBACK");
        return res.status(404).send("No cards found for that game/set");
      }

      await client.query("COMMIT");
      res.status(200).json({ cards: pulled });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error scrapping cards for pack:", err);
      res.status(500).send("Error scrapping cards for pack");
    } finally {
      client.release();
    }
  });

  return router;
};
