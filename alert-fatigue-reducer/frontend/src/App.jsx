import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AlertsPage from './pages/AlertsPage'
import GroupsPage from './pages/GroupsPage'
import SuppressionPage from './pages/SuppressionPage'
import MonitoringPage from './pages/MonitoringPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="suppression" element={<SuppressionPage />} />
        <Route path="monitoring" element={<MonitoringPage />} />
      </Route>
    </Routes>
  )
}
