"""Database utilities for persistent data storage."""

import json
import os
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class MomentumPool:
    """Momentum pool data structure."""
    guild_id: int
    channel_id: int
    momentum: int = 0
    threat: int = 0
    last_updated: str = None
    
    def __post_init__(self):
        if self.last_updated is None:
            self.last_updated = datetime.now().isoformat()

class DataManager:
    """Manages persistent data storage using JSON files."""
    
    def __init__(self, data_dir: str = 'data'):
        self.data_dir = data_dir
        self.ensure_data_dir()
    
    def ensure_data_dir(self):
        """Ensure data directory exists."""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
    
    def load_json(self, filename: str) -> Dict[str, Any]:
        """Load data from JSON file."""
        filepath = os.path.join(self.data_dir, filename)
        if os.path.exists(filepath):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return {}
        return {}
    
    def save_json(self, filename: str, data: Dict[str, Any]):
        """Save data to JSON file."""
        filepath = os.path.join(self.data_dir, filename)
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except IOError as e:
            print(f"Error saving {filename}: {e}")
    
    def get_momentum_pool(self, guild_id: int, channel_id: int) -> MomentumPool:
        """Get momentum pool for a specific guild/channel."""
        pools = self.load_json('momentum_pools.json')
        key = f"{guild_id}_{channel_id}"
        
        if key in pools:
            pool_data = pools[key]
            return MomentumPool(**pool_data)
        
        # Create new pool
        return MomentumPool(guild_id=guild_id, channel_id=channel_id)
    
    def save_momentum_pool(self, pool: MomentumPool):
        """Save momentum pool data."""
        pools = self.load_json('momentum_pools.json')
        key = f"{pool.guild_id}_{pool.channel_id}"
        
        pool.last_updated = datetime.now().isoformat()
        pools[key] = asdict(pool)
        
        self.save_json('momentum_pools.json', pools)
    
    def update_momentum(self, guild_id: int, channel_id: int, momentum_change: int = 0, threat_change: int = 0):
        """Update momentum and threat values."""
        pool = self.get_momentum_pool(guild_id, channel_id)
        pool.momentum = max(0, pool.momentum + momentum_change)
        pool.threat = max(0, pool.threat + threat_change)
        self.save_momentum_pool(pool)
        return pool
    
    def reset_momentum_pool(self, guild_id: int, channel_id: int):
        """Reset momentum pool to zero."""
        pool = MomentumPool(guild_id=guild_id, channel_id=channel_id)
        self.save_momentum_pool(pool)
        return pool
    
    def get_all_momentum_pools(self, guild_id: int) -> Dict[int, MomentumPool]:
        """Get all momentum pools for a guild."""
        pools = self.load_json('momentum_pools.json')
        guild_pools = {}
        
        for key, pool_data in pools.items():
            if pool_data['guild_id'] == guild_id:
                channel_id = pool_data['channel_id']
                guild_pools[channel_id] = MomentumPool(**pool_data)
        
        return guild_pools
    
    def save_extralife_cache(self, data: Dict[str, Any]):
        """Cache Extra-Life API data."""
        cache_data = {
            'data': data,
            'timestamp': datetime.now().isoformat()
        }
        self.save_json('extralife_cache.json', cache_data)
    
    def load_extralife_cache(self) -> Optional[Dict[str, Any]]:
        """Load cached Extra-Life data."""
        cache = self.load_json('extralife_cache.json')
        if cache and 'data' in cache:
            # Check if cache is less than 5 minutes old
            cache_time = datetime.fromisoformat(cache['timestamp'])
            now = datetime.now()
            if (now - cache_time).total_seconds() < 300:  # 5 minutes
                return cache['data']
        return None
