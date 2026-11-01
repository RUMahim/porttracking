const express = require('express')
const mongoose = require('mongoose')
const crypto = require('crypto')
const Shipment = require('../models/Shipment')
const Container = require('../models/Container')
const router = express.Router()

router.get('/', async (req, res, next) => {
  try { res.json(await Shipment.find().populate('ship', 'name imo company').sort({ createdAt: -1 })) } catch (e) { next(e) }
})
router.get('/track/:trackingId', async (req, res, next) => {
  try {
    const trackingId = req.params.trackingId.trim().toUpperCase()
    const shipment = await Shipment.findOne({ trackingId }).populate('ship', 'name imo company arrivalDate departureDate status')
    if (!shipment) return res.status(404).json({ message: 'No shipment found for this tracking ID' })
    const container = await Container.findOne({ shipment: shipment._id })
    res.json({ shipment, container })
  } catch (e) { next(e) }
})
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid shipment ID' })
    const shipment = await Shipment.findById(req.params.id).populate('ship', 'name imo company')
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' })
    res.json(shipment)
  } catch (e) { next(e) }
})
router.post('/', async (req, res, next) => {
  try {
    const body = { ...req.body }
    if (!body.trackingId) body.trackingId = `PT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    if (body.ship === '') body.ship = null
    if (body.owner === '') body.owner = null
    const shipment = await Shipment.create(body)
    res.status(201).json(shipment)
  } catch (e) { next(e) }
})
router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid shipment ID' })
    const body = { ...req.body }
    if (body.ship === '') body.ship = null
    const shipment = await Shipment.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true }).populate('ship', 'name imo company')
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' })
    res.json(shipment)
  } catch (e) { next(e) }
})
router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid shipment ID' })
    const linkedContainer = await Container.exists({ shipment: req.params.id })
    if (linkedContainer) return res.status(409).json({ message: 'Delete the linked container first.' })
    const shipment = await Shipment.findByIdAndDelete(req.params.id)
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' })
    res.json({ message: 'Shipment deleted successfully' })
  } catch (e) { next(e) }
})
module.exports = router
