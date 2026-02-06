from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from database import connect_db, close_db, get_db
from models import (
    Team, TeamResponse, BidCreate, BidResponse, 
    Retention, Bid, ErrorResponse, RetentionUpdate, RetentionResponse, RetentionCreate
)
from initial_data import TEAMS_DATA, RETENTIONS_DATA, RETENTION_TOTALS

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    await initialize_data()
    yield
    # Shutdown
    await close_db()

app = FastAPI(
    title="SPL 2026 Season-2 Auction API",
    description="API for managing SPL 2026 Season-2 player auction",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def initialize_data():
    """Initialize database with teams and retentions if empty"""
    db = get_db()
    
    # Check if teams already exist
    teams_count = await db.teams.count_documents({})
    
    if teams_count == 0:
        print("Initializing database with teams and retentions...")
        
        # Insert teams with retention-adjusted purse
        for team in TEAMS_DATA:
            team_code = team["team_code"]
            retention_total = RETENTION_TOTALS.get(team_code, 0)
            team["remaining_purse"] = team["initial_purse"] - retention_total
            await db.teams.insert_one(team)
        
        # Insert retentions
        for retention in RETENTIONS_DATA:
            await db.retentions.insert_one(retention)
        
        print("Database initialized successfully!")
    else:
        print("Database already initialized.")

# ============== API ENDPOINTS ==============

@app.get("/")
async def root():
    return {"message": "SPL 2026 Season-2 Auction API", "status": "running"}

@app.get("/api/teams", response_model=List[Team])
async def get_all_teams():
    """Get all teams with their current purse"""
    db = get_db()
    teams = []
    async for team in db.teams.find():
        team["id"] = str(team["_id"])
        del team["_id"]
        teams.append(Team(**team))
    return teams

@app.get("/api/teams/{team_code}", response_model=TeamResponse)
async def get_team_details(team_code: str):
    """Get complete team details including retentions and bids"""
    db = get_db()
    
    # Get team
    team = await db.teams.find_one({"team_code": team_code.upper()})
    if not team:
        raise HTTPException(status_code=404, detail=f"Team {team_code} not found")
    
    team["id"] = str(team["_id"])
    del team["_id"]
    
    # Get retentions
    retentions = []
    async for retention in db.retentions.find({"team_code": team_code.upper()}):
        retention["id"] = str(retention["_id"])
        del retention["_id"]
        retentions.append(Retention(**retention))
    
    # Get bids
    bids = []
    async for bid in db.bids.find({"team_code": team_code.upper()}).sort("created_at", -1):
        bid["id"] = str(bid["_id"])
        del bid["_id"]
        bids.append(Bid(**bid))
    
    return TeamResponse(
        team_code=team["team_code"],
        team_name=team["team_name"],
        captain_name=team["captain_name"],
        initial_purse=team["initial_purse"],
        remaining_purse=team["remaining_purse"],
        retentions=retentions,
        bids=bids
    )

@app.post("/api/bids", response_model=BidResponse)
async def add_bid(bid_data: BidCreate):
    """Add a new bid for a player"""
    db = get_db()
    
    team_code = bid_data.team_code.upper()
    player_name = bid_data.player_name.strip()
    bid_amount = bid_data.bid_amount
    
    # Validation 1: Player name cannot be empty
    if not player_name:
        raise HTTPException(status_code=400, detail="Player name cannot be empty")
    
    # Validation 2: Bid amount must be positive
    if bid_amount <= 0:
        raise HTTPException(status_code=400, detail="Bid amount must be a positive number")
    
    # Get team
    team = await db.teams.find_one({"team_code": team_code})
    if not team:
        raise HTTPException(status_code=404, detail=f"Team {team_code} not found")
    
    # Validation 3: Bid amount cannot exceed remaining purse
    if bid_amount > team["remaining_purse"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient purse! Bid amount ({bid_amount} Cr) exceeds remaining purse ({team['remaining_purse']} Cr)"
        )
    
    # Validation 4: Check if player is already a retention for this team
    existing_retention = await db.retentions.find_one({
        "team_code": team_code,
        "player_name": {"$regex": f"^{player_name}$", "$options": "i"}
    })
    if existing_retention:
        raise HTTPException(
            status_code=400, 
            detail=f"{player_name} is already a retention player for this team"
        )
    
    # Validation 5: Check if player is already auctioned to this team
    existing_bid = await db.bids.find_one({
        "team_code": team_code,
        "player_name": {"$regex": f"^{player_name}$", "$options": "i"}
    })
    if existing_bid:
        raise HTTPException(
            status_code=400, 
            detail=f"{player_name} has already been auctioned to this team"
        )
    
    # Create bid
    new_bid = {
        "team_code": team_code,
        "player_name": player_name,
        "bid_amount": bid_amount,
        "player_role": bid_data.player_role or "Batsman",
        "created_at": datetime.utcnow()
    }
    
    result = await db.bids.insert_one(new_bid)
    
    # Update team's remaining purse
    new_remaining_purse = team["remaining_purse"] - bid_amount
    await db.teams.update_one(
        {"team_code": team_code},
        {"$set": {"remaining_purse": new_remaining_purse}}
    )
    
    new_bid["id"] = str(result.inserted_id)
    
    return BidResponse(
        success=True,
        message=f"Successfully added {player_name} to {team['team_name']} for {bid_amount} Cr",
        bid=Bid(**new_bid),
        remaining_purse=new_remaining_purse
    )

@app.get("/api/bids/{team_code}", response_model=List[Bid])
async def get_team_bids(team_code: str):
    """Get all bids for a specific team"""
    db = get_db()
    
    bids = []
    async for bid in db.bids.find({"team_code": team_code.upper()}).sort("created_at", -1):
        bid["id"] = str(bid["_id"])
        del bid["_id"]
        bids.append(Bid(**bid))
    
    return bids

@app.delete("/api/bids/{bid_id}")
async def delete_bid(bid_id: str):
    """Delete a bid and restore purse (for corrections)"""
    from bson import ObjectId
    
    db = get_db()
    
    # Find the bid
    bid = await db.bids.find_one({"_id": ObjectId(bid_id)})
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    
    # Restore purse
    await db.teams.update_one(
        {"team_code": bid["team_code"]},
        {"$inc": {"remaining_purse": bid["bid_amount"]}}
    )
    
    # Delete bid
    await db.bids.delete_one({"_id": ObjectId(bid_id)})
    
    return {"success": True, "message": "Bid deleted and purse restored"}

class BidUpdate(BaseModel):
    player_name: str
    bid_amount: float
    player_role: Optional[str] = None

@app.put("/api/bids/{bid_id}")
async def update_bid(bid_id: str, bid_data: BidUpdate):
    """Update an existing bid (player name, amount, and/or role)"""
    from bson import ObjectId
    
    db = get_db()
    
    new_player_name = bid_data.player_name.strip()
    new_bid_amount = bid_data.bid_amount
    new_player_role = bid_data.player_role
    
    # Validation
    if not new_player_name:
        raise HTTPException(status_code=400, detail="Player name cannot be empty")
    
    if new_bid_amount <= 0:
        raise HTTPException(status_code=400, detail="Bid amount must be a positive number")
    
    # Find the existing bid
    existing_bid = await db.bids.find_one({"_id": ObjectId(bid_id)})
    if not existing_bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    
    team_code = existing_bid["team_code"]
    old_amount = existing_bid["bid_amount"]
    
    # Get team
    team = await db.teams.find_one({"team_code": team_code})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Calculate purse difference
    amount_diff = new_bid_amount - old_amount
    
    # Check if new amount is valid
    if amount_diff > team["remaining_purse"]:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient purse! Additional amount ({amount_diff} Cr) exceeds remaining purse ({team['remaining_purse']} Cr)"
        )
    
    # Update bid
    update_data = {"player_name": new_player_name, "bid_amount": new_bid_amount}
    if new_player_role:
        update_data["player_role"] = new_player_role
    
    await db.bids.update_one(
        {"_id": ObjectId(bid_id)},
        {"$set": update_data}
    )
    
    # Update team purse
    new_remaining_purse = team["remaining_purse"] - amount_diff
    await db.teams.update_one(
        {"team_code": team_code},
        {"$set": {"remaining_purse": new_remaining_purse}}
    )
    
    return {
        "success": True,
        "message": f"Bid updated successfully",
        "remaining_purse": new_remaining_purse
    }

