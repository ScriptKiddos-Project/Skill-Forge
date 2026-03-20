import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isDemo: false,

      setAuth: (user, access_token) => {
        localStorage.setItem('sf_token', access_token)
        set({ user, token: access_token })
      },
      setDemo: (user, token) => {
        localStorage.setItem('sf_token', token)
        set({ user, token, isDemo: true })
      },
      logout: () => {
        localStorage.removeItem('sf_token')
        localStorage.removeItem('skillforge-auth')
        set({ user: null, token: null, isDemo: false })
      },
      isAuthenticated: () => {
        const state = get()
        return !!(state.user && state.token)
      },
    }),
    {
      name: 'skillforge-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isDemo: state.isDemo }),
    }
  )
)