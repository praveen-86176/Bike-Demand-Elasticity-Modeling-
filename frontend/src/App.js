import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignIn     from './pages/SignIn';
import SignUp     from './pages/SignUp';
import Dashboard  from './pages/Dashboard';
import TrainModel from './pages/TrainModel';
import PredictDemand from './pages/PredictDemand';
import History    from './pages/History';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('bd_token');
  return token ? children : <Navigate to="/signin" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<Navigate to="/signin" replace />} />
        <Route path="/signin"  element={<SignIn />} />
        <Route path="/signup"  element={<SignUp />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/train"     element={<ProtectedRoute><TrainModel /></ProtectedRoute>} />
        <Route path="/predict"   element={<ProtectedRoute><PredictDemand /></ProtectedRoute>} />
        <Route path="/history"   element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="*"          element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
