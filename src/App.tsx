import { HashRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Import from './pages/Import'
import Results from './pages/Results'
import Curriculum from './pages/Curriculum'
import Birthdays from './pages/Birthdays'

export default function App() {
  return (
    <HashRouter>
      <div className="ambient-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/import" element={<Import />} />
            <Route path="/results" element={<Results />} />
            <Route path="/curriculum" element={<Curriculum />} />
            <Route path="/birthdays" element={<Birthdays />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
