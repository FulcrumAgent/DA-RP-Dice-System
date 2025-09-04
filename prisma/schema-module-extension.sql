-- Module System Schema Extension for Dune Discord Bot
-- Run this after reviewing to add module tables to your existing database

-- Module Manifests
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    authors TEXT[] DEFAULT '{}',
    version VARCHAR(50) NOT NULL,
    license VARCHAR(255),
    source_url TEXT,
    content_warnings TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    recommended_level VARCHAR(50),
    estimated_sessions INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Module Scenes
CREATE TABLE IF NOT EXISTS module_scenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    act VARCHAR(100) NOT NULL,
    order_num INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    gm_notes TEXT,
    read_aloud TEXT,
    checks JSONB DEFAULT '[]',
    npcs TEXT[] DEFAULT '{}',
    handouts TEXT[] DEFAULT '{}',
    tables TEXT[] DEFAULT '{}',
    next_scene_id UUID REFERENCES module_scenes(id),
    choices JSONB DEFAULT '[]',
    safety_flags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Module NPCs
CREATE TABLE IF NOT EXISTS module_npcs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    traits TEXT[] DEFAULT '{}',
    motivation TEXT,
    bonds TEXT[] DEFAULT '{}',
    secrets TEXT[] DEFAULT '{}',
    stat_block JSONB DEFAULT '{}',
    gm_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Module Handouts
CREATE TABLE IF NOT EXISTS module_handouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    body TEXT,
    image_url TEXT,
    is_spoiler BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Module Roll Tables
CREATE TABLE IF NOT EXISTS module_roll_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    die VARCHAR(50) NOT NULL,
    entries JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign States (per guild/channel)
CREATE TABLE IF NOT EXISTS campaign_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    current_scene_id UUID REFERENCES module_scenes(id),
    progress_tracks JSONB DEFAULT '[]',
    gm_notes JSONB DEFAULT '[]',
    loaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_advanced_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(guild_id, channel_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_modules_slug ON modules(slug);
CREATE INDEX IF NOT EXISTS idx_module_scenes_module_id ON module_scenes(module_id);
CREATE INDEX IF NOT EXISTS idx_module_scenes_act_order ON module_scenes(module_id, act, order_num);
CREATE INDEX IF NOT EXISTS idx_module_npcs_module_id ON module_npcs(module_id);
CREATE INDEX IF NOT EXISTS idx_module_npcs_name ON module_npcs(module_id, name);
CREATE INDEX IF NOT EXISTS idx_module_handouts_module_id ON module_handouts(module_id);
CREATE INDEX IF NOT EXISTS idx_module_roll_tables_module_id ON module_roll_tables(module_id);
CREATE INDEX IF NOT EXISTS idx_campaign_states_guild_channel ON campaign_states(guild_id, channel_id);
CREATE INDEX IF NOT EXISTS idx_campaign_states_module ON campaign_states(module_id);
