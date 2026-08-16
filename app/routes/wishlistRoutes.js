const express = require("express");
const router = express.Router();
const makeDeckService = require("../services/deckService");

module.exports = function (pool) {
  const deckService = makeDeckService(pool);

  router.get("/", async (req, res) => {
    res.status(200).json(await deckService.listWishlistForUser(req.session.userId));
  });

  router.post("/", async (req, res) => {
    let wishlist = await deckService.addCardToWishlist(req.session.userId, req.body);
    res.status(200).json(wishlist);
  });

  router.delete("/:cardId", async (req, res) => {
    let wishlist = await deckService.removeCardFromWishlist(req.session.userId, parseInt(req.params.cardId, 10));
    res.status(200).json(wishlist);
  });

  return router;
};
