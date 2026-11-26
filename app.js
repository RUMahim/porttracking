const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const shipRoutes = require('./routes/ships')
const shipmentRoutes = require('./routes/shipments')
const containerRoutes = require('./routes/containers')
const authRoutes = require('./routes/auth')
const trackRoutes = require('./routes/track')
const notificationRoutes = require('./routes/notifications')
const dashboardRoutes = require('./routes/dashboard')
const userRoutes = require('./routes/users')

const app = express()

// Cached MongoDB connection (reused across serverless invocations)
let connPromise = null
async function connectDB() {
  if (mongoose.connection.readyState === 1) return
  if (!connPromise) {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing')
    connPromise = mongoose.connect(process.env.MONGODB_URI).catch((err) => {
      connPromise = null
      throw err
    })
  }
  await connPromise
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())

// Make sure the database is connected before handling API requests
app.use('/api', async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (err) {
    next(err)
  }
})

app.get('/', (req, res) => {
  res.send('PortTrack Backend is Running!')
})

app.get('/api/test', (req, res) => {
  res.json({ message: 'PortTrack API is working!' })
})

app.get('/api/info', (req, res) => {
  res.json({
    project: 'PortTrack',
    version: '1.0.0',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/ships', shipRoutes)
app.use('/api/shipments', shipmentRoutes)
app.use('/api/containers', containerRoutes)
app.use('/api/track', trackRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/users', userRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'API route not found' })
})

app.use((err, req, res, next) => {
  console.error(err)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'This ID already exists. Please use a unique value.' })
  }
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ message: err.message })
  }
  res.status(500).json({ message: 'Internal server error' })
})

module.exports = app
module.exports.connectDB = connectDB
