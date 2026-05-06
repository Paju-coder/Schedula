import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function EventSetup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(4) // Start at 4 based on screenshot
  
  // State for availability
  const [schedule, setSchedule] = useState([
    { day: 'S', name: 'Sunday', active: false, start: '9:00am', end: '5:00pm' },
    { day: 'M', name: 'Monday', active: true, start: '9:00am', end: '5:00pm' },
    { day: 'T', name: 'Tuesday', active: true, start: '9:00am', end: '5:00pm' },
    { day: 'W', name: 'Wednesday', active: true, start: '9:00am', end: '5:00pm' },
    { day: 'T', name: 'Thursday', active: true, start: '9:00am', end: '5:00pm' },
    { day: 'F', name: 'Friday', active: true, start: '9:00am', end: '5:00pm' },
    { day: 'S', name: 'Saturday', active: false, start: '9:00am', end: '5:00pm' },
  ])
  
  // State for location
  const [location, setLocation] = useState('Google Meet')
  
  const locations = [
    { id: 'Zoom', icon: 'videocam', color: 'text-blue-500' },
    { id: 'Google Meet', icon: 'video_camera_front', color: 'text-green-500' },
    { id: 'Microsoft Teams', icon: 'groups', color: 'text-indigo-500' },
    { id: 'In-person', icon: 'location_on', color: 'text-gray-600' },
    { id: 'Phone call', icon: 'call', color: 'text-gray-600' },
  ]

  const toggleDay = (index) => {
    setSchedule(s => s.map((d, i) => i === index ? { ...d, active: !d.active } : d))
  }

  const updateTime = (index, field, value) => {
    setSchedule(s => s.map((d, i) => i === index ? { ...d, [field]: value } : d))
  }

  const [timezone, setTimezone] = useState('Indian Standard Time')
  const timezones = [
    'Indian Standard Time',
    'Eastern Time - US & Canada',
    'Pacific Time - US & Canada',
    'Central Time - US & Canada',
    'Greenwich Mean Time',
    'Central European Time'
  ]

  const timeOptions = Array.from({ length: 24 }).map((_, i) => {
    const hour = i % 12 || 12;
    const ampm = i < 12 ? 'am' : 'pm';
    return [`${hour}:00${ampm}`, `${hour}:30${ampm}`];
  }).flat();

  const handleContinue = () => {
    if (step === 4) setStep(5)
    else {
      // Create and save the new event type
      const newEvent = {
        id: Math.random().toString(36).substr(2, 9),
        name: 'New Event Type', // In a real app we'd ask for this
        duration: 30, // Or whatever duration they selected
        location: location,
        type: 'One-on-One',
        schedule: 'Custom Schedule',
        color: ['#8b5cf6', '#006bff', '#ec4899', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)]
      }
      
      const existing = JSON.parse(localStorage.getItem('schedula_event_types') || '[]')
      localStorage.setItem('schedula_event_types', JSON.stringify([...existing, newEvent]))
      
      navigate('/dashboard')
    }
  }

  const handleBack = () => {
    if (step === 5) setStep(4)
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white flex font-sans overflow-hidden">
      
      {/* Left Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        
        {/* Top Header & Progress */}
        <header className="w-full px-8 py-6 flex items-center justify-between">
          <Link to="/dashboard" className="text-2xl font-black text-primary tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            </div>
            Schedula
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-[#1a1a1a] tracking-widest uppercase">
              Step {step} of 5
            </span>
            <div className="flex gap-1.5 w-48">
              {[1, 2, 3, 4, 5].map(s => (
                <div 
                  key={s} 
                  className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-[#006bff]' : 'bg-[#e5e7eb]'}`}
                />
              ))}
            </div>
          </div>
        </header>

        {/* Form Container */}
        <div className="max-w-[700px] mx-auto w-full px-8 pt-12 pb-24">
          
          {step === 4 && (
            <div className="animate-fade-in">
              <h1 className="text-[28px] font-bold text-[#1a1a1a] mb-2">When are you available to meet with people?</h1>
              <p className="text-[#666666] text-[15px] mb-8">
                You'll only be booked during these times (you can change these times and add other schedules later)
              </p>

              <div className="border border-outline-variant/30 rounded-xl p-8 bg-white shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">sync</span>
                  <h3 className="font-bold text-[#1a1a1a] text-[15px]">Weekly hours</h3>
                </div>
                <p className="text-[#666666] text-[13px] mb-8">Set when you are typically available for meetings</p>

                <div className="space-y-4">
                  {schedule.map((day, idx) => (
                    <div key={day.name} className="flex items-center gap-6">
                      {/* Day toggle circle */}
                      <button 
                        onClick={() => toggleDay(idx)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] transition-colors ${
                          day.active ? 'bg-[#005be6] text-white' : 'bg-[#f3f4f6] text-[#666666] hover:bg-[#e5e7eb]'
                        }`}
                      >
                        {day.day}
                      </button>

                      {/* Inputs or Unavailable */}
                      <div className="flex-1">
                        {day.active ? (
                          <div className="flex items-center gap-3">
                            <input 
                              type="text"
                              value={day.start} 
                              onChange={(e) => updateTime(idx, 'start', e.target.value)}
                              className="w-24 px-3 py-2 border border-outline-variant/40 rounded-lg text-sm text-center focus:outline-none focus:border-primary bg-white"
                              placeholder="9:00am"
                            />
                            <span className="text-[#666666]">-</span>
                            <input 
                              type="text"
                              value={day.end} 
                              onChange={(e) => updateTime(idx, 'end', e.target.value)}
                              className="w-24 px-3 py-2 border border-outline-variant/40 rounded-lg text-sm text-center focus:outline-none focus:border-primary bg-white"
                              placeholder="5:00pm"
                            />
                            
                            <div className="flex items-center gap-2 ml-4 text-on-surface-variant">
                              <button className="hover:bg-surface-container-low p-1.5 rounded-md flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                              </button>
                              <button className="hover:bg-surface-container-low p-1.5 rounded-md flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined text-[18px]">add</span>
                              </button>
                              <button className="hover:bg-surface-container-low p-1.5 rounded-md flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#666666] text-[15px]">Unavailable</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 pt-6 border-t border-outline-variant/20">
                  <h4 className="text-[13px] font-bold text-[#1a1a1a] mb-2">Time zone</h4>
                  <div className="flex items-center gap-2 text-sm text-[#1a1a1a] relative w-max">
                    <span className="material-symbols-outlined text-[18px]">public</span>
                    <select 
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="bg-transparent font-medium cursor-pointer focus:outline-none appearance-none pr-6"
                    >
                      {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                    </select>
                    <span className="material-symbols-outlined text-[18px] absolute right-0 pointer-events-none">arrow_drop_down</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                 <button onClick={handleContinue} className="bg-[#006bff] hover:bg-[#005be6] text-white px-8 py-3 rounded-full font-bold text-sm transition-colors shadow-md">
                   Continue
                 </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-fade-in">
              <h1 className="text-[28px] font-bold text-[#1a1a1a] mb-2">How would you like to meet with people?</h1>
              <p className="text-[#666666] text-[15px] mb-8">
                Set a meeting location for your first scheduling link. You can always change this later.
              </p>

              <div className="border border-outline-variant/30 rounded-xl p-8 bg-white shadow-sm grid grid-cols-2 gap-4">
                {locations.map(loc => (
                  <button 
                    key={loc.id}
                    onClick={() => setLocation(loc.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      location === loc.id 
                        ? 'border-[#006bff] bg-[#f0f6ff]' 
                        : 'border-outline-variant/30 hover:border-outline-variant/60'
                    }`}
                  >
                    <span className={`material-symbols-outlined ${loc.color}`}>{loc.icon}</span>
                    <span className="font-bold text-[15px] text-[#1a1a1a]">{loc.id}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center mt-8">
                 <button onClick={handleBack} className="text-[#1a1a1a] font-bold text-sm flex items-center gap-2 hover:bg-surface-container-low px-4 py-2 rounded-full transition-colors">
                   <span className="material-symbols-outlined text-[18px]">arrow_back_ios</span>
                   Back
                 </button>
                 <button onClick={handleContinue} className="bg-[#006bff] hover:bg-[#005be6] text-white px-8 py-3 rounded-full font-bold text-sm transition-colors shadow-md">
                   Continue
                 </button>
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Right Preview Area */}
      <div className="w-[45%] bg-[#f8f9fa] border-l border-outline-variant/20 relative hidden lg:block overflow-hidden">
        {/* Background shapes mimicking Calendly */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#8b5cf6] rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob"></div>
        <div className="absolute top-40 -right-20 w-80 h-80 bg-[#006bff] rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 left-20 w-80 h-80 bg-[#ec4899] rounded-full mix-blend-multiply filter blur-[80px] opacity-20 animate-blob animation-delay-4000"></div>

        <div className="h-full flex items-center justify-center p-12 relative z-10">
          
          {step === 4 && (
            <div className="bg-white rounded-xl shadow-xl w-full max-w-[340px] overflow-hidden animate-slide-up">
              <div className="p-6">
                <h3 className="font-bold text-center text-[#1a1a1a] mb-6">Select a Date & Time</h3>
                
                <div className="flex justify-between items-center mb-6 px-4">
                  <span className="material-symbols-outlined text-[#006bff] cursor-pointer">arrow_back_ios</span>
                  <span className="font-bold text-sm tracking-widest text-[#1a1a1a]">AUGUST</span>
                  <span className="material-symbols-outlined text-[#006bff] cursor-pointer">arrow_forward_ios</span>
                </div>
                
                <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center text-xs mb-4">
                  {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
                    <div key={d} className="text-[#666666] font-bold text-[10px]">{d}</div>
                  ))}
                  {[30,31,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30].map((d, i) => (
                    <div 
                      key={i} 
                      className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-sm cursor-pointer ${
                        d === 16 ? 'bg-[#006bff] text-white font-bold shadow-md' : 'text-[#1a1a1a] hover:bg-surface-container-low'
                      }`}
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Fake absolute popup for times */}
              <div className="absolute right-0 bottom-24 bg-white rounded-xl shadow-2xl border border-outline-variant/10 p-4 w-[200px] animate-fade-in-up">
                <p className="text-xs text-[#666666] mb-3 text-center">Wednesday, August 16</p>
                <div className="space-y-2">
                  <button className="w-full py-2.5 border border-[#006bff] text-[#006bff] rounded-md text-sm font-bold hover:bg-[#f0f6ff]">10:00am</button>
                  <button className="w-full py-2.5 border border-[#006bff] text-[#006bff] rounded-md text-sm font-bold hover:bg-[#f0f6ff]">10:30am</button>
                  <div className="flex gap-2">
                    <button className="w-1/2 py-2.5 bg-[#1a1a1a] text-white rounded-md text-sm font-bold">11:00am</button>
                    <button className="w-1/2 py-2.5 bg-[#006bff] text-white rounded-md text-sm font-bold">Confirm</button>
                  </div>
                  <button className="w-full py-2.5 border border-[#006bff] text-[#006bff] rounded-md text-sm font-bold hover:bg-[#f0f6ff]">11:30am</button>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-[320px] flex flex-col items-center animate-slide-up relative">
               <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm mb-4">
                 <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=Prajwal`} alt="Avatar" className="w-full h-full object-cover" />
               </div>
               
               <h3 className="font-bold text-xl text-[#1a1a1a] mb-6">Meeting booked!</h3>
               
               <div className="w-full text-center mb-6">
                 <p className="text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-1">WHEN</p>
                 <p className="text-sm text-[#1a1a1a]">Wednesday, August 16</p>
               </div>
               
               <div className="w-full text-center">
                 <p className="text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-2">LOCATION</p>
                 <div className="w-12 h-1.5 bg-[#006bff] rounded-full mx-auto opacity-70"></div>
                 
                 <div className="mt-4 animate-bounce">
                    <span className="material-symbols-outlined text-[#006bff] text-[32px] font-light">expand_more</span>
                 </div>
               </div>

               {/* Location Icon Overlay */}
               <div className="absolute -bottom-10 bg-white rounded-3xl shadow-xl w-20 h-20 flex items-center justify-center border border-outline-variant/10">
                  <span className="material-symbols-outlined text-[40px] text-[#006bff]">{locations.find(l => l.id === location)?.icon || 'videocam'}</span>
               </div>
            </div>
          )}
          
        </div>
      </div>

    </div>
  )
}
