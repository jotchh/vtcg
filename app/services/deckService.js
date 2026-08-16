const DECK_TYPES = ["TRUE", "WISHLIST"];

// Shapes a deck row + its deck_cards rows into the API response the frontend expects:
// { id, userId, name, deckType, createdAt, cards: [{ cardId, name, set_name, rarity, img_url, quantity, userCardId }] }
function toDeckDTO(deckRow, cardRows) {
  return {
    id: deckRow.id,
    userId: deckRow.user_id,
    name: deckRow.name,
    deckType: deckRow.deck_type,
    createdAt: deckRow.created_at,
    cards: cardRows.map(c => ({
      cardId: c.card_id,
      userCardId: c.user_card_id,
      name: c.name,
      set_name: c.set_name,
      rarity: c.rarity,
      img_url: c.img_url,
      quantity: c.quantity,
    })),
  };
}

async function getDeckCardRows(pool, deckId) {
  let result = await pool.query(
    `SELECT
       COALESCE(dc.card_id, uc.card_id) AS card_id,
       dc.user_card_id, dc.quantity, c.name, c.set_name, c.rarity, c.img_url
     FROM deck_cards dc
     LEFT JOIN user_cards uc ON uc.id = dc.user_card_id
     JOIN cards c ON c.id = COALESCE(dc.card_id, uc.card_id)
     WHERE dc.deck_id = $1
     ORDER BY dc.id`,
    [deckId]
  );
  return result.rows;
}

function makeDeckService(pool) {
  async function findDeckRow(deckId, userId) {
    let result = await pool.query(
      "SELECT * FROM decks WHERE id = $1 AND user_id = $2",
      [deckId, userId]
    );
    return result.rows[0] || null;
  }

  async function listDecksForUser(userId) {
    let result = await pool.query(
      "SELECT * FROM decks WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return Promise.all(
      result.rows.map(async deckRow => toDeckDTO(deckRow, await getDeckCardRows(pool, deckRow.id)))
    );
  }

  async function getDeck(deckId, userId) {
    let deckRow = await findDeckRow(deckId, userId);
    if (!deckRow) return null;
    return toDeckDTO(deckRow, await getDeckCardRows(pool, deckId));
  }

  async function createDeck(userId, name, deckType) {
    if (!DECK_TYPES.includes(deckType)) {
      throw new Error(`deckType must be one of ${DECK_TYPES.join(", ")}`);
    }
    let result = await pool.query(
      "INSERT INTO decks (user_id, name, deck_type) VALUES ($1, $2, $3) RETURNING *",
      [userId, name, deckType]
    );
    return toDeckDTO(result.rows[0], []);
  }

  async function deleteDeck(deckId, userId) {
    let result = await pool.query(
      "DELETE FROM decks WHERE id = $1 AND user_id = $2 RETURNING id",
      [deckId, userId]
    );
    return result.rows.length > 0;
  }

  // TRUE decks add a specific owned copy (userCardId); WISHLIST decks add a card by id + quantity.
  async function addCardToDeck(deckId, userId, card) {
    let deckRow = await findDeckRow(deckId, userId);
    if (!deckRow) return null;

    if (deckRow.deck_type === "WISHLIST") {
      await pool.query(
        "INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES ($1, $2, $3)",
        [deckId, card.cardId, card.quantity || 1]
      );
    } else {
      await pool.query(
        "INSERT INTO deck_cards (deck_id, user_card_id, quantity) VALUES ($1, $2, $3)",
        [deckId, card.userCardId, card.quantity || 1]
      );
    }

    return toDeckDTO(deckRow, await getDeckCardRows(pool, deckId));
  }

  async function removeCardFromDeck(deckId, userId, cardId) {
    let deckRow = await findDeckRow(deckId, userId);
    if (!deckRow) return null;

    if (deckRow.deck_type === "WISHLIST") {
      await pool.query("DELETE FROM deck_cards WHERE deck_id = $1 AND card_id = $2", [deckId, cardId]);
    } else {
      await pool.query(
        "DELETE FROM deck_cards WHERE deck_id = $1 AND user_card_id IN (SELECT id FROM user_cards WHERE card_id = $2)",
        [deckId, cardId]
      );
    }

    return toDeckDTO(deckRow, await getDeckCardRows(pool, deckId));
  }

  // The wishlist is just the user's single WISHLIST-type deck, created on first use.
  // These three functions delegate to the deck functions above and unwrap `.cards`.
  async function getOrCreateWishlistDeck(userId) {
    let result = await pool.query(
      "SELECT * FROM decks WHERE user_id = $1 AND deck_type = 'WISHLIST' ORDER BY created_at ASC LIMIT 1",
      [userId]
    );
    if (result.rows.length > 0) return result.rows[0];

    let created = await pool.query(
      "INSERT INTO decks (user_id, name, deck_type) VALUES ($1, $2, 'WISHLIST') RETURNING *",
      [userId, "Wishlist"]
    );
    return created.rows[0];
  }

  async function listWishlistForUser(userId) {
    let deck = await getOrCreateWishlistDeck(userId);
    return (await getDeck(deck.id, userId)).cards;
  }

  async function addCardToWishlist(userId, card) {
    let deck = await getOrCreateWishlistDeck(userId);
    return (await addCardToDeck(deck.id, userId, card)).cards;
  }

  async function removeCardFromWishlist(userId, cardId) {
    let deck = await getOrCreateWishlistDeck(userId);
    return (await removeCardFromDeck(deck.id, userId, cardId)).cards;
  }

  return {
    DECK_TYPES,
    listDecksForUser,
    getDeck,
    createDeck,
    deleteDeck,
    addCardToDeck,
    removeCardFromDeck,
    listWishlistForUser,
    addCardToWishlist,
    removeCardFromWishlist,
  };
}

module.exports = makeDeckService;
