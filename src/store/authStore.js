import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isDemo: false,

      setAuth: (user, token) => set({ user, token }),
      setDemo: (user, token) => set({ user, token, isDemo: true }),
      logout: () => {
        set({ user: null, token: null, isDemo: false })
        localStorage.removeItem('skillforge-auth')
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
