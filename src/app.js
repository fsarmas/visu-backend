const express = require('express');
const mongoose = require('mongoose');
const config = require('config');

const auth = require('./auth.js');
const mainRouter = require('./routes/index');

const app = express();
app.use(express.json());
app.use(auth.initializePassport());
app.use(mainRouter);

/**
 * Add an error handler
 */
app.use((err, req, res, next) => {
  // TODO: Improve error object in response

  switch (err.name) {
    case 'ValidationError':
    case 'CastError':
    case 'TypeError':
      err.status = 400;
      break;

    case 'MongoError':
      if (err.code == 11000) { // DUPLICATE_KEY error
        err.status = 409;
      }
  }

  // Log error
  if (!err.status || err.status >= 500) {
    console.error('error ->', err);
  }

  // Make sure error message is serialized
  Object.defineProperty(err, 'message', {enumerable: true});

  res.status(err.status || 500);
  res.send(err || 'Server Error');
});

/**
 * Configure and connect to DB. If successful, start Express server
 */
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error ->', err);
  process.exit();
});
mongoose
    .connect(config.get('database'),
        {useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false})
    .then(() => { // Accepted
      app.listen(config.get('port'), (err) => {
        if (err) {
          console.error('Could not start server ->', err);
          process.exit(1);
        }
        console.log(`App is running on http://localhost:${config.get('port')}`
            + ` as ${config.get('name')}`);
      });
    }, // Rejected
    err => {
      console.error('MongoDB connection error ->', err);
      process.exit(1);
    });

module.exports = app; // Needed for Supertest testing
