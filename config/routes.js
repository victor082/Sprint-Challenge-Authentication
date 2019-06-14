const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

const Users = require('../config/users-model')
const { authenticate, jwtKey } = require('../auth/authenticate');

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

function register(req, res) {
  let user = req.body;
  const hash = bcrypt.hashSync(user.password, 8)
  user.password = hash;
  console.log(user)


  Users.add(user)
    .then(saved => {
      res.status(201).json(saved)
    })
    .catch(error => {
      console.log('error', error)
      res.status(500).json(error)
    })

}

function login(req, res) {
  let { username, password } = req.body

  Users.findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        const token = generateToken(user);

        res.status(200).json({
          message: `Welcome back ${user.username}`,
          token,
        })
      } else {
        res.status(401).json({ message: 'Incorrect username or password. Please try again.' })
      }
    })
    .catch(error => {
      console.log(error)
      res.status(500).json(error)
    })
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: 'application/json' },
  };

  axios
    .get('https://icanhazdadjoke.com/search', requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}

function generateToken(user) {
  const payload = {
    subject: user.id,
    username: user.username,
  };

  const options = {
    expiresIn: '1d',
  };

  return jwt.sign(payload, jwtKey, options);
}