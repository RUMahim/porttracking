const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const shipRoutes = require('./routes/ships')
const shipmentRoutes = require('./routes/shipments')
const containerRoutes = require('./routes/containers')
const authRoutes = require('./routes/auth')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

app.get('/', (req, res) => {
  res.send('PortTrack Backend is Running!')
})

app.get('/api/test', (req, res) => {
  res.json({ message: 'PortTrack API is working!' })
})

app.use('/api/ships', shipRoutes)
app.use('/api/shipments', shipmentRoutes)
app.use('/api/containers', containerRoutes)
app.use('/api/auth', authRoutes)

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

async function startServer() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing. Add it to backend/.env')
    process.exit(1)
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB Atlas Connected!')
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

startServer()
