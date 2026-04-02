import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const STORAGE_KEY = 'mu_user_demo_profile_v1'

function loadStoredProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (p && typeof p.role === 'string' && Array.isArray(p.interests) && p.interests.length > 0) {
      const interests = p.interests.filter((x) => typeof x === 'string')
      let role = p.role === 'pm' ? 'researcher' : p.role
      const next = { role, interests }
      if (p.role === 'pm') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
          /* ignore */
        }
      }
      return next
    }
  } catch {
    /* ignore */
  }
  return null
}

const UserDemoContext = createContext(null)

export function UserDemoProvider({ children }) {
  const [profile, setProfileState] = useState(() => loadStoredProfile())
  const [demoModalOpen, setDemoModalOpen] = useState(false)

  const setProfile = useCallback((next) => {
    setProfileState(next)
    if (next && next.role && next.interests?.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const openUserDemoModal = useCallback(() => {
    setDemoModalOpen(true)
  }, [])

  const closeUserDemoModal = useCallback(() => {
    setDemoModalOpen(false)
  }, [])

  const completeUserDemo = useCallback((role, interests) => {
    setProfile({ role, interests })
    setDemoModalOpen(false)
  }, [setProfile])

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      demoModalOpen,
      openUserDemoModal,
      closeUserDemoModal,
      completeUserDemo,
    }),
    [profile, setProfile, demoModalOpen, openUserDemoModal, closeUserDemoModal, completeUserDemo]
  )

  return <UserDemoContext.Provider value={value}>{children}</UserDemoContext.Provider>
}

export function useUserDemo() {
  const ctx = useContext(UserDemoContext)
  if (!ctx) throw new Error('useUserDemo must be used within UserDemoProvider')
  return ctx
}
