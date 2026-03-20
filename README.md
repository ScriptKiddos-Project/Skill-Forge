# SkillForge Frontend

**Autonomous Skill Intelligence & Adaptive Learning Engine**  
ARTPARK CodeForge Hackathon · Winning Build v4.0

---

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` — or append `?demo=true` to any URL for instant demo mode.

## Demo Mode

```
http://localhost:5173/dashboard?demo=true
```

- Preloaded profile (Alex Chen — Senior Full-Stack Engineer)
- Full pathway with 9 steps (PASS / REVISE / ACTIVE / LOCKED)
- Working quiz (Docker & Containerization — 5 MCQs)
- Stateful MentorChat with contextual demo replies
- All charts and analytics populated
- **Zero backend required**

## Tech Stack

| Tool | Purpose |
|---|---|
| React 18 + Vite | Framework |
| Tailwind CSS | Styling |
| Zustand | State management |
| Axios | API layer + auth interceptor |
| Recharts | SkillGapChart, ScoreTimeline, ProgressDonut, RadarChart |
| react-flow | SkillDAGGraph (DAG visualization) |
| framer-motion | Animations |

## Folder Structure

```
src/
├── App.jsx               # Routing + ProtectedRoute + DemoLoader
├── main.jsx
├── index.css             # Cyberpunk theme (CSS variables, glass cards, neon)
├── store/
│   ├── authStore.js      # Zustand: user, token, login/logout (persisted)
│   └── pathwayStore.js   # Zustand: pathway, chatHistory, step updates
├── lib/
│   ├── api.js            # Axios instance + auth interceptor + SSE helper
│   └── utils.js          # cn, scoreToColor, statusToColor, formatHours...
├── data/
│   └── demoProfile.js    # HARDCODED: demoUser, demoPathway, demoSkillProfile, demoChatHistory, demoQuizQuestions
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx         # Icon-only sidebar with glow active state
│   │   ├── Navbar.jsx          # Top bar with route label + actions
│   │   ├── AppLayout.jsx       # Wrapper: Sidebar + Navbar + main
│   │   └── ProtectedRoute.jsx  # JWT guard
│   ├── charts/
│   │   ├── SkillGapChart.jsx   # Bar chart with confidence % tooltip
│   │   ├── ProgressDonut.jsx   # Neon donut with glow
│   │   └── ScoreTimeline.jsx   # Area chart with PASS/REVISE thresholds
│   ├── pathway/
│   │   ├── SkillCard.jsx       # Step card with status badge + weak subtopics
│   │   ├── ResourceList.jsx    # Resource rows with type icons
│   │   ├── ReasoningPanel.jsx  # Explainer agent terminal panel
│   │   └── PathwayTimeline.jsx # Vertical timeline with connector
│   ├── graph/
│   │   └── SkillDAGGraph.jsx   # react-flow DAG with custom SkillNode
│   ├── quiz/
│   │   ├── QuizModal.jsx       # Modal orchestrator: quiz → result
│   │   ├── QuizQuestion.jsx    # MCQ with styled option buttons
│   │   └── QuizResult.jsx      # PASS/REVISE/RETRY result + adaptive log
│   ├── chat/
│   │   └── MentorChat.jsx      # Terminal-style chat with typing indicator
│   └── upload/
│       ├── ResumeUpload.jsx    # PDF drag-drop zone
│       └── JDInput.jsx         # 3-tab: paste | upload | RemoteOK
└── pages/
    ├── LandingPage.jsx    # Animated particle canvas + features grid
    ├── LoginPage.jsx      # Auth form + demo button
    ├── SignupPage.jsx      # Re-exports from LoginPage
    ├── OnboardingPage.jsx  # 2-step: resume + JD (3 tabs)
    ├── AnalyzingPage.jsx   # SSE stage display + terminal log
    ├── DashboardPage.jsx   # Main hub: stats + gap chart + module card + table + chat
    ├── PathwayPage.jsx     # Timeline / DAG toggle
    ├── TopicPage.jsx       # Resources + reasoning + quiz trigger
    ├── ProgressPage.jsx    # Charts + radar + quiz history table
    ├── MentorChatPage.jsx  # Full-page chat with context sidebar
    └── NotFoundPage.jsx    # Glitch 404
```

## Design System

| Token | Value |
|---|---|
| `--neon-cyan` | `#00f5ff` |
| `--neon-blue` | `#0066ff` |
| `--neon-purple` | `#8b00ff` |
| `--neon-green` | `#00ff88` |
| `--dark-base` | `#020817` |
| `--dark-card` | `#060e1f` |
| Font Display | Orbitron |
| Font Body | Rajdhani |
| Font Mono | JetBrains Mono |

### CSS Classes
- `.glass-card` — dark glass with border
- `.glass-card-cyan` — cyan glow border variant
- `.btn-neon-solid` — gradient fill button
- `.btn-neon-cyan` — outlined cyan button
- `.neon-text-cyan` — cyan with text-shadow glow
- `.terminal-panel` — dark monospace panel
- `.neon-input` — dark input with focus glow
- `.badge-pass` / `.badge-revise` / `.badge-retry` / `.badge-active` / `.badge-locked`

## Environment Variables

```env
VITE_API_URL=http://localhost:8000
```

## Backend Integration

All API calls use `src/lib/api.js` (Axios instance with JWT interceptor):

| Endpoint | Description |
|---|---|
| `POST /auth/login` | Login → `{ user, token }` |
| `POST /auth/register` | Signup → `{ user, token }` |
| `POST /analyze` | Start analysis → `{ job_id }` |
| `GET /analyze/stream/:job_id` | SSE stream → stages |
| `GET /pathway/:user_id` | Get pathway |
| `POST /chat` | Mentor chat → `{ reply }` |
| `POST /quiz/:step_id/submit` | Submit quiz → `{ action, score }` |

---

*ARTPARK CodeForge Hackathon · Team of 3 · Final Winning Build*
