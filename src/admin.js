import express from 'express';

const { catchErrors, ensureLoggedIn, ensureAdmin } = require('./utils');
const { users, setAdmin } = require('./users');

const router = express.Router();

/**
 * Route fyrir lista af notendum.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
async function userRoute(req, res) {
  const list = await users();

  const data = {
    title: 'Notendur',
    users: list,
    page: 'admin',
  };

  return res.render('users', data);
}

/**
 * Route fyrir update á notendum. Tekur við `admin` fylki í body sem inniheldur
 * lista af þeim notenda ids sem eiga að verða admin. eyðir þeim notendum sem ekki
 * eru í þessum lista.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
async function updateUsers(req, res) {
  const { admin } = req.body;

  const list = await users();

  const updates = list.map(async (user) => {
    const found = admin.find(i => Number.parseInt(i, 10) === user.id);
    const formAdmin = Boolean(found);

    if (formAdmin !== user.admin) {
      await setAdmin(user.id, formAdmin);
    }
  });

  await Promise.all(updates);

  return res.redirect('/admin');
}

router.get('/', ensureLoggedIn, catchErrors(userRoute));
router.post('/', ensureLoggedIn, ensureAdmin, catchErrors(updateUsers));

module.exports = router;