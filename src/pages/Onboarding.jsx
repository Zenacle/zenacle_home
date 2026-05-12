import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const slides = [
  {
    illustration: (
      <div className="w-48 h-48 flex items-center justify-center">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" width="180" height="180">
          <rect x="60" y="80" width="80" height="90" rx="6" fill="#2D7D46" opacity="0.3"/>
          <rect x="60" y="80" width="80" height="90" rx="6" stroke="#F5C518" strokeWidth="2"/>
          <rect x="80" y="60" width="40" height="30" rx="4" fill="#F5C518" opacity="0.8"/>
          <path d="M85 75h30M100 65v20" stroke="#1B3D2F" strokeWidth="2" strokeLinecap="round"/>
          <rect x="72" y="110" width="24" height="16" rx="3" fill="#F5C518" opacity="0.6"/>
          <rect x="104" y="110" width="24" height="16" rx="3" fill="#F5C518" opacity="0.6"/>
          <rect x="72" y="134" width="56" height="24" rx="3" fill="#F5C518"/>
          <path d="M88 146h24" stroke="#1B3D2F" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="150" cy="70" r="20" fill="#F5C518" opacity="0.15" stroke="#F5C518" strokeWidth="1.5"/>
          <path d="M142 70h16M150 62v16" stroke="#F5C518" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    ),
    heading: <>Know <em className="italic text-brand-yellow not-italic font-semibold">exactly</em> where<br />your money goes<br />at home</>,
    body: 'Real-time bill intelligence for every appliance. No guessing. Just clarity and savings.',
    cta: 'Continue',
  },
  {
    illustration: (
      <div className="w-48 h-48 flex items-center justify-center">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" width="180" height="180">
          <path d="M100 30C100 30 60 75 60 110a40 40 0 0080 0C140 75 100 30 100 30Z" fill="#2D7D46" opacity="0.25" stroke="#5DCAA5" strokeWidth="2"/>
          <path d="M100 50C100 50 72 85 72 110a28 28 0 0056 0C128 85 100 50 100 50Z" fill="#2D7D46" opacity="0.4"/>
          <path d="M88 118c0-6.6 5.4-12 12-12" stroke="#9FE1CB" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="140" cy="55" r="18" fill="#F5C518" opacity="0.15" stroke="#F5C518" strokeWidth="1.5"/>
          <path d="M133 55h14M140 48v14" stroke="#F5C518" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="50" y="140" width="100" height="3" rx="1.5" fill="#5DCAA5" opacity="0.3"/>
          <rect x="50" y="150" width="70" height="3" rx="1.5" fill="#5DCAA5" opacity="0.2"/>
        </svg>
      </div>
    ),
    heading: <>Track water<br /><em className="text-brand-yellow not-italic font-semibold italic">intelligently</em>, not<br />manually</>,
    body: 'Smart meters feed live data to your dashboard. Spot leaks before they become bills.',
    cta: 'Continue',
  },
  {
    illustration: (
      <div className="w-48 h-48 flex items-center justify-center">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" width="180" height="180">
          <circle cx="100" cy="100" r="55" fill="#2D7D46" opacity="0.15" stroke="#5DCAA5" strokeWidth="1.5"/>
          <path d="M100 50L100 100L130 130" stroke="#F5C518" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="100" cy="100" r="6" fill="#F5C518"/>
          <path d="M65 65L45 45M135 65L155 45M135 135L155 155M65 135L45 155" stroke="#5DCAA5" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
          <rect x="75" y="155" width="50" height="4" rx="2" fill="#F5C518" opacity="0.4"/>
          <rect x="85" y="163" width="30" height="3" rx="1.5" fill="#F5C518" opacity="0.25"/>
        </svg>
      </div>
    ),
    heading: <>Savings are the goal.<br /><em className="text-brand-yellow not-italic font-semibold italic">Sustainability</em> follows.</>,
    body: 'Habtekt turns your resource data into money-saving moves every single month.',
    cta: 'Get started',
  },
]

export default function Onboarding() {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()

  function next() {
    if (current < slides.length - 1) {
      setCurrent(current + 1)
    } else {
      navigate('/login')
    }
  }

  function skip() {
    navigate('/login')
  }

  const slide = slides[current]

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-between px-6 py-10 select-none">

      {/* Logo — only on first slide */}
      {current === 0 ? (
        <div className="flex flex-col items-center gap-1 mt-4">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 3L3 10v15h8v-8h6v8h8V10L14 3Z" fill="#F5C518"/>
            </svg>
            <span className="text-white text-xl font-semibold tracking-tight">Habtekt</span>
          </div>
          <span className="text-[#5DCAA5] text-xs">Green Home Intelligence</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 self-start">
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
            <path d="M14 3L3 10v15h8v-8h6v8h8V10L14 3Z" fill="#F5C518"/>
          </svg>
          <span className="text-white text-sm font-medium">Habtekt</span>
        </div>
      )}

      {/* Illustration */}
      <div className="flex-1 flex items-center justify-center">
        {slide.illustration}
      </div>

      {/* Text content */}
      <div className="w-full max-w-sm">
        <h1 className="text-white text-3xl font-semibold leading-tight mb-3">
          {slide.heading}
        </h1>
        <p className="text-[#9FE1CB] text-sm leading-relaxed mb-8">
          {slide.body}
        </p>

        {/* Dot indicators */}
        <div className="flex gap-1.5 mb-6">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'bg-brand-yellow w-5' : 'bg-white/30 w-1.5'
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <button onClick={next} className="btn-primary mb-3">
          {slide.cta}
        </button>

        {/* Skip */}
        {current < slides.length - 1 && (
          <button
            onClick={skip}
            className="w-full text-center text-white/50 text-sm py-2"
          >
            SKIP
          </button>
        )}
      </div>
    </div>
  )
}
