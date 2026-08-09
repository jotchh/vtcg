//fake data will wire up later

const DECK_TYPES = ["TRUE", "WISHLIST"];

let nextDeckId = 3;
let decks = [
  {
    id: 1,
    userId: 1,
    name: "Mono Red Aggro",
    deckType: "TRUE",
    createdAt: new Date().toISOString(),
    cards: [
      { cardId: 101, name: "Lightning Bolt", set_name: "Alpha", rarity: "C", img_url: "", quantity: 4 },
      { cardId: 102, name: "Goblin Guide", set_name: "Zendikar", rarity: "R", img_url: "", quantity: 4 },
    ],
  },
  {
    id: 2,
    userId: 1,
    name: "Dream Standard Build",
    deckType: "WISHLIST",
    createdAt: new Date().toISOString(),
    cards: [
      { cardId: 201, name: "Teferi, Time Raveler", set_name: "War of the Spark", rarity: "M", img_url: "", quantity: 1 },
    ],
  },
];

let wishlistsByUser = {
  1: [],
};

function listDecksForUser(userId) {
  return decks.filter(d => d.userId === userId);
}

function getDeck(deckId, userId) {
  return decks.find(d => d.id === deckId && d.userId === userId) || null;
}

function createDeck(userId, name, deckType) {
  if (!DECK_TYPES.includes(deckType)) {
    throw new Error(`deckType must be one of ${DECK_TYPES.join(", ")}`);
  }
  let deck = {
    id: nextDeckId++,
    userId,
    name,
    deckType,
    createdAt: new Date().toISOString(),
    cards: [],
  };
  decks.push(deck);
  return deck;
}

function deleteDeck(deckId, userId) {
  let index = decks.findIndex(d => d.id === deckId && d.userId === userId);
  if (index === -1) return false;
  decks.splice(index, 1);
  return true;
}

function addCardToDeck(deckId, userId, card) {
  let deck = getDeck(deckId, userId);
  if (!deck) return null;

  // TODO: true decks should only allow cards user actually owns, need collections API for that
  deck.cards.push(card);
  return deck;
}

function removeCardFromDeck(deckId, userId, cardId) {
  let deck = getDeck(deckId, userId);
  if (!deck) return null;
  deck.cards = deck.cards.filter(c => c.cardId !== cardId);
  return deck;
}

// TODO: figure out how to tell owned vs not-owned cards once collections exists
// for now just dumps every card in the deck into the wishlist, not correct
function syncWishlistDeckToWishlist(deckId, userId) {
  let deck = getDeck(deckId, userId);
  if (!deck || deck.deckType !== "WISHLIST") return null;

  let wishlist = wishlistsByUser[userId] || (wishlistsByUser[userId] = []);
  for (let card of deck.cards) {
    wishlist.push(card);
  }
  return wishlist;
}

function listWishlistForUser(userId) {
  return wishlistsByUser[userId] || [];
}

function addCardToWishlist(userId, card) {
  let wishlist = wishlistsByUser[userId] || (wishlistsByUser[userId] = []);
  wishlist.push(card);
  return wishlist;
}

function removeCardFromWishlist(userId, cardId) {
  let wishlist = wishlistsByUser[userId] || [];
  wishlistsByUser[userId] = wishlist.filter(c => c.cardId !== cardId);
  return wishlistsByUser[userId];
}

module.exports = {
  DECK_TYPES,
  listDecksForUser,
  getDeck,
  createDeck,
  deleteDeck,
  addCardToDeck,
  removeCardFromDeck,
  syncWishlistDeckToWishlist,
  listWishlistForUser,
  addCardToWishlist,
  removeCardFromWishlist,
};
