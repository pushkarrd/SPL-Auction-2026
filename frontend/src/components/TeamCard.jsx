import { useNavigate } from 'react-router-dom';
import { FaUserTie, FaWallet } from 'react-icons/fa';
import './TeamCard.css';

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

const teamShortcuts = {
  VK: 'BB',
  MS: 'GL',
  RS: 'EW',
  KL: 'RM',
};

function TeamCard({ team }) {
  const navigate = useNavigate();
  const colors = teamColors[team.team_code] || teamColors.VK;
  const logo = teamLogos[team.team_code] || '🏏';
  
  const pursePercentage = (team.remaining_purse / 100) * 100;

  return (
    <div 
      className="team-card"
      onClick={() => navigate(`/team/${team.team_code}`)}
      style={{ '--team-gradient': colors.gradient, '--team-primary': colors.primary }}
    >
      <div className="team-card-header" style={{ background: colors.gradient }}>
        <span className="team-logo">{logo}</span>
        <div className="team-badge">{teamShortcuts[team.team_code] || team.team_code}</div>
      </div>
      
      <div className="team-card-body">
        <h3 className="team-name">{team.team_name}</h3>
        
        <div className="team-captain">
          <FaUserTie className="captain-icon" />
          <span>Captain: <strong>{team.captain_name}</strong></span>
        </div>
        
        <div className="team-purse">
          <div className="purse-header">
            <FaWallet className="purse-icon" />
            <span>Remaining Purse</span>
          </div>
          <div className="purse-amount">
            <span className="amount">{team.remaining_purse.toFixed(1)}</span>
            <span className="currency">Cr</span>
          </div>
          <div className="purse-bar">
            <div 
              className="purse-fill" 
              style={{ width: `${pursePercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="team-card-footer">
        <span className="view-team">View Team →</span>
      </div>
    </div>
  );
}

export default TeamCard;
