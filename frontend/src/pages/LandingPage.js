import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBike from '../hero_bike.png';

import logo from '../logo.png';

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Parallax
      if (heroRef.current) {
        const y = window.scrollY;
        heroRef.current.style.transform = `translateY(${y * 0.12}px)`;
      }
      // Navbar adaptability
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ── Navbar ── */}
      <nav className="navbar" style={{ 
        padding: scrolled ? '0 60px' : '0 80px', 
        height: scrolled ? '70px' : '90px',
        background: scrolled ? 'rgba(10, 10, 10, 0.85)' : 'rgba(10, 10, 10, 0.4)',
        backdropFilter: 'blur(40px) saturate(180%)',
        borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid transparent',
        boxShadow: scrolled ? '0 10px 40px rgba(0, 0, 0, 0.3)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 1000,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src={logo} alt="ElasticityAI Logo" className="brand-logo" 
               style={{ height: scrolled ? '40px' : '48px', width: scrolled ? '40px' : '48px', transition: 'all 0.4s' }} />
          <span style={{ 
            fontSize: scrolled ? '20px' : '24px', 
            fontWeight: '900', 
            letterSpacing: '-0.8px', 
            background: 'linear-gradient(90deg, #fff, #7EE63B)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            transition: 'all 0.4s'
          }}>
            ElasticityAI
          </span>
        </div>

        <div className="nav-links" style={{ gap: scrolled ? '40px' : '56px', display: 'flex', transition: 'all 0.4s' }}>
          {['Home', 'How it works', 'Careers', 'About us'].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, '')}`} 
               className={item === 'Home' ? 'active' : ''} 
               style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {item}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <button className="btn-outline" onClick={() => navigate('/login')} 
                  style={{ padding: scrolled ? '10px 24px' : '12px 28px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#fff', fontSize: '13px', fontWeight: '700', transition: 'all 0.4s' }}>
            Log in
          </button>
          <button className="btn-green" onClick={() => navigate('/signup')} 
                  style={{ padding: scrolled ? '10px 24px' : '12px 28px', borderRadius: '12px', boxShadow: '0 0 30px rgba(126, 230, 59, 0.15)', fontSize: '13px', transition: 'all 0.4s' }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section id="home" style={{ position: 'relative', minHeight: '100vh', display: 'flex', overflow: 'hidden' }}>
        {/* Topo bg */}
        <div className="topo-bg" />

        {/* Left column */}
        <div style={{
          flex: '1', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '140px 0 80px 80px',
          position: 'relative', zIndex: 2,
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 99, padding: '8px 16px', width: 'fit-content',
            marginBottom: 36, backdropFilter: 'blur(10px)',
          }}>
            <span style={{ fontSize: 18 }}>🔥</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>⚡ Electro Bike</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: 'var(--font-display)', lineHeight: 1.05, marginBottom: 28 }}>
            <span style={{ fontSize: 'clamp(48px,5.5vw,76px)', fontWeight: 700, display: 'block', color: 'rgba(255,255,255,0.82)' }}>
              Ride the road&nbsp;🚴‍♀️🔥
            </span>
            <span style={{ fontSize: 'clamp(52px,6vw,82px)', fontWeight: 900, display: 'block' }}>
              Feel the freedom
            </span>
          </h1>

          {/* Sub */}
          <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 400, marginBottom: 48 }}>
            With smooth navigation and smart tracking, your<br />
            next cycling adventure is just a pedal away
          </p>

          {/* CTA */}
          <button className="btn-primary" onClick={() => navigate('/signup')} style={{ width: 'fit-content' }}>
            Get started 🚴
            <span className="arrow">&raquo;</span>
          </button>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 48, marginTop: 72 }}>
            {[
              { icon: '🏆', val: '12k +', label: 'Bikes' },
              { icon: '🦊', val: '2.4 +', label: 'Users (M)' },
              { icon: '🛒', val: '45 +', label: 'Shopping' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 22, marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column – green circle + bike */}
        <div style={{
          width: '52%', position: 'relative', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Big green radial blob */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: '100%',
            background: 'radial-gradient(ellipse 72% 72% at 65% 48%, #7EE63B 0%, #5CC41A 35%, transparent 72%)',
            opacity: 0.95,
          }} />

          {/* Bike image with inner glow effect */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              position: 'absolute', width: '60%', height: '60%',
              background: 'radial-gradient(circle, rgba(126, 230, 59, 0.4) 0%, transparent 70%)',
              filter: 'blur(40px)', zIndex: -1,
              animation: 'pulseGlow 4s ease-in-out infinite'
            }} />
            <img
              ref={heroRef}
              src={heroBike}
              alt="Electric bike"
              style={{
                width: '88%', maxWidth: 580,
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 30px rgba(126, 230, 59, 0.5)) drop-shadow(0 20px 40px rgba(0,0,0,0.4))',
                animation: 'floatBike 4s ease-in-out infinite',
              }}
            />
          </div>

          {/* Product card overlay */}
          <div style={{
            position: 'absolute', bottom: 60, left: -20, zIndex: 5,
            background: 'rgba(18,18,18,0.92)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '18px 22px',
            display: 'flex', alignItems: 'center', gap: 20,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            minWidth: 280,
          }}>
            <img src={logo} alt="ElasticityAI" className="brand-logo" style={{ width: 70, height: 70, objectFit: 'cover' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>ElasticityAI <em style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>T365</em></div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 10px', display: 'flex', gap: 8 }}>
                <span>⚡ Electro Bike</span><span>📱 98%</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Price</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>$1.80 <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>p/m</span></div>
            </div>
            <div style={{
              marginLeft: 'auto', width: 40, height: 40,
              background: 'var(--green)', borderRadius: 99,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 18, cursor: 'pointer',
            }}>✓</div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="howitworks" style={{ padding: '100px 80px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,4vw,52px)', fontWeight: 900 }}>
            Simple. Smart. Sustainable.
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 500, margin: '16px auto 0', lineHeight: 1.7 }}>
            Our AI-powered platform predicts demand and helps you ride smarter every day.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {[
            { icon: '🔍', step: '01', title: 'Explore Bikes', desc: 'Browse our fleet of electric and city bikes. Find the perfect ride for your adventure.' },
            { icon: '📊', step: '02', title: 'Smart Prediction', desc: 'Our ML model forecasts demand in real-time based on weather, season and time of day.' },
            { icon: '🚴', step: '03', title: 'Ride & Track', desc: 'Unlock your bike, ride freely and track your journey with built-in smart analytics.' },
          ].map(c => (
            <div key={c.step} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 24, padding: 32,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: 36, marginBottom: 16 }}>{c.icon}</div>
              <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10 }}>STEP {c.step}</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{c.title}</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 14 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section id="aboutus" style={{ margin: '0 80px 100px', padding: '60px 64px', background: 'linear-gradient(135deg,#1a1a1a,#111)', border: '1px solid var(--border)', borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', background: 'radial-gradient(ellipse at right center,rgba(126,230,59,0.12) 0%,transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 900, marginBottom: 14 }}>
            Ready to ride<br />the future? 🚀
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 380, lineHeight: 1.7 }}>
            Join 2.4 million cyclists who are already exploring smarter routes with our platform.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, position: 'relative', zIndex: 1 }}>
          <button className="btn-green" onClick={() => navigate('/signup')}>Get started free</button>
          <button className="btn-outline" onClick={() => navigate('/login')}>Log in</button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={logo} alt="ElasticityAI Logo" className="brand-logo" style={{ height: '30px', width: 'auto' }} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>ElasticityAI</span>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>© 2026 ElasticityAI. Bike Demand Elasticity Platform.</p>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Contact'].map(l => (
            <a key={l} href="#!" style={{ color: 'var(--text-dim)', fontSize: 13, transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-dim)'}
            >{l}</a>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes floatBike {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-18px); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
