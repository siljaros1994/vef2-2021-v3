const xss = require('xss');

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
export function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

/**
 * Sér til þess að það sé notandi innskráður í request.
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {funcion} next Næsta middleware
 */
function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.redirect('/login');
}

/**
 * Sér til þess að innskráður notandi sé admin.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {funcion} next Næsta middleware
 */
function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user && req.user.admin) {
    return next();
  }

  return res.redirect('/login');
}

/**
 * Hjálparfall sem XSS hreinsar reit í formi eftir heiti.
 *
 * @param {string} fieldName Heiti á reit
 * @returns {function} Middleware sem hreinsar reit ef hann finnst
 */
function sanitizeXss(fieldName) {
  return (req, res, next) => {
    if (!req.body) {
      next();
    }

    const field = req.body[fieldName];

    if (field) {
      req.body[fieldName] = xss(field);
    }

    next();
  };
}

module.exports = {
  catchErrors,
  ensureLoggedIn,
  ensureAdmin,
  sanitizeXss,
};
