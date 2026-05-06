import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ChatBot from '../components/ChatBot'
import SplitText from '../components/SplitText'
import BlurText from '../components/BlurText'
import Magnet from '../components/Magnet'
import TiltCard from '../components/TiltCard'

const features = [
  {
    icon: 'auto_awesome',
    color: 'bg-accent-mint',
    title: 'Smart Buffer Logic',
    desc: 'Automatically adds breathing room between meetings so you never feel rushed.',
  },
  {
    icon: 'notifications_active',
    color: 'bg-accent-lavender',
    title: 'Instant Notifications',
    desc: 'WhatsApp + email confirmations sent the moment a booking is made.',
  },
  {
    icon: 'smart_toy',
    color: 'bg-accent-peach',
    title: 'AI Scheduling Assistant',
    desc: 'Book, reschedule or cancel meetings just by chatting. No clicking required.',
  },
]

export default function Landing({ session }) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white text-on-background font-sans overflow-x-hidden">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant/20">
        <div className="max-w-container mx-auto px-gutter flex items-center justify-between h-16">
          <span className="text-2xl font-black tracking-tighter text-primary">Schedula</span>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">Features</a>
            <a href="#how" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">How It Works</a>
          </nav>
          <div className="hidden md:flex items-center gap-4">
            {session ? (
              <Link to="/dashboard" className="btn-primary text-sm">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium">Login</Link>
                <Link to="/signup" className="btn-primary text-sm">Get Your Link Free</Link>
              </>
            )}
          </div>
          {/* Mobile menu button */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="material-symbols-outlined text-primary">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-outline-variant/20 px-gutter py-4 flex flex-col gap-4 animate-fade-in">
            <Link to="/login" className="text-sm text-on-surface-variant font-medium">Login</Link>
            <Link to="/signup" className="btn-primary text-sm text-center">Get Your Link Free</Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="grain relative min-h-screen flex flex-col items-center justify-center text-center px-gutter pt-24 pb-16 overflow-hidden">
        {/* BG decorative circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] border border-primary/5 rounded-full pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] border border-secondary/5 rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto animate-blur-fade-in">
          <div className="inline-flex items-center gap-2 bg-surface-container-low border border-surface-container rounded-full px-4 py-1.5 text-xs font-semibold text-secondary uppercase tracking-widest mb-8">
            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
            Built for Hackathon 2026
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.02] mb-6 flex flex-col items-center w-full text-center">
            <BlurText
              text="One link."
              delay={150}
              animateBy="words"
              direction="top"
              className="text-primary mb-2"
            />
            <BlurText
              text="Zero back-and-forth."
              delay={150}
              animateBy="words"
              direction="bottom"
              className="text-[#0f111a]"
            />
          </h1>

          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
            Share your Schedula link. Clients pick a time. You both get notified.
            No emails. No DMs. No chaos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Magnet>
              <Link to="/signup" className="btn-primary text-base px-10 py-4 shadow-xl hover:shadow-2xl transition-shadow block">
                Get Your Link Free
              </Link>
            </Magnet>
            <Magnet>
              <a href="#how" className="btn-outline text-base px-10 py-4 block">
                See How It Works
              </a>
            </Magnet>
          </div>

          {/* Social proof */}
          <div className="mt-16 pt-12 border-t border-outline-variant/20">
            <p className="text-xs text-on-surface-variant/50 uppercase tracking-widest mb-6">
              Trusted by professionals everywhere
            </p>
            <div className="flex flex-wrap justify-center gap-10 grayscale opacity-30">
              {['TATA', 'RELIANCE', 'INFOSYS', 'ZOMATO', 'SWIGGY'].map(b => (
                <span key={b} className="text-xl font-black tracking-tighter">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-gutter max-w-container mx-auto">
        <div className="text-center mb-16 reveal">
          <h2 className="text-4xl font-black tracking-tighter text-primary mb-4">Everything you need.</h2>
          <p className="text-on-surface-variant text-lg max-w-xl mx-auto">Engineered for simplicity. Built for speed.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <TiltCard
              key={i}
              className="reveal"
              style={{ transitionDelay: `${i * 0.15}s` }}
            >
              <div className="card card-hover p-10 rounded-2xl group h-full">
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-primary">{f.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">{f.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">{f.desc}</p>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-24 bg-surface-container-low">
        <div className="max-w-container mx-auto px-gutter">
          <div className="text-center mb-16 reveal">
            <h2 className="text-4xl font-black tracking-tighter text-primary mb-4">3 steps. That's it.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: 'settings', title: 'Set Your Hours', desc: 'Tell Schedula when you\'re free. Set duration, buffers, and block days off.' },
              { step: '02', icon: 'link', title: 'Share Your Link', desc: 'You get a unique link like schedula.app/yourname. Share it anywhere.' },
              { step: '03', icon: 'check_circle', title: 'Meetings Book Themselves', desc: 'Clients pick a time. Both get instant WhatsApp + email confirmation.' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col gap-4 reveal" style={{ transitionDelay: `${i * 0.15}s` }}>
                <div className="flex items-center gap-4">
                  <span className="text-6xl font-black text-primary/5">{s.step}</span>
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-white">{s.icon}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-primary">{s.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-gutter">
        <div className="max-w-container mx-auto">
          <div className="bg-primary text-on-primary rounded-3xl p-16 text-center relative overflow-hidden reveal">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/20 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">Ready to stop playing email tag?</h2>
              <p className="text-white/70 text-lg mb-8">Get your link in 2 minutes. Free forever.</p>
              <Link to="/signup" className="inline-block bg-secondary text-white px-12 py-4 rounded-full font-bold text-lg hover:opacity-90 active:scale-95 transition-all shadow-xl">
                Start Now — It's Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant/20 py-12 px-gutter reveal">
        <div className="max-w-container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <span className="text-xl font-black text-primary">Schedula</span>
            <p className="text-sm text-on-surface-variant/60 mt-1">© 2026 Schedula. One link. Zero back-and-forth.</p>
          </div>
          <div className="flex gap-8 text-sm text-on-surface-variant">
            {['Privacy', 'Terms', 'Support'].map(l => (
              <a key={l} href="#" className="hover:text-primary transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>

      {/* Floating chatbot */}
      <ChatBot mode="guest" />
    </div>
  )
}
