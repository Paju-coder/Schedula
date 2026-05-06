const { createClient } = require('@supabase/supabase-js')

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY

const supabaseClient =
  url && key && !url.includes('your-project-id') && !key.includes('REPLACE_WITH')
    ? createClient(url, key)
    : null

// Verify JWT from Supabase Auth
const authMiddleware = async (req, res, next) => {
  if (!supabaseClient) {
    // Allow through in mock mode — attach a fake user
    req.user = { id: 'mock-user-id', email: 'demo@schedula.app' }
    return next()
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseClient.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  req.user = user
  next()
}

module.exports = authMiddleware
