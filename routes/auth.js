const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { protect } = require('../middleware/auth')

const router = express.Router()

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  })

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
})

// POST /api/auth/register - new importer/exporter account
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }
    if (role && !['importer', 'exporter'].includes(role)) {
      return res.status(400).json({ message: 'Role must be importer or exporter' })
    }
    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) {
      return res.status(400).json({ message: 'User already exists with this email' })
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: role || 'importer',
    })
    res.status(201).json({ ...publicUser(user), token: signToken(user._id) })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    res.json({ ...publicUser(user), token: signToken(user._id) })
  } catch (error) {
    next(error)
  }
})

// GET /api/auth/me - current logged-in user
router.get('/me', protect, (req, res) => {
  res.json(publicUser(req.user))
})

module.exports = router
