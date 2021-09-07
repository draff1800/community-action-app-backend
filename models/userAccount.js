const bcrypt          = require('bcrypt');                         // bcrypt will encrypt passwords to be saved in db
const crypto          = require('crypto');                         // built-in encryption node module
const db              = require('../db/queries');

const register = (request, response, next) => {
  console.log(request);
  const user = request;
  hashPassword(user.password)
    .then((hashedPassword) => {
      delete user.password;
      user.password_digest = hashedPassword
    })
    .then(() => createToken())
    .then(() => db.createUserAccount)
    .then(user => {
      delete user.password_digest;
      response.status(201).json({ user })
    })
    .catch((err) => console.error(err))
};

const hashPassword = (password) => {
  return new Promise((resolve, reject) =>
    bcrypt.hash(password, 10, (err, hash) => {
      err ? reject(err) : resolve(hash)
    })
  )
};

const createToken = () => {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(16, (err, data) => {
      err ? reject(err) : resolve(data.toString('base64'))
    })
  })
};

module.exports = {
  register
};
