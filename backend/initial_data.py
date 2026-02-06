# Initial data for SPL 2026 Season-2

TEAMS_DATA = [
    {
        "team_code": "VK",
        "team_name": "Virat Kohli",
        "captain_name": "Shrivatsa",
        "initial_purse": 100.0,
        "remaining_purse": 100.0
    },
    {
        "team_code": "MS",
        "team_name": "MS Dhoni",
        "captain_name": "Shreekar",
        "initial_purse": 100.0,
        "remaining_purse": 100.0
    },
    {
        "team_code": "RS",
        "team_name": "Rohit Sharma",
        "captain_name": "Sujith",
        "initial_purse": 100.0,
        "remaining_purse": 100.0
    },
    {
        "team_code": "KL",
        "team_name": "KL Rahul",
        "captain_name": "Samarth",
        "initial_purse": 100.0,
        "remaining_purse": 100.0
    }
]

RETENTIONS_DATA = [
    # Team VK Retentions (Total: 36 Cr)
    {"team_code": "VK", "player_name": "Shrivatsa S J", "amount": 18.0},
    {"team_code": "VK", "player_name": "Anirudh Ashrith", "amount": 12.0},
    {"team_code": "VK", "player_name": "Adhokshaja K", "amount": 6.0},
    
    # Team MS Retentions (Total: 30 Cr)
    {"team_code": "MS", "player_name": "Shreekar", "amount": 18.0},
    {"team_code": "MS", "player_name": "Sridhar Bhat", "amount": 12.0},
    
    # Team RS Retentions (Total: 30 Cr)
    {"team_code": "RS", "player_name": "Sujith", "amount": 18.0},
    {"team_code": "RS", "player_name": "Venkatesh Hegde", "amount": 12.0},
    
    # Team KL Retentions (Total: 30 Cr)
    {"team_code": "KL", "player_name": "Samarth Joshi", "amount": 18.0},
    {"team_code": "KL", "player_name": "Abhishek G", "amount": 12.0},
]

# Retention totals for each team
RETENTION_TOTALS = {
    "VK": 36.0,  # 18 + 12 + 6
    "MS": 30.0,  # 18 + 12
    "RS": 30.0,  # 18 + 12
    "KL": 30.0,  # 18 + 12
}
