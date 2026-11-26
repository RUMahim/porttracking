const express = require('express')
const Ship = require('../models/Ships')
const Shipment = require('../models/Shipment')
const Container = require('../models/Container')
const { protect } = require('../middleware/auth')

const router = express.Router()

// GET /api/dashboard - summary counts (role-filtered for importer/exporter)
router.get('/', protect, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin'
    const shipmentFilter = isAdmin ? {} : { owner: req.user._id }

    const [totalShips, totalShipments, importCount, exportCount, recentShipments, arrivingSoon] =
      await Promise.all([
        Ship.countDocuments(),
        Shipment.countDocuments(shipmentFilter),
        Shipment.countDocuments({ ...shipmentFilter, type: 'import' }),
        Shipment.countDocuments({ ...shipmentFilter, type: 'export' }),
        Shipment.find(shipmentFilter)
          .populate('ship', 'name dockNumber status')
          .populate('owner', 'name role')
          .sort({ createdAt: -1 })
          .limit(5),
        Ship.find({ status: { $in: ['Expected', 'Arrived'] } })
          .sort({ arrivalDate: 1 })
          .limit(5),
      ])

    let containerFilter = {}
    if (!isAdmin) {
      const mine = await Shipment.find(shipmentFilter).select('_id')
      containerFilter = { shipment: { $in: mine.map((s) => s._id) } }
    }
    const totalContainers = await Container.countDocuments(containerFilter)
    const statusBreakdown = await Promise.all(
      Container.STATUS_STEPS.map(async (status) => ({
        status,
        count: await Container.countDocuments({ ...containerFilter, currentStatus: status }),
      }))
    )
    const delivered = statusBreakdown.find((s) => s.status === 'Delivered')?.count || 0

    res.json({
      totalShips,
      totalShipments,
      totalContainers,
      delivered,
      importCount,
      exportCount,
      statusBreakdown,
      recentShipments,
      arrivingSoon,
    })
  } catch (e) {
    next(e)
  }
})

module.exports = router
