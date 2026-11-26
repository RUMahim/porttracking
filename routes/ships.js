const express = require('express')
const mongoose = require('mongoose')
const Ship = require('../models/Ships')
const Shipment = require('../models/Shipment')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

// GET /api/ships - all ships (any logged-in user)
router.get('/', protect, async (req, res, next) => {
  try {
    const ships = await Ship.find().sort({ arrivalDate: 1 })
    res.json(ships)
  } catch (e) {
    next(e)
  }
})

// GET /api/ships/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ship ID' })
    const ship = await Ship.findById(req.params.id)
    if (!ship) return res.status(404).json({ message: 'Ship not found' })
    res.json(ship)
  } catch (e) {
    next(e)
  }
})

// POST /api/ships - admin only
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const ship = await Ship.create(req.body)
    res.status(201).json(ship)
  } catch (e) {
    next(e)
  }
})

// PUT /api/ships/:id - admin only
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ship ID' })
    const ship = await Ship.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!ship) return res.status(404).json({ message: 'Ship not found' })
    res.json(ship)
  } catch (e) {
    next(e)
  }
})

// DELETE /api/ships/:id - admin only, blocked while a shipment uses this ship
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ship ID' })
    const linked = await Shipment.exists({ ship: req.params.id })
    if (linked) return res.status(409).json({ message: 'This ship is linked to a shipment. Remove or reassign the shipment first.' })
    const ship = await Ship.findByIdAndDelete(req.params.id)
    if (!ship) return res.status(404).json({ message: 'Ship not found' })
    res.json({ message: 'Ship deleted successfully' })
  } catch (e) {
    next(e)
  }
})

module.exports = router
