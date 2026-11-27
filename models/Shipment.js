const mongoose = require('mongoose')

const shipmentSchema = new mongoose.Schema({
  trackingId: { type: String, required: true, unique: true, trim: true, uppercase: true },
  type: { type: String, enum: ['import', 'export'], required: true, lowercase: true },
  containerId: { type: String, required: true, trim: true, uppercase: true },
  goodsType: { type: String, required: true, trim: true },
  origin: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },
  ship: { type: mongoose.Schema.Types.ObjectId, ref: 'Ship', default: null },
  // Registered trader account that owns this shipment (null until claimed)
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // Manual owner info for traders without an account (entered by port officials).
  // When the trader later registers with the same email, shipments are auto-claimed.
  ownerName: { type: String, trim: true, default: '' },
  ownerEmail: { type: String, trim: true, lowercase: true, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Shipment', shipmentSchema)
