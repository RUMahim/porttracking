const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Verify JWT and attach the logged-in user to req.user
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || ''
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' })
    }
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId = decoded.id || decoded.userId
    const user = await User.findById(userId).select('-password')
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' })
    }
    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' })
  }
}

// Allow only the listed roles, e.g. authorize('admin')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: your role cannot do this' })
  }
  next()
}

module.exports = { protect, authorize }
