-- PostgreSQL Schema for Dune/DA-RP Dice System Discord Bot
-- Character Management Database

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main Characters Table
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(32) NOT NULL, -- Discord user ID
    guild_id VARCHAR(32) NOT NULL, -- Discord guild ID
    name VARCHAR(255) NOT NULL,
    concepts TEXT[] DEFAULT '{}', -- Array of concept strings
    house VARCHAR(255), -- Optional house affiliation
    homeworld VARCHAR(255), -- Optional homeworld
    avatar_url TEXT, -- Optional custom avatar URL
    
    -- Core Attributes (stored as individual columns for easy querying)
    attr_muscle INTEGER DEFAULT 8,
    attr_move INTEGER DEFAULT 8,
    attr_intellect INTEGER DEFAULT 8,
    attr_awareness INTEGER DEFAULT 8,
    attr_communication INTEGER DEFAULT 8,
    attr_discipline INTEGER DEFAULT 8,
    
    -- Resources
    determination INTEGER DEFAULT 0,
    max_determination INTEGER DEFAULT 0,
    
    -- Experience tracking
    exp_total INTEGER DEFAULT 0,
    exp_spent INTEGER DEFAULT 0,
    exp_available INTEGER DEFAULT 0,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for common queries
    UNIQUE(user_id, guild_id, name), -- Prevent duplicate character names per user per guild
    INDEX idx_characters_user_guild (user_id, guild_id),
    INDEX idx_characters_active (is_active),
    INDEX idx_characters_updated (last_updated)
);

-- Character Skills Table (one-to-many relationship)
CREATE TABLE character_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    value INTEGER NOT NULL DEFAULT 0,
    focus TEXT[], -- Array of focus strings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(character_id, name), -- One skill per character
    INDEX idx_skills_character (character_id)
);

-- Character Drives Table (one-to-many relationship)
CREATE TABLE character_drives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    statement TEXT NOT NULL,
    value INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(character_id, name), -- One drive per character
    INDEX idx_drives_character (character_id)
);

-- Character Assets Table (one-to-many relationship)
CREATE TABLE character_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('talent', 'equipment', 'contact', 'reputation')),
    description TEXT,
    qualities TEXT[], -- Array of quality strings
    cost INTEGER, -- Optional cost value
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_assets_character (character_id),
    INDEX idx_assets_type (type)
);

-- Character Traits Table (one-to-many relationship)
CREATE TABLE character_traits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('flaw', 'quirk', 'background')),
    description TEXT,
    mechanical TEXT, -- Optional mechanical effect description
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_traits_character (character_id),
    INDEX idx_traits_type (type)
);

-- NPCs Table (similar structure to characters but for NPCs)
CREATE TABLE npcs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    guild_id VARCHAR(32) NOT NULL,
    concepts TEXT[] DEFAULT '{}',
    description TEXT,
    tier VARCHAR(20) CHECK (tier IN ('minion', 'toughened', 'nemesis')),
    avatar_url TEXT,
    
    -- Simplified attributes (can be partial)
    attr_muscle INTEGER,
    attr_move INTEGER,
    attr_intellect INTEGER,
    attr_awareness INTEGER,
    attr_communication INTEGER,
    attr_discipline INTEGER,
    
    -- Metadata
    created_by VARCHAR(32) NOT NULL, -- Discord user ID of creator
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_npcs_guild (guild_id),
    INDEX idx_npcs_creator (created_by),
    INDEX idx_npcs_tier (tier)
);

-- NPC Skills Table
CREATE TABLE npc_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    value INTEGER NOT NULL DEFAULT 0,
    focus TEXT[],
    
    UNIQUE(npc_id, name),
    INDEX idx_npc_skills_npc (npc_id)
);

-- NPC Assets Table
CREATE TABLE npc_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('talent', 'equipment', 'contact', 'reputation')),
    description TEXT,
    qualities TEXT[],
    cost INTEGER,
    
    INDEX idx_npc_assets_npc (npc_id)
);

-- NPC Traits Table
CREATE TABLE npc_traits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('flaw', 'quirk', 'background')),
    description TEXT,
    mechanical TEXT,
    
    INDEX idx_npc_traits_npc (npc_id)
);

-- Momentum Pools Table (for guild/channel momentum tracking)
CREATE TABLE momentum_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guild_id VARCHAR(32) NOT NULL,
    channel_id VARCHAR(32) NOT NULL,
    momentum INTEGER DEFAULT 0,
    threat INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(guild_id, channel_id),
    INDEX idx_momentum_guild_channel (guild_id, channel_id)
);

-- Character Creation Sessions Table (for tracking ongoing character creation)
CREATE TABLE character_creation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(32) NOT NULL,
    guild_id VARCHAR(32) NOT NULL,
    current_step VARCHAR(50) NOT NULL,
    character_data JSONB DEFAULT '{}', -- Store partial character data as JSON
    temp_data JSONB DEFAULT '{}', -- Store temporary creation data
    message_id VARCHAR(32), -- Discord message ID for editing
    channel_id VARCHAR(32), -- Discord channel ID
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, guild_id), -- One active session per user per guild
    INDEX idx_creation_sessions_user_guild (user_id, guild_id),
    INDEX idx_creation_sessions_updated (last_updated)
);

-- Function to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update last_updated timestamps
CREATE TRIGGER update_characters_last_updated 
    BEFORE UPDATE ON characters 
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_column();

CREATE TRIGGER update_momentum_pools_last_updated 
    BEFORE UPDATE ON momentum_pools 
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_column();

CREATE TRIGGER update_creation_sessions_last_updated 
    BEFORE UPDATE ON character_creation_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_column();

-- Create indexes for performance
CREATE INDEX idx_characters_name_search ON characters USING gin(to_tsvector('english', name));
CREATE INDEX idx_npcs_name_search ON npcs USING gin(to_tsvector('english', name));

-- Sample data insertion function (optional)
CREATE OR REPLACE FUNCTION create_sample_character(
    p_user_id VARCHAR(32),
    p_guild_id VARCHAR(32),
    p_name VARCHAR(255)
) RETURNS UUID AS $$
DECLARE
    character_uuid UUID;
BEGIN
    INSERT INTO characters (user_id, guild_id, name, concepts)
    VALUES (p_user_id, p_guild_id, p_name, ARRAY['Noble', 'Warrior'])
    RETURNING id INTO character_uuid;
    
    -- Add some sample skills
    INSERT INTO character_skills (character_id, name, value, focus) VALUES
    (character_uuid, 'Battle', 2, ARRAY['Melee Combat']),
    (character_uuid, 'Communicate', 1, ARRAY['Leadership']);
    
    -- Add sample drives
    INSERT INTO character_drives (character_id, name, statement, value) VALUES
    (character_uuid, 'Duty', 'I must protect my house at all costs', 2),
    (character_uuid, 'Faith', 'The spice must flow', 1);
    
    RETURN character_uuid;
END;
$$ LANGUAGE plpgsql;
