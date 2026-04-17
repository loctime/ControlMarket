import { createContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { getUserProfile, updateLastLogin } from '../lib/firestore'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid)
        setCurrentUser(user)
        setRole(profile?.role ?? 'vendedor')
        updateLastLogin(user.uid).catch(() => {})
      } else {
        setCurrentUser(null)
        setRole(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ currentUser, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
