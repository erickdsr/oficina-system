import { Navigate, Route, Routes } from "react-router-dom"
import './App.css'
import { useAuth } from './context/auth.context'
import LoginPage from './pages/Login/LoginPage'

function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <span>Dashboard</span>
          <h1>Bem-vindo{user?.name ? `, ${user.name}` : ""}</h1>
        </div>
        <button type="button" onClick={logout}>
          Sair
        </button>
      </header>
    </main>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
