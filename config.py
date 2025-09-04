"""Configuration management for the Dune Discord Bot."""

import os
from dotenv import load_dotenv
from typing import Optional

# Load environment variables
load_dotenv()

class Config:
    """Bot configuration settings."""
    
    # Discord Settings
    DISCORD_TOKEN: str = os.getenv('DISCORD_TOKEN', '')
    GUILD_ID: Optional[int] = int(os.getenv('GUILD_ID', 0)) if os.getenv('GUILD_ID') else None
    COMMAND_PREFIX: str = os.getenv('COMMAND_PREFIX', '!')
    
    # Extra-Life Settings
    EXTRALIFE_TEAM_ID: Optional[str] = os.getenv('EXTRALIFE_TEAM_ID')
    EXTRALIFE_PARTICIPANT_ID: Optional[str] = os.getenv('EXTRALIFE_PARTICIPANT_ID')
    EXTRALIFE_API_BASE: str = os.getenv('EXTRALIFE_API_BASE', 'https://www.extra-life.org/api')
    
    # Bot Settings
    DEBUG_MODE: bool = os.getenv('DEBUG_MODE', 'False').lower() == 'true'
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    DATABASE_URL: str = os.getenv('DATABASE_URL', 'sqlite:///bot_data.db')
    
    # Data Paths
    DATA_DIR: str = 'data'
    MOMENTUM_POOLS_FILE: str = os.path.join(DATA_DIR, 'momentum_pools.json')
    
    @classmethod
    def validate(cls) -> bool:
        """Validate required configuration."""
        if not cls.DISCORD_TOKEN:
            raise ValueError("DISCORD_TOKEN is required")
        return True
    
    @classmethod
    def get_extralife_team_url(cls) -> Optional[str]:
        """Get Extra-Life team API URL."""
        if cls.EXTRALIFE_TEAM_ID:
            return f"{cls.EXTRALIFE_API_BASE}/teams/{cls.EXTRALIFE_TEAM_ID}"
        return None
    
    @classmethod
    def get_extralife_participant_url(cls) -> Optional[str]:
        """Get Extra-Life participant API URL."""
        if cls.EXTRALIFE_PARTICIPANT_ID:
            return f"{cls.EXTRALIFE_API_BASE}/participants/{cls.EXTRALIFE_PARTICIPANT_ID}"
        return None
