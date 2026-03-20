import { create } from 'zustand'

export const usePathwayStore = create((set, get) => ({
  pathway: null,
  skillProfile: null,
  chatHistory: [],
  activeStep: null,
  quizResults: [],

  setPathway: (pathway) => set({ pathway }),
  setSkillProfile: (skillProfile) => set({ skillProfile }),
  setActiveStep: (step) => set({ activeStep: step }),

  addMessage: (message) =>
    set((state) => ({
      chatHistory: [...state.chatHistory, { ...message, id: `msg-${Date.now()}`, timestamp: new Date().toISOString() }],
    })),

  setChatHistory: (chatHistory) => set({ chatHistory }),

  updateStepStatus: (stepId, status, quizScore = null) =>
    set((state) => {
      if (!state.pathway) return state
      const steps = state.pathway.steps.map((s) =>
        s.id === stepId
          ? { ...s, status, quiz_score: quizScore !== null ? quizScore : s.quiz_score }
          : s
      )
      return { pathway: { ...state.pathway, steps } }
    }),

  addQuizResult: (result) =>
    set((state) => ({ quizResults: [...state.quizResults, result] })),

  clearPathway: () => set({ pathway: null, skillProfile: null, chatHistory: [], activeStep: null }),
}))
