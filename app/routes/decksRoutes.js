const express = require("express");
const router = express.Router();
const makeDeckService = require("../services/deckService");

module.exports = function (pool) {
  const deckService = makeDeckService(pool);

  router.get("/", async (req, res) => {
    res.status(200).json(await deckService.listDecksForUser(req.session.userId));
  });

  router.get("/:id", async (req, res) => {
    let deck = await deckService.getDeck(parseInt(req.params.id, 10), req.session.userId);
    if (!deck) return res.status(404).send("Deck not found");
    res.status(200).json(deck);
  });

  router.post("/", async (req, res) => {
    let { name, deckType } = req.body;
    try {
      let deck = await deckService.createDeck(req.session.userId, name, deckType);
      res.status(201).json(deck);
    } catch (error) {
      res.status(400).send(error.message);
    }
  });

  router.delete("/:id", async (req, res) => {
    let ok = await deckService.deleteDeck(parseInt(req.params.id, 10), req.session.userId);
    if (!ok) return res.status(404).send("Deck not found");
    res.status(204).send();
  });

  router.post("/:id/cards", async (req, res) => {
    let deck = await deckService.addCardToDeck(parseInt(req.params.id, 10), req.session.userId, req.body);
    if (!deck) return res.status(404).send("Deck not found");
    res.status(200).json(deck);
  });

  router.delete("/:id/cards/:cardId", async (req, res) => {
    let deck = await deckService.removeCardFromDeck(
      parseInt(req.params.id, 10),
      req.session.userId,
      parseInt(req.params.cardId, 10)
    );
    if (!deck) return res.status(404).send("Deck not found");
    res.status(200).json(deck);
  });

  return router;
};
