import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [household, setHousehold] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchHousehold()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) fetchHousehold()
        else setHousehold(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchHousehold() {
    const { data, error } = await supabase.rpc('get_my_household')
    if (error) {
      console.error('fetchHousehold error:', error)
      return
    }
    if (data && data.length > 0) {
      setHousehold(data[0])
    }
  }

  async function signInWithEmail(email) {
    const { error } = await supabase.auth.signInWithOtp({ email })
    return { error }
  }

  async function verifyEmailOTP(email, token) {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = {
    session,
    household,
    isLoading: session === undefined,
    isLoggedIn: !!session,
    signInWithEmail,
    verifyEmailOTP,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}