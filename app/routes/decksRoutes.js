const express = require("express");
const router = express.Router();
const deckService = require("../services/deckService");

//unused pool for now, deckService has fake data
module.exports = function (pool) {
  router.get("/", (req, res) => {
    res.status(200).json(deckService.listDecksForUser(req.userId));
  });

  router.get("/:id", (req, res) => {
    let deck = deckService.getDeck(parseInt(req.params.id, 10), req.userId);
    if (!deck) return res.status(404).send("Deck not found");
    res.status(200).json(deck);
  });

  router.post("/", (req, res) => {
    let { name, deckType } = req.body;
    try {
      let deck = deckService.createDeck(req.userId, name, deckType);
      res.status(201).json(deck);
    } catch (error) {
      res.status(400).send(error.message);
    }
  });

  router.delete("/:id", (req, res) => {
    let ok = deckService.deleteDeck(parseInt(req.params.id, 10), req.userId);
    if (!ok) return res.status(404).send("Deck not found");
    res.status(204).send();
  });

  router.post("/:id/cards", (req, res) => {
    let deck = deckService.addCardToDeck(parseInt(req.params.id, 10), req.userId, req.body);
    if (!deck) return res.status(404).send("Deck not found");
    res.status(200).json(deck);
  });

  router.delete("/:id/cards/:cardId", (req, res) => {
    let deck = deckService.removeCardFromDeck(
      parseInt(req.params.id, 10),
      req.userId,
      parseInt(req.params.cardId, 10)
    );
    if (!deck) return res.status(404).send("Deck not found");
    res.status(200).json(deck);
  });

  // adds unowned cards in wishlist deck to the wishlist when finished editing
  router.post("/:id/finish-editing", (req, res) => {
    let wishlist = deckService.syncWishlistDeckToWishlist(parseInt(req.params.id, 10), req.userId);
    if (wishlist === null) {
      return res.status(200).json({ synced: false });
    }
    res.status(200).json({ synced: true, wishlist });
  });

  return router;
};
