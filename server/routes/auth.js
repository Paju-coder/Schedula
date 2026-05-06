const express = require('express')
const router = express.Router()
const supabaseAdmin = require('../lib/supabase')

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password, phone, slug } = req.body

  if (!name || !email || !password || !slug) {
    return res.status(400).json({ error: 'Name, email, password, and slug are required' })
  }

  try {
    // Check slug availability
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return res.status(400).json({ error: 'This booking link is already taken. Choose another.' })
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return res.status(400).json({ error: authError.message })
    }

    // Insert user profile
    const { error: profileError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      name,
      email,
      phone: phone || null,
      slug,
    })

    if (profileError) {
      // Cleanup: delete auth user if profile fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return res.status(400).json({ error: profileError.message })
    }

    // Sign in and return session
    const { data: sessionData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return res.status(200).json({ message: 'Account created. Please log in.' })
    }

    return res.status(201).json({
      message: 'Account created successfully',
      session: sessionData.session,
      user: { id: authData.user.id, name, email, slug },
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
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })

    if (error) {
      return res.status(401).json({ error: error.message })
    }

    return res.json({ session: data.session, user: data.user })
  } catch (err) {
    return res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
