const { createClient } = require('@supabase/supabase-js')

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY

// Deep proxy that supports unlimited Supabase chaining — used when env vars are missing
function makeMockSupabase() {
  const mockResponse = Promise.resolve({
    data: null,
    error: { message: 'Supabase not configured yet. Add real keys to server/.env' },
  })

  // Supports: supabase.from('x').select('*').eq('a','b').single()
  function chainProxy() {
    return new Proxy(mockResponse, {
      get(target, prop) {
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return target[prop].bind(target)
        }
        return () => chainProxy()
      },
    })
  }

  return new Proxy({}, {
    get(_, prop) {
      // auth.admin.createUser etc
      if (prop === 'auth') {
        return new Proxy({}, {
          get(_, authProp) {
            if (authProp === 'admin') {
              return new Proxy({}, {
                get: () => () => chainProxy(),
              })
            }
            return () => chainProxy()
          },
        })
      }
      return () => chainProxy()
    },
  })
}

let supabase

if (!url || url.includes('your-project-id') || !key || key.includes('REPLACE_WITH')) {
  console.warn('\n⚠️  Supabase not configured — running in mock mode.')
  console.warn('   Fill in server/.env with real keys when ready.\n')
  supabase = makeMockSupabase()
} else {
  supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

module.exports = supabase
