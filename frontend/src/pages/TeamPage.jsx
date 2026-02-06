import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeamDetails, addBid, deleteBid, updateBid } from '../services/api';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, FaUserTie, FaWallet, FaPlus, FaTrash, 
  FaLock, FaClock, FaRupeeSign, FaEdit, FaTimes, FaSave
} from 'react-icons/fa';
import { GiCricketBat, GiMoneyStack } from 'react-icons/gi';
import { IoMdPerson } from 'react-icons/io';
import './TeamPage.css';

const teamColors = {
  VK: { primary: '#1e40af', secondary: '#3b82f6', gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' },
  MS: { primary: '#ca8a04', secondary: '#facc15', gradient: 'linear-gradient(135deg, #ca8a04 0%, #facc15 100%)' },
  RS: { primary: '#047857', secondary: '#10b981', gradient: 'linear-gradient(135deg, #047857 0%, #10b981 100%)' },
  KL: { primary: '#b91c1c', secondary: '#f87171', gradient: 'linear-gradient(135deg, #b91c1c 0%, #f87171 100%)' },
};

const teamLogos = {
  VK: '👑',
  MS: '🦁',
  RS: '🦅',
  KL: '🔥',
};

const PLAYER_ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Keeper'];
const AMOUNT_UNITS = [
  { label: 'Cr', value: 'cr', multiplier: 1 },
  { label: 'Lakh', value: 'lakh', multiplier: 0.01 },
  { label: 'Thousand', value: 'thousand', multiplier: 0.0001 }
];

function TeamPage() {
  const { teamCode } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [playerRole, setPlayerRole] = useState('Batsman');
  const [amountUnit, setAmountUnit] = useState('cr');
  const [submitting, setSubmitting] = useState(false);
  
  // Edit state
  const [editingBid, setEditingBid] = useState(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editBidAmount, setEditBidAmount] = useState('');
  const [editPlayerRole, setEditPlayerRole] = useState('Batsman');
  const [editAmountUnit, setEditAmountUnit] = useState('cr');

  const colors = teamColors[teamCode?.toUpperCase()] || teamColors.VK;
  const logo = teamLogos[teamCode?.toUpperCase()] || '🏏';

  useEffect(() => {
    fetchTeamData();
  }, [teamCode]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const data = await getTeamDetails(teamCode);
      setTeam(data);
    } catch (error) {
      console.error('Error fetching team:', error);
      toast.error('Failed to fetch team data');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBid = async (e) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      toast.error('Please enter player name');
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
    
    if (amountInCr > team.remaining_purse) {
      toast.error(`Insufficient purse! Only ${team.remaining_purse.toFixed(2)} Cr available`);
      return;
    }

    try {
      setSubmitting(true);
      const result = await addBid({
        team_code: teamCode.toUpperCase(),
        player_name: playerName.trim(),
        bid_amount: amountInCr,
        player_role: playerRole
      });
      
      toast.success(result.message);
      setPlayerName('');
      setBidAmount('');
      setPlayerRole('Batsman');
      setAmountUnit('cr');
      fetchTeamData();
    } catch (error) {
      console.error('Error adding bid:', error);
      toast.error(error.response?.data?.detail || 'Failed to add bid');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBid = async (bidId, playerName, amount) => {
    if (!window.confirm(`Delete bid for ${playerName} (${amount} Cr)?`)) {
      return;
    }

    try {
      await deleteBid(bidId);
      toast.success(`Bid for ${playerName} deleted. Purse restored!`);
      fetchTeamData();
    } catch (error) {
      console.error('Error deleting bid:', error);
      toast.error('Failed to delete bid');
    }
  };

  const handleEditClick = (bid) => {
    setEditingBid(bid.id);
    setEditPlayerName(bid.player_name);
    setEditBidAmount(bid.bid_amount.toString());
    setEditPlayerRole(bid.player_role || 'Batsman');
    setEditAmountUnit('cr');
  };

  const handleCancelEdit = () => {
    setEditingBid(null);
    setEditPlayerName('');
    setEditBidAmount('');
    setEditPlayerRole('Batsman');
    setEditAmountUnit('cr');
  };

  const handleSaveEdit = async (bidId) => {
    if (!editPlayerName.trim()) {
      toast.error('Player name cannot be empty');
      return;
    }

    const inputAmount = parseFloat(editBidAmount);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    // Convert amount to Cr based on selected unit
    const unitConfig = AMOUNT_UNITS.find(u => u.value === editAmountUnit);
    const amountInCr = inputAmount * unitConfig.multiplier;

    try {
      setSubmitting(true);
      await updateBid(bidId, {
        player_name: editPlayerName.trim(),
        bid_amount: amountInCr,
        player_role: editPlayerRole
      });
      toast.success('Bid updated successfully!');
      setEditingBid(null);
      setEditPlayerRole('Batsman');
      setEditAmountUnit('cr');
      fetchTeamData();
    } catch (error) {
      console.error('Error updating bid:', error);
      toast.error(error.response?.data?.detail || 'Failed to update bid');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format amount to show in most readable unit
  const formatAmount = (amountInCr) => {
    if (amountInCr >= 1) {
      return `${amountInCr.toFixed(2)} Cr`;
    } else if (amountInCr >= 0.01) {
      return `${(amountInCr * 100).toFixed(2)} Lakh`;
    } else {
      return `${(amountInCr * 10000).toFixed(0)} K`;
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading team data...</p>
      </div>
    );
  }

  if (!team) {
    return null;
  }

  const totalRetention = team.retentions.reduce((sum, r) => sum + r.amount, 0);
  const totalBids = team.bids.reduce((sum, b) => sum + b.bid_amount, 0);
  const totalSpent = totalRetention + totalBids;

  return (
    <div className="team-page" style={{ '--team-primary': colors.primary, '--team-gradient': colors.gradient }}>
      {/* Back Button */}
      <button className="back-btn" onClick={() => navigate('/')}>
        <FaArrowLeft />
        <span>Back to Teams</span>
      </button>

      {/* Team Header */}
      <section className="team-header">
        <div className="team-header-bg" style={{ background: colors.gradient }}></div>
        <div className="team-header-content">
          <div className="team-info">
            <div className="team-logo-large">{logo}</div>
            <div className="team-details">
              <span className="team-badge">{teamCode?.toUpperCase()}</span>
              <h1 className="team-name-large">{team.team_name}</h1>
              <div className="team-captain-info">
                <FaUserTie />
                <span>Captain: <strong>{team.captain_name}</strong></span>
              </div>
            </div>
          </div>
          
          <div className="purse-display">
            <div className="purse-header">
              <FaWallet />
              <span>Remaining Purse</span>
            </div>
            <div className="purse-value">
              <span className="amount">{team.remaining_purse.toFixed(1)}</span>
              <span className="currency">Cr</span>
            </div>
            <div className="purse-progress">
              <div 
                className="purse-progress-fill" 
                style={{ width: `${(team.remaining_purse / team.initial_purse) * 100}%` }}
              ></div>
            </div>
            <div className="purse-stats">
              <span>Initial: {team.initial_purse} Cr</span>
              <span>Spent: {totalSpent.toFixed(1)} Cr</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="team-content-grid">
        {/* Left Column - Add Bid Form */}
        <section className="bid-form-section">
          <div className="section-title">
            <GiMoneyStack />
            <h2>Add New Bid</h2>
          </div>
          
          <form className="bid-form" onSubmit={handleAddBid}>
            <div className="input-row">
              <div className="input-group flex-grow">
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
              
              <div className="input-group role-select">
                <label>
                  <GiCricketBat /> Role
                </label>
                <select
                  value={playerRole}
                  onChange={(e) => setPlayerRole(e.target.value)}
                  disabled={submitting}
                  className="role-dropdown"
                >
                  {PLAYER_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="input-group">
              <label>
                <FaRupeeSign /> Bid Amount
              </label>
              <div className="amount-input-row">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter bid amount"
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
              <span className="input-hint">
                Max available: {team.remaining_purse.toFixed(2)} Cr
                {bidAmount && amountUnit && (
                  <span className="converted-amount">
                    {' '}| Entered: {(parseFloat(bidAmount || 0) * AMOUNT_UNITS.find(u => u.value === amountUnit).multiplier).toFixed(4)} Cr
                  </span>
                )}
              </span>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary submit-bid-btn"
              disabled={submitting || !playerName || !bidAmount}
            >
              {submitting ? (
                <>
                  <div className="btn-spinner"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FaPlus />
                  Add Bid
                </>
              )}
            </button>
          </form>
        </section>

        {/* Right Column - Players */}
        <div className="players-section">
          {/* Retention Players */}
          <section className="retention-section">
            <div className="section-title">
              <FaLock />
              <h2>Retention Players</h2>
              <span className="count-badge">{team.retentions.length}</span>
            </div>
            
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player Name</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {team.retentions.map((retention, index) => (
                    <tr key={retention.id || index}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="player-name">
                          <GiCricketBat className="player-icon" />
                          {retention.player_name}
                        </div>
                      </td>
                      <td className="amount-cell">
                        <span className="amount-value">{retention.amount} Cr</span>
                      </td>
                      <td>
                        <span className="status-badge retained">
                          <FaLock /> Retained
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="2"><strong>Total Retention</strong></td>
                    <td className="amount-cell">
                      <strong className="text-accent">{totalRetention} Cr</strong>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Auctioned Players */}
          <section className="auctioned-section">
            <div className="section-title">
              <GiCricketBat />
              <h2>Auctioned Players</h2>
              <span className="count-badge">{team.bids.length}</span>
            </div>
            
            {team.bids.length === 0 ? (
              <div className="empty-state">
                <GiCricketBat className="empty-icon" />
                <p>No players auctioned yet</p>
                <span>Add your first bid using the form</span>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Player Name</th>
                      <th>Role</th>
                      <th>Bid Amount</th>
                      <th>Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.bids.map((bid, index) => (
                      <tr key={bid.id || index} className="bid-row">
                        <td>{index + 1}</td>
                        <td>
                          {editingBid === bid.id ? (
                            <input
                              type="text"
                              className="edit-input"
                              value={editPlayerName}
                              onChange={(e) => setEditPlayerName(e.target.value)}
                              placeholder="Player name"
                            />
                          ) : (
                            <div className="player-name">
                              <GiCricketBat className="player-icon" />
                              {bid.player_name}
                            </div>
                          )}
                        </td>
                        <td>
                          {editingBid === bid.id ? (
                            <select
                              className="edit-select"
                              value={editPlayerRole}
                              onChange={(e) => setEditPlayerRole(e.target.value)}
                            >
                              {PLAYER_ROLES.map(role => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`role-badge ${(bid.player_role || 'Batsman').toLowerCase().replace('-', '')}`}>
                              {bid.player_role || 'Batsman'}
                            </span>
                          )}
                        </td>
                        <td className="amount-cell">
                          {editingBid === bid.id ? (
                            <div className="edit-amount-row">
                              <input
                                type="number"
                                className="edit-input edit-amount"
                                value={editBidAmount}
                                onChange={(e) => setEditBidAmount(e.target.value)}
                                placeholder="Amount"
                                step="0.01"
                                min="0.01"
                              />
                              <select
                                className="edit-unit-select"
                                value={editAmountUnit}
                                onChange={(e) => setEditAmountUnit(e.target.value)}
                              >
                                {AMOUNT_UNITS.map(unit => (
                                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <span className="amount-value">{formatAmount(bid.bid_amount)}</span>
                          )}
                        </td>
                        <td>
                          <div className="time-cell">
                            <FaClock />
                            {formatDate(bid.created_at)}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {editingBid === bid.id ? (
                              <>
                                <button 
                                  className="save-btn"
                                  onClick={() => handleSaveEdit(bid.id)}
                                  disabled={submitting}
                                  title="Save changes"
                                >
                                  <FaSave />
                                </button>
                                <button 
                                  className="cancel-btn"
                                  onClick={handleCancelEdit}
                                  title="Cancel"
                                >
                                  <FaTimes />
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  className="edit-btn"
                                  onClick={() => handleEditClick(bid)}
                                  title="Edit bid"
                                >
                                  <FaEdit />
                                </button>
                                <button 
                                  className="delete-btn"
                                  onClick={() => handleDeleteBid(bid.id, bid.player_name, bid.bid_amount)}
                                  title="Delete bid"
                                >
                                  <FaTrash />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3"><strong>Total Auction Spend</strong></td>
                      <td className="amount-cell">
                        <strong className="text-accent">{totalBids.toFixed(2)} Cr</strong>
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Squad Summary */}
      <section className="squad-summary">
        <h3>Squad Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Retained</span>
            <span className="summary-value">{team.retentions.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Bought</span>
            <span className="summary-value">{team.bids.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Squad</span>
            <span className="summary-value highlight">{team.retentions.length + team.bids.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Spent</span>
            <span className="summary-value">{totalSpent.toFixed(1)} Cr</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Remaining</span>
            <span className="summary-value highlight">{team.remaining_purse.toFixed(1)} Cr</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TeamPage;
