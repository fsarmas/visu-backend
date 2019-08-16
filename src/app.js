const express = require('express');
const mongoose = require('mongoose');
const config = require('config');
const errorHandler = require('errorhandler');

const mainRouter = require('./routes/index');

const app = express();
app.use(express.json());
app.use(mainRouter);

/**
 * Add an error handler
 */
if (config.get('name') === 'development') {
  app.use(errorHandler());
} else {
  app.use((err, req, res, next) => {
    if (err.status >= 500) {
      console.error(err);
    }
    // TODO: Write error to log file
    res.status(err.status || 500);
    res.send(err.message || 'Server Error');
  });
}

/**
 * Configure and connect to DB. If successful, start Express server
 */
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error ->', err);
  process.exit();
});
mongoose
    .connect(config.get('database'),
        {useNewUrlParser: true, useCreateIndex: true})
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
