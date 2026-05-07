import { Link, useNavigate } from 'react-router-dom'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
  { id: 'availability', label: 'Availability', icon: 'schedule', path: '/availability' },
  { id: 'bookings', label: 'Bookings', icon: 'event_available', path: '/bookings' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics', path: '/analytics' },
  { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
]

export default function SideNav({ active, userSlug, setSession }) {
  const navigate = useNavigate()

  const handleSignOut = () => {
    setSession(null)
    navigate('/')
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full bg-white border-r border-outline-variant/20 w-64 z-40 py-8">
        {/* Logo */}
        <div className="px-6 mb-10">
          <Link to="/" className="text-xl font-black text-primary tracking-tighter">Schedula Admin</Link>
          <p className="text-xs text-on-surface-variant mt-1 font-medium">Premium Plan</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map(item => (
            <Link
              key={item.id}
              to={item.path}
              id={`nav-${item.id}`}
              className={`side-nav-item ${active === item.id ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom: Create + Profile */}
        <div className="px-4 mt-auto space-y-4">
          {userSlug && (
            <a
              href={`/${userSlug}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-xl bg-secondary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-base">open_in_new</span>
              View Booking Page
            </a>
          )}
          <button
            id="signout-btn"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-outline-variant/20 flex items-center justify-between px-4 h-14">
        <Link to="/" className="text-lg font-black text-primary tracking-tighter">Schedula</Link>
        <div className="flex gap-2">
          {navItems.map(item => (
            <Link
              key={item.id}
              to={item.path}
              className={`p-2 rounded-xl ${active === item.id ? 'text-primary bg-surface-container' : 'text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
            </Link>
          ))}
        </div>
      </div>
      {/* Mobile top padding */}
      <div className="md:hidden h-14" />
    </>
  )
}
