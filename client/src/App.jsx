import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BoardProvider } from './context/BoardContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BoardProvider>
          <Routes>
            {/* Root → redirect to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BoardProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
