import { Navigate } from 'react-router-dom'
import { auth } from '../lib/api'

export default function ProtectedRoute({ children }) {
  if (!auth.isLogged()) return <Navigate to="/admin" replace />
  return children
}
