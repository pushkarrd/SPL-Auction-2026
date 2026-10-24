# SPL 2026 Season-2 Player Auction App

Official web application for managing the SPL 2026 Season-2 Cricket Player Auction.

## Features

- 🏏 **Real-time Team Purse Tracking**: Live calculation of initial, spent, and remaining team purses across 4 competing teams (BB, GL, EW, RM).
- 💰 **Bidding & Retention Management**: Add, edit, and delete player bids and retentions with instant purse adjustments.
- ⚡ **Ultra-Fast Hybrid Service Layer**: Configured with automatic 3.5s timeout and local storage fallback database so the live site (`spl-auction-2026.vercel.app`) loads instantly with zero buffering even if backend server is sleeping.
- 🎨 **Responsive UI**: Sleek dark-mode interface with team color themes, badge indicators, and stat cards.

## Setup & Running Locally

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

## Deployment

Configured for Vercel deployment with single-command build (`npm --prefix frontend run build`).

© 2026 Pushkar R Deshpande. All Rights Reserved.
