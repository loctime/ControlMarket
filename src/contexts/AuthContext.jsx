import { createContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { getUserProfile, updateLastLogin } from '../lib/firestore'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [role, setRole] = useState(null)
  const [orgId, setOrgId] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const tokenResult = await user.getIdTokenResult()
        const claimOrgId = tokenResult.claims.orgId ?? null
        const claimRole = tokenResult.claims.role ?? null

        const userProfile = claimOrgId ? await getUserProfile(user.uid).catch(() => null) : null

        setCurrentUser(user)
        setOrgId(claimOrgId)
        setRole(claimRole ?? userProfile?.role ?? null)
        setProfile(userProfile)

        if (claimOrgId) {
          updateLastLogin(user.uid).catch(() => {})
        }
      } else {
        setCurrentUser(null)
        setRole(null)
        setOrgId(null)
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await cred.user.getIdToken(true)
    return cred
  }

  async function logout() {
    await signOut(auth)
  }

  async function refreshClaims() {
    if (!auth.currentUser) return
    await auth.currentUser.getIdToken(true)
    const tokenResult = await auth.currentUser.getIdTokenResult()
    setOrgId(tokenResult.claims.orgId ?? null)
    setRole(tokenResult.claims.role ?? null)
  }

  return (
    <AuthContext.Provider
      value={{ currentUser, role, orgId, profile, loading, login, logout, refreshClaims }}
    >
      {children}
    </AuthContext.Provider>
  )
}
