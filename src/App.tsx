import { HashRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Import from './pages/Import'
import Results from './pages/Results'
import Birthdays from './pages/Birthdays'

export default function App() {
  return (
    <HashRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/import" element={<Import />} />
            <Route path="/results" element={<Results />} />
            <Route path="/birthdays" element={<Birthdays />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
