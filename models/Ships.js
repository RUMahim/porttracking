const mongoose = require('mongoose')

const shipSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  imo: { type: String, required: true, unique: true, trim: true },
  company: { type: String, required: true, trim: true },
  arrivalDate: { type: Date, required: true },
  departureDate: { type: Date, required: true },
  dockNumber: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Expected', 'Arrived', 'Departed'], default: 'Expected' },
}, { timestamps: true })

shipSchema.pre('validate', function () {
  if (this.arrivalDate && this.departureDate && this.departureDate < this.arrivalDate) {
    this.invalidate('departureDate', 'Departure date cannot be before arrival date')
  }
})

module.exports = mongoose.model('Ship', shipSchema)
