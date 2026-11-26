// Demo data seeding logic shared by seed.js (CLI) and the temporary /api/seed-demo endpoint.
// Assumes mongoose is already connected. Idempotent: skips if demo users exist.
const bcrypt = require('bcryptjs')

const User = require('./models/User')
const Ship = require('./models/Ships')
const Shipment = require('./models/Shipment')
const Container = require('./models/Container')
const Notification = require('./models/Notification')

async function seedDemoData() {
  const existing = await User.findOne({ email: 'admin@porttrack.demo' })
  if (existing) return { skipped: true }

  const password = await bcrypt.hash('demo123', 10)
  const [admin, importer1, exporter1, importer2] = await User.create([
    { name: 'Port Officer (Admin)', email: 'admin@porttrack.demo', password, role: 'admin' },
    { name: 'Rahim Traders', email: 'importer@porttrack.demo', password, role: 'importer' },
    { name: 'Karim Exports', email: 'exporter@porttrack.demo', password, role: 'exporter' },
    { name: 'Fatima Imports', email: 'fatima@porttrack.demo', password, role: 'importer' },
  ])

  const ships = await Ship.create([
    { name: 'MV Ocean Star', imo: 'IMO 9812345', company: 'Maersk Line', arrivalDate: '2026-11-26', departureDate: '2026-11-28', dockNumber: 'Dock 04 — NCT', status: 'Arrived' },
    { name: 'MV Bengal Pearl', imo: 'IMO 9765432', company: 'MSC Mediterranean', arrivalDate: '2026-11-27', departureDate: '2026-11-30', dockNumber: 'Dock 07 — GCB', status: 'Expected' },
    { name: 'MV Padma Express', imo: 'IMO 9654321', company: 'CMA CGM', arrivalDate: '2026-11-24', departureDate: '2026-11-26', dockNumber: 'Dock 02 — CCT', status: 'Arrived' },
    { name: 'MV Jamuna Queen', imo: 'IMO 9543210', company: 'Evergreen Marine', arrivalDate: '2026-11-20', departureDate: '2026-11-22', dockNumber: 'Dock 01 — Mongla', status: 'Departed' },
    { name: 'MV Surma Trader', imo: 'IMO 9432109', company: 'COSCO Shipping', arrivalDate: '2026-11-29', departureDate: '2026-12-02', dockNumber: 'Dock 05 — NCT', status: 'Expected' },
  ])

  const shipmentData = [
    { trackingId: 'PT-2026-1042', type: 'import', containerId: 'MSKU-482910-3', goodsType: 'Electronics', origin: 'Shenzhen, China', destination: 'Chattogram Port', ship: ships[0]._id, owner: importer1._id, weight: 18400, status: 'Customs Clearance' },
    { trackingId: 'PT-2026-1043', type: 'export', containerId: 'TCLU-729384-1', goodsType: 'Garments', origin: 'Chattogram Port', destination: 'Hamburg, Germany', ship: ships[0]._id, owner: exporter1._id, weight: 12500, status: 'In Transit' },
    { trackingId: 'PT-2026-1044', type: 'import', containerId: 'CSNU-583920-7', goodsType: 'Machinery', origin: 'Busan, South Korea', destination: 'Chattogram Port', ship: ships[2]._id, owner: importer1._id, weight: 24000, status: 'Arrived at Port' },
    { trackingId: 'PT-2026-1045', type: 'export', containerId: 'EGLV-394857-2', goodsType: 'Jute Goods', origin: 'Mongla Port', destination: 'Rotterdam, Netherlands', ship: ships[3]._id, owner: exporter1._id, weight: 9800, status: 'Delivered' },
    { trackingId: 'PT-2026-1046', type: 'import', containerId: 'OOLU-618273-9', goodsType: 'Rice & Grains', origin: 'Bangkok, Thailand', destination: 'Chattogram Port', ship: ships[0]._id, owner: importer2._id, weight: 26000, status: 'Loaded' },
    { trackingId: 'PT-2026-1047', type: 'export', containerId: 'MSKU-905172-4', goodsType: 'Frozen Seafood', origin: 'Chattogram Port', destination: 'Tokyo, Japan', ship: ships[1]._id, owner: exporter1._id, weight: 15200, status: 'In Transit' },
    { trackingId: 'PT-2026-1048', type: 'import', containerId: 'CMAU-271849-6', goodsType: 'Textile Raw Materials', origin: 'Nhava Sheva, India', destination: 'Chattogram Port', ship: ships[2]._id, owner: importer2._id, weight: 16750, status: 'Booked' },
    { trackingId: 'PT-2026-1049', type: 'export', containerId: 'TCNU-847362-0', goodsType: 'Leather Goods', origin: 'Chattogram Port', destination: 'Felixstowe, UK', ship: ships[0]._id, owner: exporter1._id, weight: 8900, status: 'Loaded' },
  ]

  const STEPS = Container.STATUS_STEPS
  for (const data of shipmentData) {
    const { weight, status, ...shipmentFields } = data
    const shipment = await Shipment.create(shipmentFields)
    const upto = STEPS.indexOf(status)
    const statusHistory = STEPS.slice(0, upto + 1).map((s, i) => ({
      status: s,
      date: new Date(Date.now() - (upto - i) * 24 * 60 * 60 * 1000),
    }))
    await Container.create({
      containerId: data.containerId,
      shipment: shipment._id,
      weight,
      goodsType: data.goodsType,
      currentStatus: status,
      statusHistory,
    })
  }

  await Notification.create([
    { user: importer1._id, title: 'Container status updated', message: 'Container MSKU-482910-3 (PT-2026-1042) is now: Customs Clearance', trackingId: 'PT-2026-1042', containerId: 'MSKU-482910-3' },
    { user: exporter1._id, title: 'Container status updated', message: 'Container EGLV-394857-2 (PT-2026-1045) is now: Delivered', trackingId: 'PT-2026-1045', containerId: 'EGLV-394857-2' },
  ])

  return { skipped: false, users: 4, ships: 5, shipments: 8, containers: 8, notifications: 2 }
}

module.exports = { seedDemoData }
