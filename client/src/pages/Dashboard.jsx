import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SideNav from '../components/SideNav'
import ChatBot from '../components/ChatBot'

const DEFAULT_EVENT = {
  id: 'default',
  name: '30 Minute Meeting',
  duration: 30,
  location: 'Google Meet',
  type: 'One-on-One',
  schedule: 'Weekdays, 9 am - 5 pm',
  color: '#8b5cf6',
}

export default function Dashboard({ session, setSession }) {
  const [copied, setCopied] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [eventTypes, setEventTypes] = useState([])
  const [initialized, setInitialized] = useState(false)
  const userName = session?.user?.name || 'Guest User'
  const userSlug = session?.user?.slug || ''

  // Load event types from localStorage
  useEffect(() => {
    const loadEvents = () => {
      const raw = localStorage.getItem('schedula_event_types')
      if (raw === null && !initialized) {
        // First time ever — show default event and save it
        setEventTypes([DEFAULT_EVENT])
        localStorage.setItem('schedula_event_types', JSON.stringify([DEFAULT_EVENT]))
      } else {
        setEventTypes(JSON.parse(raw || '[]'))
      }
      setInitialized(true)
    }
    loadEvents()

    // Listen for storage changes (from chatbot saving)
    const handler = () => loadEvents()
    window.addEventListener('storage', handler)
    // Also poll every 2s to catch same-tab changes
    const interval = setInterval(loadEvents, 2000)
    return () => {
      window.removeEventListener('storage', handler)
      clearInterval(interval)
    }
  }, [initialized])

  const copyLink = () => {
    let origin = window.location.origin
    if (origin.includes('localhost')) {
      origin = origin.replace('localhost', '10.85.163.205')
    }
    const link = `${origin}/${userSlug}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-surface flex font-sans">
      <SideNav active="dashboard" userSlug={userSlug} setSession={setSession} />

      <main className="flex-1 ml-0 md:ml-64 bg-[#f8f9fa] min-h-screen">
        {/* Top Navbar / Header Area (like Calendly) */}
        <header className="bg-white border-b border-outline-variant/20 px-8 py-4 flex justify-end items-center h-16">
           <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                 <span className="material-symbols-outlined text-on-surface-variant text-[18px]">person_add</span>
              </div>
              <div className="flex items-center gap-2 border border-outline-variant/30 rounded-full px-1 py-1 pr-3 cursor-pointer hover:bg-surface-container-lowest">
                 <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    {userName.charAt(0).toUpperCase()}
                 </div>
                 <span className="material-symbols-outlined text-sm text-on-surface-variant">expand_more</span>
              </div>
           </div>
        </header>

        <div className="p-8 max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-8">
          
          {/* Main Content Area */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-[28px] font-normal text-on-surface flex items-center gap-2">
                Scheduling
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant cursor-pointer">help</span>
              </h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('http://localhost:5000/api/notifications/whatsapp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          phone: '+917498453394',
                          data: {
                            guest_name: '(LIVE DEMO) Judges Panel',
                            slot_date: new Date().toISOString().split('T')[0],
                            slot_time: 'Right Now!',
                            meet_link: 'meet.google.com/demo-link-123'
                          }
                        })
                      });
                      if(res.ok) alert('✅ BOOM! WhatsApp message sent to +917498453394! Check your phone!');
                      else alert('Failed to send. Is the server running?');
                    } catch (err) {
                      alert('Network error. Make sure your server (npm run dev) is running!');
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-[40px] font-semibold text-sm flex items-center gap-2 transition-colors shadow-lg"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  Test WhatsApp
                </button>
                <Link to="/setup" className="bg-[#006bff] hover:bg-[#005be6] text-white px-5 py-2.5 rounded-[40px] font-semibold text-sm flex items-center gap-2 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Create
                </Link>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-outline-variant/20 flex gap-6 mb-6">
              <button className="text-primary font-bold border-b-2 border-primary pb-3 text-sm">Event types</button>
              <button className="text-on-surface-variant hover:text-on-surface font-medium pb-3 text-sm">Single-use links</button>
              <button className="text-on-surface-variant hover:text-on-surface font-medium pb-3 text-sm">Meeting polls</button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-[320px] mb-8">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input 
                type="text" 
                placeholder="Search event types" 
                className="w-full pl-10 pr-4 py-2 border border-outline-variant/40 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* User Row */}
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface flex items-center justify-center font-bold text-xs uppercase">
                    {userName.charAt(0)}
                 </div>
                 <span className="font-semibold text-sm">{userName}</span>
              </div>
              <a href={`/${userSlug}`} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                View landing page
              </a>
            </div>

            {/* Event Type Cards */}
            <div className="space-y-4">
              {eventTypes.length === 0 && (
                <div className="bg-white rounded-lg border border-outline-variant/10 p-12 text-center">
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-4 block">calendar_month</span>
                  <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">No event types yet</h3>
                  <p className="text-[#666666] text-sm mb-6">Create your first event type to start scheduling.</p>
                  <Link to="/setup" className="bg-[#006bff] hover:bg-[#005be6] text-white px-6 py-2.5 rounded-[40px] font-semibold text-sm inline-flex items-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Create Event Type
                  </Link>
                </div>
              )}
              {eventTypes.map(evt => (
                <div key={evt.id} className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-outline-variant/10 flex hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow overflow-hidden group cursor-pointer relative">
                  {/* Left Color Strip */}
                  <div className="w-1.5" style={{ backgroundColor: evt.color || '#8b5cf6' }}></div>
                  
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                            <input type="checkbox" className="w-4 h-4 rounded border-outline-variant/30 text-primary focus:ring-primary cursor-pointer" />
                            <h2 className="text-lg font-bold text-[#1a1a1a]">{evt.name}</h2>
                          </div>
                          <p className="text-[#666666] text-sm">
                            {evt.duration} min · {evt.location} · {evt.type}
                          </p>
                          <p className="text-[#666666] text-sm mt-0.5">{evt.schedule}</p>
                       </div>
                    </div>

                    <div className="flex justify-end items-center mt-6 gap-3">
                       <button 
                          onClick={(e) => { e.preventDefault(); copyLink(); setCopiedId(evt.id); setTimeout(() => setCopiedId(null), 2000); }}
                          className="border border-outline-variant/40 hover:border-primary text-on-surface hover:text-primary px-4 py-1.5 rounded-[40px] text-sm font-semibold flex items-center gap-2 transition-colors"
                       >
                         <span className="material-symbols-outlined text-[18px]">link</span>
                         {copiedId === evt.id ? 'Copied' : 'Copy link'}
                       </button>
                       <button className="border border-outline-variant/40 hover:bg-surface-container-lowest px-2 py-1.5 rounded-lg text-on-surface-variant transition-colors flex items-center justify-center">
                         <span className="material-symbols-outlined text-[20px]">share</span>
                       </button>
                       <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this event type?')) {
                              const updated = eventTypes.filter(e => e.id !== evt.id);
                              setEventTypes(updated);
                              localStorage.setItem('schedula_event_types', JSON.stringify(updated));
                            }
                          }}
                          className="border border-red-200 hover:bg-red-50 hover:border-red-400 text-red-500 hover:text-red-600 px-4 py-1.5 rounded-[40px] text-sm font-semibold flex items-center gap-2 transition-colors"
                       >
                         <span className="material-symbols-outlined text-[18px]">delete</span>
                         Delete
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right Sidebar - Getting Started */}
          <aside className="w-full lg:w-[320px] flex-shrink-0">
            <div className="bg-white border border-outline-variant/20 rounded-xl overflow-hidden">
               <div className="px-5 py-4 border-b border-outline-variant/20 flex justify-between items-center">
                  <h3 className="font-bold text-on-surface">Get started</h3>
                  <button className="text-on-surface-variant hover:text-on-surface">
                     <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
               </div>
               
               <div className="p-0">
                  {/* Item 1 */}
                  <div className="flex items-start gap-4 p-5 hover:bg-surface-container-lowest cursor-pointer border-b border-outline-variant/10">
                     <div className="mt-0.5 relative">
                        <span className="material-symbols-outlined text-[28px] text-[#006bff]">lightbulb</span>
                     </div>
                     <div>
                        <h4 className="font-bold text-sm text-on-surface mb-0.5">Get to know Schedula</h4>
                        <p className="text-xs text-on-surface-variant">1 video</p>
                     </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-start gap-4 p-5 hover:bg-surface-container-lowest cursor-pointer border-b border-outline-variant/10">
                     <div className="mt-0.5">
                        <span className="material-symbols-outlined text-[28px] text-[#006bff]">calendar_month</span>
                     </div>
                     <div>
                        <h4 className="font-bold text-sm text-on-surface mb-0.5">The perfect scheduling setup</h4>
                        <p className="text-xs text-on-surface-variant">2 tasks</p>
                     </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-start gap-4 p-5 hover:bg-surface-container-lowest cursor-pointer">
                     <div className="mt-0.5">
                        <span className="material-symbols-outlined text-[28px] text-[#006bff]">mail</span>
                     </div>
                     <div>
                        <h4 className="font-bold text-sm text-on-surface mb-0.5">Automate meeting prep</h4>
                        <p className="text-xs text-on-surface-variant">2 tasks</p>
                     </div>
                  </div>
               </div>

               <div className="p-5 flex justify-center border-t border-outline-variant/10">
                  <button className="border border-outline-variant/40 hover:bg-surface-container-lowest px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant transition-colors">
                     Don't show again
                  </button>
               </div>
            </div>
          </aside>

        </div>
      </main>

      <ChatBot mode="admin" context={{ userName }} />
    </div>
  )
}
