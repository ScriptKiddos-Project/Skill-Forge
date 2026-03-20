import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function AppLayout({ children, fullWidth = false }) {
  return (
    <div className="min-h-screen grid-bg" style={{ background: '#020817' }}>
      <Sidebar />
      <Navbar />
      <main className={`ml-14 pt-12 min-h-screen ${fullWidth ? '' : ''}`}>
        {children}
      </main>
    </div>
  )
}