# ============== RETENTION ENDPOINTS ==============

@app.post("/api/retentions", response_model=RetentionResponse)
async def add_retention(retention_data: RetentionCreate):
    """Add a new retention player"""
    from bson import ObjectId
    db = get_db()
    
    team_code = retention_data.team_code.upper()
    player_name = retention_data.player_name.strip()
    amount = retention_data.amount
    
    # Validation
    if not player_name:
        raise HTTPException(status_code=400, detail="Player name cannot be empty")
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be a positive number")
    
    # Get team
    team = await db.teams.find_one({"team_code": team_code})
    if not team:
        raise HTTPException(status_code=404, detail=f"Team {team_code} not found")
    
    # Check if amount exceeds remaining purse
    if amount > team["remaining_purse"]:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient purse! Amount ({amount} Cr) exceeds remaining purse ({team['remaining_purse']} Cr)"
        )
    
    # Check if player already exists as retention
    existing = await db.retentions.find_one({
        "team_code": team_code,
        "player_name": {"$regex": f"^{player_name}$", "$options": "i"}
    })
    if existing:
        raise HTTPException(status_code=400, detail=f"{player_name} is already a retention player")
    
    # Create retention
    new_retention = {
        "team_code": team_code,
        "player_name": player_name,
        "amount": amount
    }
    
    result = await db.retentions.insert_one(new_retention)
    
    # Update team's remaining purse
    new_remaining_purse = team["remaining_purse"] - amount
    await db.teams.update_one(
        {"team_code": team_code},
        {"$set": {"remaining_purse": new_remaining_purse}}
    )
    
    new_retention["id"] = str(result.inserted_id)
    
    return RetentionResponse(
        success=True,
        message=f"Successfully added {player_name} as retention for {amount} Cr",
        retention=Retention(**new_retention),
        remaining_purse=new_remaining_purse
    )

