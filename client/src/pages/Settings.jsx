import { useState, useEffect } from 'react'
import SideNav from '../components/SideNav'
import { authAPI } from '../lib/api'

export default function Settings({ session, setSession }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const userSlug = session?.user?.slug || ''

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await authAPI.me()
        setName(data.user.name || '')
        setEmail(data.user.email || '')
      } catch (err) {
        console.error('Failed to load profile:', err)
        setError('Failed to load profile details.')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      const { data } = await authAPI.updateProfile({ name, email })
      setSuccess('Profile updated successfully!')
      
      // Update local session
      if (session) {
        setSession({
          ...session,
          user: data.user
        })
      }
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Failed to update:', err)
      setError(err.response?.data?.error || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  let origin = window.location.origin
  if (origin.includes('localhost')) {
    origin = origin.replace('localhost', '10.85.163.205')
  }
  const bookingLink = `${origin}/${userSlug}`

  const copyLink = () => {
    navigator.clipboard.writeText(bookingLink)
  }

  return (
    <div className="min-h-screen bg-surface flex font-sans">
      <SideNav active="settings" userSlug={userSlug} setSession={setSession} />

      <main className="flex-1 ml-0 md:ml-64 p-6 md:p-10 pb-32">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="mb-10 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black text-primary tracking-tight">Settings</h1>
              <p className="text-on-surface-variant mt-2">Manage your account profile and preferences.</p>
            </div>
          </header>

          {error && (
            <div className="bg-error-container text-error rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 text-green-700 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 mb-6 border border-green-200">
              <span className="material-symbols-outlined text-base">check_circle</span>
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Profile Card */}
              <div className="card p-8 rounded-2xl border border-outline-variant/10">
                <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">person</span>
                  Profile Details
                </h3>
                
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-on-surface">Full Name</label>
                      <input
                        type="text"
                        required
                        className="input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-on-surface">Email Address</label>
                      <input
                        type="email"
                        required
                        className="input"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/20">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary py-3 px-8 text-sm flex items-center gap-2 ml-auto"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-base">save</span>
                      )}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Public Link Card */}
              <div className="card p-8 rounded-2xl border border-outline-variant/10">
                <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">link</span>
                  Public Booking Link
                </h3>
                
                <p className="text-sm text-on-surface-variant mb-4">
                  This is the link you share with guests so they can book meetings with you. It cannot be changed once set.
                </p>
                
                <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <div className="flex-1 truncate font-mono text-sm text-primary">
                    {bookingLink}
                  </div>
                  <button onClick={copyLink} className="btn-outline py-1.5 px-4 text-xs">
                    Copy
                  </button>
                </div>
              </div>
              
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
