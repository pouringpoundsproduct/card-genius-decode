
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Search from './pages/Search';
import CardDetail from './pages/CardDetail';
import NotFound from './pages/NotFound';
import { ComparisonProvider } from './contexts/ComparisonContext';
import './App.css';

function App() {
  return (
    <ComparisonProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<Search />} />
            <Route path="/card/:slug" element={<CardDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </ComparisonProvider>
  );
}

export default App;
