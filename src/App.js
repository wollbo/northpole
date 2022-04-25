import React from 'react';
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Market from './pages/Market';
import './App.css';

const App = () => {
  return(
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/market" element={<Market />} />
    </Routes>
  )
};

export default App;
