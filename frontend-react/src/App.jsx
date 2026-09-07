import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Servico from './pages/Servico'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/"            element={<Home />} />
      <Route path="/servico/:id" element={<Servico />} />
      <Route path="/admin"       element={<AdminLogin />} />
      <Route path="/admin/painel" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  )
}
