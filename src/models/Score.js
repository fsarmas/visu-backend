const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({

  card: {type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true},
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  points: {type: Number, required: true},
  lastTest: {type: Date, required: true},

}, {timestamps: false});

module.exports = mongoose.model('Score', cardSchema);
