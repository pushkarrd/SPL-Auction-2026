import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GiCricketBat } from 'react-icons/gi';
import { IoMdTrophy } from 'react-icons/io';
import { FaBolt, FaGlobe, FaSync } from 'react-icons/fa';
import { getIsFallbackMode } from '../services/api';
import './Header.css';

function Header() {
  const [isFallback, setIsFallback] = useState(getIsFallbackMode());

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFallback(getIsFallbackMode());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="header">
      <div className="header-bg"></div>
      <div className="header-content">
        <Link to="/" className="logo">
          <div className="logo-icon">
            <GiCricketBat className="bat-icon" />
          </div>
          <div className="logo-text">
            <span className="logo-title">SPL 2026</span>
            <span className="logo-subtitle">Season 2 • Auction</span>
          </div>
        </Link>
        
        <div className="header-controls">
          <div className={`mode-badge ${isFallback ? 'fast-mode' : 'cloud-mode'}`} title={isFallback ? 'Operating in Fast Standalone Local Mode' : 'Connected to Cloud Backend'}>
            {isFallback ? <FaBolt className="mode-icon" /> : <FaGlobe className="mode-icon" />}
            <span>{isFallback ? 'FAST MODE' : 'CLOUD API'}</span>
          </div>

          <div className="header-badge">
            <IoMdTrophy className="trophy-icon" />
            <span>LIVE AUCTION</span>
          </div>

          <button className="refresh-btn" onClick={handleRefresh} title="Quick Refresh Page">
            <FaSync />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
