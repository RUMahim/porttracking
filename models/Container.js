const mongoose = require('mongoose')

const STATUS_STEPS = ['Booked', 'Loaded', 'In Transit', 'Arrived at Port', 'Customs Clearance', 'Delivered']

const containerSchema = new mongoose.Schema({
  containerId: { type: String, required: true, unique: true, trim: true, uppercase: true },
  shipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  weight: { type: Number, required: true, min: 0.01 },
  goodsType: { type: String, required: true, trim: true },
  currentStatus: { type: String, enum: STATUS_STEPS, default: 'Booked' },
  statusHistory: [{
    status: { type: String, enum: STATUS_STEPS, required: true },
    date: { type: Date, default: Date.now },
  }],
}, { timestamps: true })

containerSchema.pre('validate', function () {
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({ status: this.currentStatus || 'Booked', date: new Date() })
  }
})

containerSchema.statics.STATUS_STEPS = STATUS_STEPS
module.exports = mongoose.model('Container', containerSchema)
