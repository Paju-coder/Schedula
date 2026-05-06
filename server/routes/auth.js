const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const authMiddleware = require('../middleware/auth')

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  })
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password, phone, slug } = req.body

  if (!name || !email || !password || !slug) {
    return res.status(400).json({ error: 'Name, email, password, and slug are required' })
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { slug }] })
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'User with this email already exists' })
      }
      return res.status(400).json({ error: 'This booking link is already taken. Choose another.' })
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      slug,
    })

    const token = generateToken(user._id)

    return res.status(201).json({
      message: 'Account created successfully',
      session: { access_token: token },
      user: { id: user._id, name: user.name, email: user.email, slug: user.slug },
    })
  } catch (err) {
    console.error('Signup error:', err)
    return res.status(500).json({ error: 'Server error during signup' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  try {
    const user = await User.findOne({ email })

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id)

      return res.json({
        session: { access_token: token },
        user: { id: user._id, name: user.name, email: user.email, slug: user.slug }
      })
    } else {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, slug: req.user.slug } })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
