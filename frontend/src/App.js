import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from './components/Profile';
import Tutorials from "./pages/Tutorials";
import TutorialForm from "./pages/TutorialForm";
import TutorialDetail from "./pages/TutorialDetail";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/tutorials" element={<Tutorials />} />
            <Route path="/tutorials/create" element={<TutorialForm />} />
            <Route path="/tutorials/:id" element={<TutorialDetail />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
