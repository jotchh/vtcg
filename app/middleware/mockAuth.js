// fake auth will wire later - matches main's req.session.userId shape so swapping
// this middleware out for the real session auth won't require touching any routes
module.exports = function mockAuth(req, res, next) {
  req.session = req.session || {};
  req.session.userId = 1;
  next();
};
