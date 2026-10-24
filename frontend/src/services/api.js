import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://spl-auction-2026.onrender.com';
const STORAGE_KEY = 'spl_auction_db_v2';

// Set up Axios instance with a strict 3.5s timeout
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3500,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Initial Database State
const DEFAULT_TEAMS = [
  {
    team_code: 'VK',
    team_name: 'Balindra Bulls',
    captain_name: 'Shrivatsa',
    initial_purse: 100.0,
    remaining_purse: 64.0,
  },
  {
    team_code: 'MS',
    team_name: 'Golden Lions',
    captain_name: 'Shreekar',
    initial_purse: 100.0,
    remaining_purse: 70.0,
  },
  {
    team_code: 'RS',
    team_name: 'Eagle Warriors',
    captain_name: 'Sujith',
    initial_purse: 100.0,
    remaining_purse: 70.0,
  },
  {
    team_code: 'KL',
    team_name: 'Royal Mavericks',
    captain_name: 'Samarth',
    initial_purse: 100.0,
    remaining_purse: 70.0,
  },
];

const DEFAULT_RETENTIONS = [
  { id: 'ret_vk_1', team_code: 'VK', player_name: 'Shrivatsa S J', amount: 18.0 },
  { id: 'ret_vk_2', team_code: 'VK', player_name: 'Anirudh Ashrith', amount: 12.0 },
  { id: 'ret_vk_3', team_code: 'VK', player_name: 'Adhokshaja K', amount: 6.0 },
  { id: 'ret_ms_1', team_code: 'MS', player_name: 'Shreekar', amount: 18.0 },
  { id: 'ret_ms_2', team_code: 'MS', player_name: 'Sridhar Bhat', amount: 12.0 },
  { id: 'ret_rs_1', team_code: 'RS', player_name: 'Sujith', amount: 18.0 },
  { id: 'ret_rs_2', team_code: 'RS', player_name: 'Venkatesh Hegde', amount: 12.0 },
  { id: 'ret_kl_1', team_code: 'KL', player_name: 'Samarth Joshi', amount: 18.0 },
  { id: 'ret_kl_2', team_code: 'KL', player_name: 'Abhishek G', amount: 12.0 },
];

class LocalStorageEngine {
  constructor() {
    this.init();
  }

