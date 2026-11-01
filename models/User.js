const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  // Store a bcrypt hash here when authentication is implemented; never store plain-text passwords.
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'importer', 'exporter'], default: 'importer' },
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
