import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DutyLogs from "./pages/DutyLogs";
import Procedures from "./pages/Procedures";
import Reflections from "./pages/Reflections";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/duty-logs"
        element={
          <ProtectedRoute>
            <DutyLogs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/procedures"
        element={
          <ProtectedRoute>
            <Procedures />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reflections"
        element={
          <ProtectedRoute>
            <Reflections />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
