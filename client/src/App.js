import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GameInterface from './components/GameInterface';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<GameInterface />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;