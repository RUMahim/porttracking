const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

// GET /api/users - admin lists importer/exporter accounts (for shipment owner selection)
// GET /api/users?all=1 - admin lists every account (Users page)
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const filter = req.query.all ? {} : { role: { $in: ['importer', 'exporter'] } }
    const users = await User.find(filter)
      .select('name email role createdAt')
      .sort({ name: 1 })
    res.json(users)
  } catch (e) {
    next(e)
  }
})

// PUT /api/users/:id/password - admin resets a user's password
router.put('/:id/password', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user ID' })
    const { password } = req.body
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = await User.findByIdAndUpdate(req.params.id, { password: hashed }, { new: true }).select('name email role')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ message: `Password updated for ${user.email}`, user })
  } catch (e) {
    next(e)
  }
})

// DELETE /api/users/:id - admin removes an importer/exporter account
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user ID' })
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' })
    }
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'admin') return res.status(400).json({ message: 'Admin accounts cannot be deleted here' })
    await user.deleteOne()
    res.json({ message: 'User deleted successfully' })
  } catch (e) {
    next(e)
  }
})

module.exports = router
