from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Team Models
class TeamBase(BaseModel):
    team_code: str
    team_name: str
    captain_name: str
    initial_purse: float = 100.0
    remaining_purse: float

class TeamCreate(TeamBase):
    pass

class Team(TeamBase):
    id: Optional[str] = None
    
    class Config:
        from_attributes = True

# Retention Models
class RetentionBase(BaseModel):
    team_code: str
    player_name: str
    amount: float

class RetentionCreate(RetentionBase):
    pass

class Retention(RetentionBase):
    id: Optional[str] = None
    
    class Config:
        from_attributes = True

# Bid Models
class BidBase(BaseModel):
    team_code: str
    player_name: str
    bid_amount: float
    player_role: Optional[str] = "Batsman"  # Batsman, Bowler, All-Rounder, Keeper

class BidCreate(BidBase):
    pass

class Bid(BidBase):
    id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True

# Response Models
class TeamResponse(BaseModel):
    team_code: str
    team_name: str
    captain_name: str
    initial_purse: float
    remaining_purse: float
    retentions: List[Retention] = []
    bids: List[Bid] = []

class TeamsListResponse(BaseModel):
    teams: List[Team]

class BidResponse(BaseModel):
    success: bool
    message: str
    bid: Optional[Bid] = None
    remaining_purse: Optional[float] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
