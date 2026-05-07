import { useState, useEffect } from 'react'
import SideNav from '../components/SideNav'
import { authAPI } from '../lib/api'

const ACCENT_COLORS = [
  { id: 'blue', hex: '#0069ff', label: 'Blue' },
  { id: 'purple', hex: '#8b5cf6', label: 'Purple' },
  { id: 'teal', hex: '#0d9488', label: 'Teal' },
  { id: 'rose', hex: '#e11d48', label: 'Rose' },
  { id: 'amber', hex: '#d97706', label: 'Amber' },
  { id: 'emerald', hex: '#059669', label: 'Emerald' },
  { id: 'indigo', hex: '#4f46e5', label: 'Indigo' },
  { id: 'slate', hex: '#334155', label: 'Slate' },
]

export default function Settings({ session, setSession }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Branding state
  const [accentColor, setAccentColor] = useState('#0069ff')
  const [welcomeMsg, setWelcomeMsg] = useState('')
  const [bio, setBio] = useState('')
  const [brandingSaved, setBrandingSaved] = useState(false)

  const userSlug = session?.user?.slug || ''
  const userId = session?.user?.id || session?.user?._id

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

    // Load branding
    const branding = JSON.parse(localStorage.getItem(`schedula_branding_${userId}`) || '{}')
    if (branding.accentColor) setAccentColor(branding.accentColor)
    if (branding.welcomeMsg) setWelcomeMsg(branding.welcomeMsg)
    if (branding.bio) setBio(branding.bio)
  }, [userId])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      const { data } = await authAPI.updateProfile({ name, email })
      setSuccess('Profile updated successfully!')
      
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

  const handleSaveBranding = () => {
    const branding = { accentColor, welcomeMsg, bio }
    localStorage.setItem(`schedula_branding_${userId}`, JSON.stringify(branding))
    
    // Also update user bio in users collection
    const users = JSON.parse(localStorage.getItem('schedula_users') || '[]')
    const idx = users.findIndex(u => u.id === userId)
    if (idx !== -1) {
      users[idx].bio = bio
      localStorage.setItem('schedula_users', JSON.stringify(users))
    }

    setBrandingSaved(true)
    setTimeout(() => setBrandingSaved(false), 3000)
  }

  let origin = window.location.origin
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
              <p className="text-on-surface-variant mt-2">Manage your account, branding & preferences.</p>
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

              {/* Booking Page Branding */}
              <div className="card p-8 rounded-2xl border border-outline-variant/10">
                <h3 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">palette</span>
                  Booking Page Branding
                </h3>
                <p className="text-sm text-on-surface-variant mb-6">Customize how your booking page looks to guests.</p>

                <div className="space-y-6">
                  {/* Accent Color */}
                  <div>
                    <label className="text-sm font-bold text-on-surface mb-3 block">Accent Color</label>
                    <div className="flex flex-wrap gap-3">
                      {ACCENT_COLORS.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setAccentColor(c.hex)}
                          className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${
                            accentColor === c.hex ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                          }`}
                          style={{ background: c.hex }}
                          title={c.label}
                        >
                          {accentColor === c.hex && (
                            <span className="material-symbols-outlined text-white text-sm">check</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Welcome Message */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface">Welcome Message</label>
                    <input
                      type="text"
                      className="input"
                      value={welcomeMsg}
                      onChange={e => setWelcomeMsg(e.target.value)}
                      placeholder="Let's find a time that works for you! 🚀"
                    />
                    <p className="text-xs text-on-surface-variant">Shown below your name on the booking page.</p>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface">Bio / Description</label>
                    <textarea
                      className="input min-h-[80px] resize-none"
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Tell your guests a bit about yourself or your business..."
                      rows={3}
                    />
                  </div>

                  {/* Preview */}
                  <div className="border border-outline-variant/20 rounded-xl p-5 bg-surface-container-low">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Preview</p>
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-black shrink-0"
                        style={{ background: accentColor }}
                      >
                        {name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{name || 'Your Name'}</p>
                        <p className="text-sm text-on-surface-variant">{welcomeMsg || 'Welcome message...'}</p>
                        {bio && <p className="text-xs text-on-surface-variant mt-1">{bio}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/20 flex items-center gap-4">
                    <button
                      onClick={handleSaveBranding}
                      className="btn-primary py-3 px-8 text-sm flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">palette</span>
                      Save Branding
                    </button>
                    {brandingSaved && (
                      <span className="text-green-600 text-sm font-medium flex items-center gap-1 animate-fade-in">
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Branding saved!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Public Link + QR Code Card */}
              <div className="card p-8 rounded-2xl border border-outline-variant/10">
                <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">link</span>
                  Public Booking Link
                </h3>
                
                <p className="text-sm text-on-surface-variant mb-4">
                  Share this link or QR code with guests so they can book meetings with you.
                </p>
                
                <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 mb-6">
                  <div className="flex-1 truncate font-mono text-sm text-primary">
                    {bookingLink}
                  </div>
                  <button onClick={copyLink} className="btn-outline py-1.5 px-4 text-xs">
                    Copy
                  </button>
                </div>

                {/* QR Code */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-outline-variant/10">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bookingLink)}&bgcolor=ffffff&color=0069ff&margin=8`}
                      alt="Booking QR Code"
                      className="w-[160px] h-[160px]"
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-bold text-on-surface mb-2">📱 QR Code</h4>
                    <p className="text-sm text-on-surface-variant mb-4">
                      Show this at events, on business cards, or during presentations. Guests scan & book instantly.
                    </p>
                    <a
                      href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(bookingLink)}&bgcolor=ffffff&color=0069ff&margin=16&format=png`}
                      download={`schedula-qr-${userSlug}.png`}
                      className="btn-primary py-2 px-6 text-sm inline-flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                      Download QR
                    </a>
                  </div>
                </div>
              </div>

              {/* Embeddable Widget */}
              <div className="card p-8 rounded-2xl border border-outline-variant/10">
                <h3 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">code</span>
                  Embeddable Widget
                </h3>
                <p className="text-sm text-on-surface-variant mb-6">
                  Add Schedula to any website. Copy this snippet into your HTML.
                </p>

                {/* Widget Preview */}
                <div className="mb-6">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Preview</p>
                  <div className="border border-outline-variant/20 rounded-xl overflow-hidden bg-surface-container-low">
                    <div className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: accentColor }}>
                        {name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">{name || 'Your Name'}</p>
                        <p className="text-xs text-on-surface-variant">Book a meeting with me</p>
                      </div>
                      <a
                        href={bookingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto py-2 px-4 rounded-lg text-white text-xs font-bold no-underline"
                        style={{ background: accentColor }}
                      >
                        Book Now
                      </a>
                    </div>
                  </div>
                </div>

                {/* Inline Button Snippet */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-on-surface mb-2">📌 Option 1: Inline Button</p>
                    <div className="bg-gray-900 text-gray-100 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                      <code>{`<a href="${bookingLink}" target="_blank" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:${accentColor};color:#fff;border-radius:8px;font-family:sans-serif;font-weight:700;font-size:14px;text-decoration:none;">📅 Book a Meeting</a>`}</code>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`<a href="${bookingLink}" target="_blank" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:${accentColor};color:#fff;border-radius:8px;font-family:sans-serif;font-weight:700;font-size:14px;text-decoration:none;">📅 Book a Meeting</a>`)
                      }}
                      className="mt-2 text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span> Copy snippet
                    </button>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-on-surface mb-2">🖼 Option 2: Popup iframe</p>
                    <div className="bg-gray-900 text-gray-100 rounded-xl p-4 font-mono text-xs overflow-x-auto">
                      <code>{`<iframe src="${bookingLink}" width="100%" height="700" style="border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.1);" title="Book a meeting with ${name}"></iframe>`}</code>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`<iframe src="${bookingLink}" width="100%" height="700" style="border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.1);" title="Book a meeting with ${name}"></iframe>`)
                      }}
                      className="mt-2 text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span> Copy snippet
                    </button>
                  </div>
                </div>
              </div>
              
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
