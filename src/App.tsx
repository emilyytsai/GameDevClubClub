import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';

import Home from './pages/Home';
import Contact from './pages/Contact';
import Jam from './pages/Jam';

const App = () => {
  return (
    <>
      <Router>
      <Navbar />
      <div style={{ padding: '2rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact-us" element={<Contact />} />
          <Route path="/jam" element={<Jam />} />
        </Routes>
      </div>
      </Router>
    </>

  );
};

export default App;