  init(forceReset = false) {
    if (forceReset || !localStorage.getItem(STORAGE_KEY)) {
      const data = {
        teams: DEFAULT_TEAMS,
        retentions: DEFAULT_RETENTIONS,
        bids: [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return this.init(true);
    }
  }

  getData() {
    return this.init();
  }

  saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  recalculatePurse(data, teamCode) {
    const team = data.teams.find((t) => t.team_code === teamCode);
    if (!team) return;

    const teamRetentions = data.retentions.filter((r) => r.team_code === teamCode);
    const teamBids = data.bids.filter((b) => b.team_code === teamCode);

    const totalRetentions = teamRetentions.reduce((sum, r) => sum + r.amount, 0);
    const totalBids = teamBids.reduce((sum, b) => sum + b.bid_amount, 0);

    team.remaining_purse = Math.max(0, team.initial_purse - totalRetentions - totalBids);
  }

  getAllTeams() {
    const data = this.getData();
    data.teams.forEach((team) => this.recalculatePurse(data, team.team_code));
    this.saveData(data);
    return data.teams;
  }

  getTeamDetails(teamCode) {
    const code = teamCode.toUpperCase();
    const data = this.getData();
    const team = data.teams.find((t) => t.team_code === code);
    if (!team) {
      throw { response: { status: 404, data: { detail: `Team ${code} not found` } } };
    }

    this.recalculatePurse(data, code);
    this.saveData(data);

    const retentions = data.retentions.filter((r) => r.team_code === code);
    const bids = data.bids
      .filter((b) => b.team_code === code)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return {
      team_code: team.team_code,
      team_name: team.team_name,
      captain_name: team.captain_name,
      initial_purse: team.initial_purse,
      remaining_purse: team.remaining_purse,
      retentions,
      bids,
    };
  }

  addBid(bidData) {
    const code = bidData.team_code.toUpperCase();
    const playerName = bidData.player_name.trim();
    const bidAmount = parseFloat(bidData.bid_amount);

    if (!playerName) {
      throw { response: { status: 400, data: { detail: 'Player name cannot be empty' } } };
    }
    if (isNaN(bidAmount) || bidAmount <= 0) {
      throw { response: { status: 400, data: { detail: 'Bid amount must be a positive number' } } };
    }

    const data = this.getData();
    const team = data.teams.find((t) => t.team_code === code);
    if (!team) {
      throw { response: { status: 404, data: { detail: `Team ${code} not found` } } };
    }

    this.recalculatePurse(data, code);

    if (bidAmount > team.remaining_purse) {
      throw {
        response: {
          status: 400,
          data: {
            detail: `Insufficient purse! Bid amount (${bidAmount} Cr) exceeds remaining purse (${team.remaining_purse.toFixed(
              2
            )} Cr)`,
          },
        },
      };
    }

    const existingRetention = data.retentions.find(
      (r) => r.team_code === code && r.player_name.toLowerCase() === playerName.toLowerCase()
    );
    if (existingRetention) {
      throw {
        response: {
          status: 400,
          data: { detail: `${playerName} is already a retention player for this team` },
        },
      };
    }

    const existingBid = data.bids.find(
      (b) => b.team_code === code && b.player_name.toLowerCase() === playerName.toLowerCase()
    );
    if (existingBid) {
      throw {
        response: {
          status: 400,
          data: { detail: `${playerName} has already been auctioned to this team` },
        },
      };
    }

    const newBid = {
      id: 'bid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      team_code: code,
      player_name: playerName,
      bid_amount: bidAmount,
      player_role: bidData.player_role || 'Batsman',
      created_at: new Date().toISOString(),
    };

    data.bids.push(newBid);
    this.recalculatePurse(data, code);
    this.saveData(data);

    return {
      success: true,
      message: `Successfully added ${playerName} to ${team.team_name} for ${bidAmount} Cr`,
      bid: newBid,
      remaining_purse: team.remaining_purse,
    };
  }

  deleteBid(bidId) {
    const data = this.getData();
    const bidIndex = data.bids.findIndex((b) => b.id === bidId);
    if (bidIndex === -1) {
      throw { response: { status: 404, data: { detail: 'Bid not found' } } };
    }

    const bid = data.bids[bidIndex];
    data.bids.splice(bidIndex, 1);
    this.recalculatePurse(data, bid.team_code);
    this.saveData(data);

    return { success: true, message: 'Bid deleted and purse restored' };
  }

  updateBid(bidId, bidData) {
    const newPlayerName = bidData.player_name.trim();
    const newBidAmount = parseFloat(bidData.bid_amount);

    if (!newPlayerName) {
      throw { response: { status: 400, data: { detail: 'Player name cannot be empty' } } };
    }
    if (isNaN(newBidAmount) || newBidAmount <= 0) {
      throw { response: { status: 400, data: { detail: 'Bid amount must be a positive number' } } };
    }

    const data = this.getData();
    const bid = data.bids.find((b) => b.id === bidId);
    if (!bid) {
      throw { response: { status: 404, data: { detail: 'Bid not found' } } };
    }

    const team = data.teams.find((t) => t.team_code === bid.team_code);
    const amountDiff = newBidAmount - bid.bid_amount;

    if (amountDiff > team.remaining_purse) {
      throw {
        response: {
          status: 400,
          data: {
            detail: `Insufficient purse! Additional amount (${amountDiff.toFixed(
              2
            )} Cr) exceeds remaining purse (${team.remaining_purse.toFixed(2)} Cr)`,
          },
        },
      };
    }

    bid.player_name = newPlayerName;
    bid.bid_amount = newBidAmount;
    if (bidData.player_role) {
      bid.player_role = bidData.player_role;
    }

    this.recalculatePurse(data, bid.team_code);
    this.saveData(data);

    return {
      success: true,
      message: 'Bid updated successfully',
      remaining_purse: team.remaining_purse,
    };
  }

  addRetention(retentionData) {
    const code = retentionData.team_code.toUpperCase();
    const playerName = retentionData.player_name.trim();
    const amount = parseFloat(retentionData.amount);

    if (!playerName) {
      throw { response: { status: 400, data: { detail: 'Player name cannot be empty' } } };
    }
    if (isNaN(amount) || amount <= 0) {
      throw { response: { status: 400, data: { detail: 'Amount must be a positive number' } } };
    }

    const data = this.getData();
    const team = data.teams.find((t) => t.team_code === code);
    if (!team) {
      throw { response: { status: 404, data: { detail: `Team ${code} not found` } } };
    }

    this.recalculatePurse(data, code);

    if (amount > team.remaining_purse) {
      throw {
        response: {
          status: 400,
          data: {
            detail: `Insufficient purse! Amount (${amount} Cr) exceeds remaining purse (${team.remaining_purse.toFixed(
              2
            )} Cr)`,
          },
        },
      };
    }

    const existing = data.retentions.find(
      (r) => r.team_code === code && r.player_name.toLowerCase() === playerName.toLowerCase()
    );
    if (existing) {
      throw {
        response: {
          status: 400,
          data: { detail: `${playerName} is already a retention player` },
        },
      };
    }

    const newRetention = {
      id: 'ret_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      team_code: code,
      player_name: playerName,
      amount,
    };

    data.retentions.push(newRetention);
    this.recalculatePurse(data, code);
    this.saveData(data);

    return {
      success: true,
      message: `Successfully added ${playerName} as retention for ${amount} Cr`,
      retention: newRetention,
      remaining_purse: team.remaining_purse,
    };
  }

  updateRetention(retentionId, retentionData) {
    const newPlayerName = retentionData.player_name.trim();
    const newAmount = parseFloat(retentionData.amount);

    if (!newPlayerName) {
      throw { response: { status: 400, data: { detail: 'Player name cannot be empty' } } };
    }
    if (isNaN(newAmount) || newAmount <= 0) {
      throw { response: { status: 400, data: { detail: 'Amount must be a positive number' } } };
    }

    const data = this.getData();
    const retention = data.retentions.find((r) => r.id === retentionId);
    if (!retention) {
      throw { response: { status: 404, data: { detail: 'Retention not found' } } };
    }

    const team = data.teams.find((t) => t.team_code === retention.team_code);
    const amountDiff = newAmount - retention.amount;

    if (amountDiff > team.remaining_purse) {
      throw {
        response: {
          status: 400,
          data: {
            detail: `Insufficient purse! Additional amount (${amountDiff.toFixed(
              2
            )} Cr) exceeds remaining purse (${team.remaining_purse.toFixed(2)} Cr)`,
          },
        },
      };
    }

    retention.player_name = newPlayerName;
    retention.amount = newAmount;

    this.recalculatePurse(data, retention.team_code);
    this.saveData(data);

    return {
      success: true,
      message: 'Retention updated successfully',
      remaining_purse: team.remaining_purse,
    };
  }

  deleteRetention(retentionId) {
    const data = this.getData();
    const retIndex = data.retentions.findIndex((r) => r.id === retentionId);
    if (retIndex === -1) {
      throw { response: { status: 404, data: { detail: 'Retention not found' } } };
    }

    const retention = data.retentions[retIndex];
    data.retentions.splice(retIndex, 1);
    this.recalculatePurse(data, retention.team_code);
    this.saveData(data);

    return { success: true, message: 'Retention deleted and purse restored' };
  }

  getAuctionStats() {
    const data = this.getData();
    const totalBids = data.bids.length;
    const totalSpent = data.bids.reduce((sum, b) => sum + b.bid_amount, 0);

    const teams = data.teams.map((team) => {
      this.recalculatePurse(data, team.team_code);
      const bidCount = data.bids.filter((b) => b.team_code === team.team_code).length;
      const retentionCount = data.retentions.filter((r) => r.team_code === team.team_code).length;
      return {
        team_code: team.team_code,
        team_name: team.team_name,
        remaining_purse: team.remaining_purse,
        players_bought: bidCount,
        retention_count: retentionCount,
        total_players: bidCount + retentionCount,
      };
    });

    return {
      total_bids: totalBids,
      total_spent: totalSpent,
      teams,
    };
  }

  resetDatabase() {
    this.init(true);
    return { success: true, message: 'Database reset successfully' };
  }
}

const localStorageDB = new LocalStorageEngine();

// State to track if system is operating in fallback mode
let isFallbackMode = false;

export const getIsFallbackMode = () => isFallbackMode;

// Helper to execute API call with instant local storage fallback on timeout/error
async function executeWithFallback(apiCall, fallbackCall) {
  if (isFallbackMode) {
    return fallbackCall();
  }
  try {
    const res = await apiCall();
    return res.data;
  } catch (error) {
    // If request failed (timeout, network error, server sleeping or 5xx)
    console.warn('Backend service unavailable or slow, switching seamlessly to Fast Local Mode:', error.message);
    isFallbackMode = true;
    return fallbackCall();
  }
}

// Teams API
export const getAllTeams = async () => {
  return executeWithFallback(
    () => api.get('/api/teams'),
    () => localStorageDB.getAllTeams()
  );
};

export const getTeamDetails = async (teamCode) => {
  return executeWithFallback(
    () => api.get(`/api/teams/${teamCode}`),
    () => localStorageDB.getTeamDetails(teamCode)
  );
};

// Bids API
export const addBid = async (bidData) => {
  return executeWithFallback(
    () => api.post('/api/bids', bidData),
    () => localStorageDB.addBid(bidData)
  );
};

export const getTeamBids = async (teamCode) => {
  return executeWithFallback(
    () => api.get(`/api/bids/${teamCode}`),
    () => localStorageDB.getTeamDetails(teamCode).bids
  );
};

export const deleteBid = async (bidId) => {
  return executeWithFallback(
    () => api.delete(`/api/bids/${bidId}`),
    () => localStorageDB.deleteBid(bidId)
  );
};

export const updateBid = async (bidId, bidData) => {
  return executeWithFallback(
    () => api.put(`/api/bids/${bidId}`, bidData),
    () => localStorageDB.updateBid(bidId, bidData)
  );
};

// Retentions API
export const addRetention = async (retentionData) => {
  return executeWithFallback(
    () => api.post('/api/retentions', retentionData),
    () => localStorageDB.addRetention(retentionData)
  );
};

export const updateRetention = async (retentionId, retentionData) => {
  return executeWithFallback(
    () => api.put(`/api/retentions/${retentionId}`, retentionData),
    () => localStorageDB.updateRetention(retentionId, retentionData)
  );
};

export const deleteRetention = async (retentionId) => {
  return executeWithFallback(
    () => api.delete(`/api/retentions/${retentionId}`),
    () => localStorageDB.deleteRetention(retentionId)
  );
};

// Stats API
export const getAuctionStats = async () => {
  return executeWithFallback(
    () => api.get('/api/stats'),
    () => localStorageDB.getAuctionStats()
  );
};

// Reset API (for testing)
export const resetDatabase = async () => {
  return executeWithFallback(
    () => api.post('/api/reset'),
    () => localStorageDB.resetDatabase()
  );
};

export default api;
