import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ShipManagement from './pages/ShipManagement'
import ShipmentManagement from './pages/ShipmentManagement'
import ContainerManagement from './pages/ContainerManagement'
import TrackShipment from './pages/TrackShipment'
import Notifications from './pages/Notifications'
import Users from './pages/Users'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/welcome" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* Public tracking page - works without login */}
            <Route path="/track-public" element={<TrackShipment publicMode />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/ships" element={<ShipManagement />} />
              <Route path="/shipments" element={<ShipmentManagement />} />
              <Route path="/containers" element={<ContainerManagement />} />
              <Route path="/track" element={<TrackShipment />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/users" element={<Users />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
