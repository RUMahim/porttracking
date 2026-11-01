const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    user = new User({ 
        name, 
        email, 
        password: hashedPassword, 
        role: role || 'importer' 
    });
    await user.save();
    
    // Generate token
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
    
  } catch (error) {
    // এই লাইনটি টার্মিনালে আসল এররটি দেখাবে
    console.error("REGISTER ERROR DETAILS:", error);
    
    if (error.name === 'ValidationError') {
       return res.status(400).json({ message: Object.values(error.errors).map(val => val.message).join(', ') });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error("LOGIN ERROR DETAILS:", error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

module.exports = router;