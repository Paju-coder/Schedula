const jwt = require('jsonwebtoken')
const User = require('../models/User')

const authMiddleware = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret')
    const user = await User.findById(decoded.id).select('-password')
    
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' })
    }

    req.user = user
    next()
  } catch (err) {
    console.error('Auth middleware error:', err)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

module.exports = authMiddleware
