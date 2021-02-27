import { hash, compare } from 'bcrypt';
import { query } from './db';

async function findByUsername(username) {
  const q = 'SELECT * FROM users WHERE username = $1';

  const result = await query(q, [username]);

  if (result.rowCount === 1) {
    return result.rows[0];
  }

  return null;
}

async function findById(id) {
  const q = 'SELECT * FROM users WHERE id = $1';

  const result = await query(q, [id]);

  if (result.rowCount === 1) {
    return result.rows[0];
  }

  return null;
}

async function createUser(username, password, name, email) {
  const hashedPassword = await hash(password, 11);

  const q = `
  INSERT INTO
  users (username, password, name, email)
  VALUES ($1, $2, $3, $4)`;

  return query(q, [username, hashedPassword, name, email]);
}

/**
 * Athugar hvort username og password sé til í notandakerfi.
 * Callback tekur við villu sem fyrsta argument, annað argument er
 * - `false` ef notandi ekki til eða lykilorð vitlaust
 * - Notandahlutur ef rétt
 *
 * @param {string} username Notandanafn til að athuga
 * @param {string} password Lykilorð til að athuga
 * @param {function} done Fall sem kallað er í með niðurstöðu
 */
async function userStrategy(username, password, done) {
  try {
    const user = await findByUsername(username);

    if (!user) {
      return done(null, false);
    }

    const passwordsMatch = await compare(password, user.password);

    if (passwordsMatch) {
      return done(null, user);
    }
  } catch (err) {
    console.error(err);
    return done(err);
  }

  return done(null, false);
}

function serializeUser(user, done) {
  done(null, user.id);
}

async function deserializeUser(id, done) {
  try {
    const user = await findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
}

async function users() {
  const q = 'SELECT * FROM users;';

  const result = await query(q);

  return result.rows;
}

async function setAdmin(id, admin) {
  const q = `
UPDATE users
SET admin = $1, updated = current_timestamp
WHERE id = $2`;

  const result = await query(q, [admin, id]);

  return result;
}

export default {
  findByUsername,
  findById,
  createUser,
  userStrategy,
  serializeUser,
  deserializeUser,
  users,
  setAdmin,
};
