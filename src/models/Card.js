const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({

  kind: {type: String, required: true},
  name: {type: String, required: true},
  image: Array, // TODO: Mak array of Image
  data: Object,

}, {timestamps: true});

module.exports = mongoose.model('Card', cardSchema);