@app.put("/api/retentions/{retention_id}")
async def update_retention(retention_id: str, retention_data: RetentionUpdate):
    """Update an existing retention player"""
    from bson import ObjectId
    db = get_db()
    
    new_player_name = retention_data.player_name.strip()
    new_amount = retention_data.amount
    
    # Validation
    if not new_player_name:
        raise HTTPException(status_code=400, detail="Player name cannot be empty")
    
    if new_amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be a positive number")
    
    # Find existing retention
    existing = await db.retentions.find_one({"_id": ObjectId(retention_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Retention not found")
    
    team_code = existing["team_code"]
    old_amount = existing["amount"]
    
    # Get team
    team = await db.teams.find_one({"team_code": team_code})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Calculate purse difference
    amount_diff = new_amount - old_amount
    
    # Check if new amount is valid
    if amount_diff > team["remaining_purse"]:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient purse! Additional amount ({amount_diff} Cr) exceeds remaining purse ({team['remaining_purse']} Cr)"
        )
    
    # Update retention
    await db.retentions.update_one(
        {"_id": ObjectId(retention_id)},
        {"$set": {"player_name": new_player_name, "amount": new_amount}}
    )
    
    # Update team purse
    new_remaining_purse = team["remaining_purse"] - amount_diff
    await db.teams.update_one(
        {"team_code": team_code},
        {"$set": {"remaining_purse": new_remaining_purse}}
    )
    
    return {
        "success": True,
        "message": "Retention updated successfully",
        "remaining_purse": new_remaining_purse
    }

@app.delete("/api/retentions/{retention_id}")
async def delete_retention(retention_id: str):
    """Delete a retention and restore purse"""
    from bson import ObjectId
    db = get_db()
    
    # Find the retention
    retention = await db.retentions.find_one({"_id": ObjectId(retention_id)})
    if not retention:
        raise HTTPException(status_code=404, detail="Retention not found")
    
    # Restore purse
    await db.teams.update_one(
        {"team_code": retention["team_code"]},
        {"$inc": {"remaining_purse": retention["amount"]}}
    )
    
    # Delete retention
    await db.retentions.delete_one({"_id": ObjectId(retention_id)})
    
    return {"success": True, "message": "Retention deleted and purse restored"}

@app.post("/api/reset")
async def reset_database():
    """Reset the entire database (for testing)"""
    db = get_db()
    
    # Clear all collections
    await db.teams.delete_many({})
    await db.retentions.delete_many({})
    await db.bids.delete_many({})
    
    # Re-initialize
    await initialize_data()
    
    return {"success": True, "message": "Database reset successfully"}

@app.get("/api/stats")
async def get_auction_stats():
    """Get overall auction statistics"""
    db = get_db()
    
    total_bids = await db.bids.count_documents({})
    
    # Calculate total spent
    pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$bid_amount"}}}
    ]
    result = await db.bids.aggregate(pipeline).to_list(1)
    total_spent = result[0]["total"] if result else 0
    
    # Get teams summary
    teams = []
    async for team in db.teams.find():
        bid_count = await db.bids.count_documents({"team_code": team["team_code"]})
        retention_count = await db.retentions.count_documents({"team_code": team["team_code"]})
        teams.append({
            "team_code": team["team_code"],
            "team_name": team["team_name"],
            "remaining_purse": team["remaining_purse"],
            "players_bought": bid_count,
            "retention_count": retention_count,
            "total_players": bid_count + retention_count
        })
    
    return {
        "total_bids": total_bids,
        "total_spent": total_spent,
        "teams": teams
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
