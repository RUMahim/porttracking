const mongoose = require('mongoose')

const shipmentSchema = new mongoose.Schema({
  trackingId: { type: String, required: true, unique: true, trim: true, uppercase: true },
  type: { type: String, enum: ['import', 'export'], required: true, lowercase: true },
  containerId: { type: String, required: true, trim: true, uppercase: true },
  goodsType: { type: String, required: true, trim: true },
  origin: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },
  ship: { type: mongoose.Schema.Types.ObjectId, ref: 'Ship', default: null },
  // Optional until real login/user authentication is implemented.
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true })

module.exports = mongoose.model('Shipment', shipmentSchema)
