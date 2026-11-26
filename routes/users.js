const express = require('express')
const User = require('../models/User')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

// GET /api/users - admin lists importer/exporter accounts (for shipment owner selection)
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const users = await User.find({ role: { $in: ['importer', 'exporter'] } })
      .select('name email role')
      .sort({ name: 1 })
    res.json(users)
  } catch (e) {
    next(e)
  }
})

module.exports = router
