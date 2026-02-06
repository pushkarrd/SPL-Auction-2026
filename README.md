# 🏏 SPL 2026 Season-2 Auction Web App

A modern, real-time auction management system for SPL 2026 Season-2 player auction.

## ✨ Features

- 🏏 Centralized auction management for 4 teams
- 💰 Real-time purse tracking and automatic deduction
- 📊 Persistent data storage with MongoDB Atlas
- 🎨 Modern cricket-themed dark UI
- ✅ Validation to prevent overbidding
- 📝 Quick Bid from home page
- 🔄 Edit/Delete bids functionality
- 💵 Universal amount input (Cr, Lakh, Thousand)
- 🎯 Player role selection (Batsman, Bowler, All-Rounder, Keeper)

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Python FastAPI
- **Database**: MongoDB Atlas (Cloud)
- **Styling**: Custom CSS with Cricket Theme

---

## 📁 Project Structure

```
SPL Auction/
├── backend/                    # Python FastAPI Backend
│   ├── main.py                 # Main API application
│   ├── database.py             # MongoDB connection handler
│   ├── models.py               # Pydantic data models
│   ├── initial_data.py         # Teams & retention seed data
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables (MongoDB URL)
│   └── .env.example            # Example environment file
│
├── frontend/                   # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI Components
│   │   │   ├── Header.jsx      # Navigation header
│   │   │   ├── Header.css
│   │   │   ├── TeamCard.jsx    # Team card component
│   │   │   └── TeamCard.css
│   │   │
│   │   ├── pages/              # Page Components
│   │   │   ├── HomePage.jsx    # Home page with Quick Bid
│   │   │   ├── HomePage.css
│   │   │   ├── TeamPage.jsx    # Team detail & bid management
│   │   │   └── TeamPage.css
│   │   │
│   │   ├── services/           # API Services
│   │   │   └── api.js          # Axios API calls
│   │   │
│   │   ├── App.jsx             # Main App with routing
│   │   ├── main.jsx            # React entry point
│   │   └── index.css           # Global styles
│   │
│   ├── public/                 # Static assets
│   ├── index.html              # HTML template
│   ├── package.json            # NPM dependencies
│   └── vite.config.js          # Vite configuration
│
├── README.md                   # Project documentation
├── .gitignore                  # Git ignore rules
├── setup-backend.bat           # Backend setup script (Windows)
├── setup-frontend.bat          # Frontend setup script (Windows)
├── start-backend.bat           # Backend start script (Windows)
└── start-frontend.bat          # Frontend start script (Windows)
```

---

## 🚀 Setup Instructions

### 1. MongoDB Atlas Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (Free M0 tier)
3. Create a database user with password
4. Get your connection string
5. Update `backend/.env` with your MongoDB URL:
   ```
   MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/spl_auction
   ```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
python main.py
```

✅ Backend runs at: http://localhost:8000

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend runs at: http://localhost:5173

---

## 🏆 Teams

| Code | Team Name    | Captain      | Initial Purse | Retention Cost |
|------|--------------|--------------|---------------|----------------|
| VK   | Virat Kohli  | Vinayak      | 100 Cr        | 30 Cr          |
| MS   | MS Dhoni     | Shlok        | 100 Cr        | 30 Cr          |
| RS   | Rohit Sharma | Tejas        | 100 Cr        | 36 Cr          |
| KL   | KL Rahul     | Samarth      | 100 Cr        | 30 Cr          |

---

## 📡 API Endpoints

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | /api/teams            | Get all teams with purse info  |
| GET    | /api/teams/{code}     | Get team details with bids     |
| POST   | /api/bids             | Add a new bid                  |
| PUT    | /api/bids/{id}        | Update an existing bid         |
| DELETE | /api/bids/{id}        | Delete a bid (restores purse)  |
| GET    | /api/stats            | Get auction statistics         |
| POST   | /api/reset            | Reset database to initial state|

---

## 🎮 Usage

1. **Home Page**: View all teams, stats, and use Quick Bid to add players
2. **Team Page**: Click on any team card to view:
   - Retention players
   - Auctioned players with edit/delete options
   - Add new bids with role selection
3. **Quick Bid**: Add players directly from home page by selecting team, role, and amount

---

## 📝 License

MIT License - Feel free to use and modify for your own projects!
