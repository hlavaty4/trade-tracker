const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});

module.exports = mongoose.model('Result', resultSchema);
