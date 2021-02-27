import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy } from 'passport-local';
import { router as registrationRouter } from './registration.js';
import * as adminJs from './admin.js';

const { userStrategy, serializeUser, deserializeUser } = require('./users');

dotenv.config();

const {
  PORT: port = 3000,
  SESSION_SECRET: sessionSecret,
  DATABASE_URL: connectionString,
} = process.env;

if (!connectionString || !sessionSecret) {
  console.error('Vantar gögn í env');
  process.exit(1);
}

const app = express();

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
}));

app.use(express.urlencoded({ extended: true }));

passport.use(new Strategy(userStrategy));

passport.serializeUser(serializeUser);
passport.deserializeUser(deserializeUser);

app.use(passport.initialize());
app.use(passport.session());

const path = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(path, '../public')));

app.set('views', join(path, '../views'));
app.set('view engine', 'ejs');

/**
 * Hjálparfall til að athuga hvort reitur sé gildur eða ekki.
 *
 * @param {string} field Middleware sem grípa á villur fyrir
 * @param {array} errors Fylki af villum frá express-validator pakkanum
 * @returns {boolean} `true` ef `field` er í `errors`, `false` annars
 */
function isInvalid(field, errors) {
  return Boolean(errors.find((i) => i.param === field));
}

app.locals.isInvalid = isInvalid;

app.use((req, res, next) => {
  // Látum `users` alltaf vera til fyrir view
  res.locals.user = req.isAuthenticated() ? req.user : null;

  next();
});

app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }

  let message = '';

  if (req.session.messages && req.session.messages.length > 0) {
    message = req.session.messages.join(', ');
    req.session.messages = [];
  }

  return res.render('login', { page: 'login', title: 'Innskráning', message });
});

app.post(
  '/login',

  passport.authenticate('local', {
    failureMessage: 'Notandi eða lykilorð vitlaust.',
    failureRedirect: '/login',
  }),

  (req, res) => {
    res.redirect('/admin');
  },
);

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.use('/admin', adminJs.router);
app.use('/', registrationRouter);

function notFoundHandler(req, res, next) { // eslint-disable-line
  res.status(404).render('error', { page: 'error', title: '404', error: '404 fannst ekki' });
}

function errorHandler(error, req, res, next) { // eslint-disable-line
  console.error(error);
  res.status(500).render('error', { page: 'error', title: 'Villa', error });
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  // eslint-disable-next-line no-undef
  console.info(`Server running at http://${hostname}:${port}/`);
});
