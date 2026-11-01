const express = require('express')
const mongoose = require('mongoose')
const Ship = require('../models/Ships')
const Shipment = require('../models/Shipment')
const router = express.Router()

router.get('/', async (req, res, next) => {
  try { res.json(await Ship.find().sort({ createdAt: -1 })) } catch (e) { next(e) }
})
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ship ID' })
    const ship = await Ship.findById(req.params.id)
    if (!ship) return res.status(404).json({ message: 'Ship not found' })
    res.json(ship)
  } catch (e) { next(e) }
})
router.post('/', async (req, res, next) => {
  try { res.status(201).json(await Ship.create(req.body)) } catch (e) { next(e) }
})
router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ship ID' })
    const ship = await Ship.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!ship) return res.status(404).json({ message: 'Ship not found' })
    res.json(ship)
  } catch (e) { next(e) }
})
router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid ship ID' })
    const linked = await Shipment.exists({ ship: req.params.id })
    if (linked) return res.status(409).json({ message: 'This ship is linked to a shipment. Remove or reassign the shipment first.' })
    const ship = await Ship.findByIdAndDelete(req.params.id)
    if (!ship) return res.status(404).json({ message: 'Ship not found' })
    res.json({ message: 'Ship deleted successfully' })
  } catch (e) { next(e) }
})
module.exports = router
