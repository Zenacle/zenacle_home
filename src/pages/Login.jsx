import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signInWithEmail, verifyEmailOTP } = useAuth()
  const navigate = useNavigate()

  async function handleSendOTP(e) {
    e.preventDefault()
    if (!email.includes('@')) {
      setError('Enter a valid email address')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await signInWithEmail(email)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setStep('otp')
    }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault()
    if (otp.length !== 6) {
      setError('Enter the 6-digit OTP')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await verifyEmailOTP(email, otp)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col px-6 py-12">
      <div className="flex items-center gap-2 mb-12">
        <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
          <path d="M14 3L3 10v15h8v-8h6v8h8V10L14 3Z" fill="#F5C518"/>
        </svg>
        <span className="text-white text-base font-medium">Habtekt</span>
      </div>

      <div className="flex-1">
        {step === 'email' ? (
          <>
            <h1 className="text-white text-3xl font-semibold leading-tight mb-2">Welcome back</h1>
            <p className="text-[#9FE1CB] text-sm mb-10">Enter your email to receive a login code</p>
            <form onSubmit={handleSendOTP}>
              <div className="mb-6">
                <label className="text-[#9FE1CB] text-xs font-semibold uppercase tracking-wider mb-2 block">
                  Email address
                </label>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value.trim())}
                  placeholder="sadhir12@gmail.com"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none placeholder-white/30 focus:border-brand-yellow"
                />
              </div>
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? 'Sending code...' : 'Send login code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <button
              onClick={() => { setStep('email'); setError(''); setOtp('') }}
              className="flex items-center gap-2 text-[#9FE1CB] text-sm mb-8"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <h1 className="text-white text-3xl font-semibold leading-tight mb-2">Check your email</h1>
            <p className="text-[#9FE1CB] text-sm mb-1">We sent a 6-digit code to</p>
            <p className="text-white font-medium text-sm mb-10">{email}</p>
            <form onSubmit={handleVerifyOTP}>
              <div className="mb-6">
                <label className="text-[#9FE1CB] text-xs font-semibold uppercase tracking-wider mb-2 block">
                  6-digit code
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-2xl font-mono tracking-[0.5em] outline-none placeholder-white/20 focus:border-brand-yellow"
                />
              </div>
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify & continue'}
              </button>
              <button type="button" onClick={handleSendOTP} className="w-full text-center text-white/50 text-sm py-3 mt-1">
                Resend code
              </button>
            </form>
          </>
        )}
      </div>

      <p className="text-white/30 text-xs text-center mt-8">
        By continuing you agree to Habtekt's Terms &amp; Privacy Policy
      </p>
    </div>
  )
}
