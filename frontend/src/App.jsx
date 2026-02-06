import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import TeamPage from './pages/TeamPage'
import Header from './components/Header'

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/team/:teamCode" element={<TeamPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
