const dns = require('dns')
dns.setServers(['8.8.8.8', '1.1.1.1'])
require('dotenv').config()
const app = require('./app')

const PORT = process.env.PORT || 5000

async function startServer() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing. Add it to .env (see .env.example)')
    process.exit(1)
  }
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing. Add it to .env (see .env.example)')
    process.exit(1)
  }
  try {
    await app.connectDB()
    console.log('MongoDB Atlas Connected!')
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

startServer()
