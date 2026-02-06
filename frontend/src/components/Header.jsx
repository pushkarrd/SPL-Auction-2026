import { Link } from 'react-router-dom';
import { GiCricketBat } from 'react-icons/gi';
import { IoMdTrophy } from 'react-icons/io';
import './Header.css';

function Header() {
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
        
        <div className="header-badge">
          <IoMdTrophy className="trophy-icon" />
          <span>LIVE AUCTION</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
