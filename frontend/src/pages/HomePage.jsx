import { useState, useEffect } from 'react';
import { getAllTeams, getAuctionStats, addBid } from '../services/api';
import TeamCard from '../components/TeamCard';
import { GiCricketBat, GiMoneyStack, GiTrophyCup } from 'react-icons/gi';
import { FaUsers, FaChartLine, FaPlus, FaRupeeSign } from 'react-icons/fa';
import { IoMdPerson } from 'react-icons/io';
import { toast } from 'react-toastify';
import './HomePage.css';

const PLAYER_ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Keeper'];
const AMOUNT_UNITS = [
  { label: 'Cr', value: 'cr', multiplier: 1 },
  { label: 'Lakh', value: 'lakh', multiplier: 0.01 },
  { label: 'Thousand', value: 'thousand', multiplier: 0.0001 }
];

function HomePage() {
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Quick Bid form state
  const [playerName, setPlayerName] = useState('');
  const [playerRole, setPlayerRole] = useState('Batsman');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [amountUnit, setAmountUnit] = useState('cr');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsData, statsData] = await Promise.all([
        getAllTeams(),
        getAuctionStats()
      ]);
      setTeams(teamsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to connect to server. Make sure the backend is running!');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedTeamPurse = () => {
    if (!selectedTeam) return null;
    const team = teams.find(t => t.team_code === selectedTeam);
    return team ? team.remaining_purse : null;
  };

  const handleQuickBid = async (e) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      toast.error('Please enter player name');
      return;
    }
    
    if (!selectedTeam) {
      toast.error('Please select a team');
      return;
    }
    
    const inputAmount = parseFloat(bidAmount);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }
    
    // Convert amount to Cr based on selected unit
    const unitConfig = AMOUNT_UNITS.find(u => u.value === amountUnit);
    const amountInCr = inputAmount * unitConfig.multiplier;
    
    const teamPurse = getSelectedTeamPurse();
    if (amountInCr > teamPurse) {
      toast.error(`Insufficient purse! ${selectedTeam} only has ${teamPurse.toFixed(2)} Cr available`);
      return;
    }

    try {
      setSubmitting(true);
      const result = await addBid({
        team_code: selectedTeam,
        player_name: playerName.trim(),
        bid_amount: amountInCr,
        player_role: playerRole
      });
      
      toast.success(`${playerName} added to ${selectedTeam} for ${amountInCr.toFixed(2)} Cr!`);
      
      // Reset form
      setPlayerName('');
      setPlayerRole('Batsman');
      setSelectedTeam('');
      setBidAmount('');
      setAmountUnit('cr');
      
      // Refresh data to update team cards
      fetchData();
    } catch (error) {
      console.error('Error adding bid:', error);
      toast.error(error.response?.data?.detail || 'Failed to add bid');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading SPL 2026 Auction...</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <GiTrophyCup />
            <span>Season 2</span>
          </div>
          <h1 className="hero-title">
            SPL 2026
            <span className="hero-subtitle">Player Auction</span>
          </h1>
          <p className="hero-description">
            Welcome to the official SPL 2026 Season-2 Auction System. 
            Track team purses, manage bids, and watch the action unfold in real-time!
          </p>
        </div>
        <div className="hero-decoration">
          <div className="floating-ball ball-1">🏏</div>
          <div className="floating-ball ball-2">🎯</div>
          <div className="floating-ball ball-3">⚡</div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <FaUsers />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.total_bids}</span>
                <span className="stat-label">Players Bought</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon money">
                <GiMoneyStack />
              </div>
              <div className="stat-info">
                <span className="stat-value">{stats.total_spent.toFixed(1)} Cr</span>
                <span className="stat-label">Total Spent</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon chart">
                <FaChartLine />
              </div>
              <div className="stat-info">
                <span className="stat-value">
                  {(400 - stats.teams.reduce((sum, t) => sum + t.remaining_purse, 0)).toFixed(1)} Cr
                </span>
                <span className="stat-label">Budget Used</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon trophy">
                <GiTrophyCup />
              </div>
              <div className="stat-info">
                <span className="stat-value">4</span>
                <span className="stat-label">Teams Competing</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Bid Section */}
      <section className="quick-bid-section">
        <div className="section-header">
          <GiMoneyStack className="section-icon" />
          <h2>Quick Bid</h2>
          <p>Add a player to any team directly from here</p>
        </div>
        
        <form className="quick-bid-form" onSubmit={handleQuickBid}>
          <div className="quick-bid-grid">
            {/* Player Name */}
            <div className="input-group">
              <label>
                <IoMdPerson /> Player Name
              </label>
              <input
                type="text"
                placeholder="Enter player name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                disabled={submitting}
              />
            </div>
            
            {/* Role Selection */}
            <div className="input-group">
              <label>
                <GiCricketBat /> Role
              </label>
              <select
                value={playerRole}
                onChange={(e) => setPlayerRole(e.target.value)}
                disabled={submitting}
                className="quick-bid-select"
              >
                {PLAYER_ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            
            {/* Team Selection */}
            <div className="input-group">
              <label>
                <FaUsers /> Select Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                disabled={submitting}
                className="quick-bid-select"
              >
                <option value="">-- Select Team --</option>
                {teams.map(team => (
                  <option key={team.team_code} value={team.team_code}>
                    {team.team_code} - {team.team_name} ({team.remaining_purse.toFixed(2)} Cr)
                  </option>
                ))}
              </select>
            </div>
            
            {/* Bid Amount */}
            <div className="input-group">
              <label>
                <FaRupeeSign /> Bid Amount
              </label>
              <div className="amount-input-row">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter amount"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  disabled={submitting}
                  className="amount-input"
                />
                <select
                  value={amountUnit}
                  onChange={(e) => setAmountUnit(e.target.value)}
                  disabled={submitting}
                  className="unit-dropdown"
                >
                  {AMOUNT_UNITS.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </div>
              {selectedTeam && (
                <span className="input-hint">
                  Available: {getSelectedTeamPurse()?.toFixed(2)} Cr
                  {bidAmount && (
                    <span className="converted-amount">
                      {' '}| Bid: {(parseFloat(bidAmount || 0) * AMOUNT_UNITS.find(u => u.value === amountUnit).multiplier).toFixed(4)} Cr
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
          
          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary quick-bid-btn"
            disabled={submitting || !playerName || !selectedTeam || !bidAmount}
          >
            {submitting ? (
              <>
                <div className="btn-spinner"></div>
                Processing...
              </>
            ) : (
              <>
                <FaPlus />
                Add Player to Team
              </>
            )}
          </button>
        </form>
      </section>

      {/* Teams Section */}
      <section className="teams-section">
        <div className="section-header">
          <GiCricketBat className="section-icon" />
          <h2>Participating Teams</h2>
          <p>Select a team to view details and manage bids</p>
        </div>
        
        <div className="teams-grid">
          {teams.map((team, index) => (
            <div 
              key={team.team_code} 
              className="team-card-wrapper animate-fadeIn"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <TeamCard team={team} />
            </div>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="info-section">
        <div className="info-card">
          <h3>🎯 Auction Rules</h3>
          <ul>
            <li>Each team starts with <strong>100 Cr</strong> initial purse</li>
            <li>Retention amounts are pre-deducted</li>
            <li>Bids cannot exceed remaining purse</li>
            <li>Same player cannot be bought twice</li>
          </ul>
        </div>
        <div className="info-card">
          <h3>💡 Quick Tips</h3>
          <ul>
            <li>Click on any team card to view details</li>
            <li>Add new bids from the team page</li>
            <li>Track purse updates in real-time</li>
            <li>Use delete option to undo wrong bids</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
