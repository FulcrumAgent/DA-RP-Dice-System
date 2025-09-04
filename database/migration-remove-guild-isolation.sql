-- Migration to remove guild isolation from the database
-- This script removes guildId constraints and updates existing data to be globally accessible

-- Remove guildId from unique constraints and add new constraints without guildId
-- Note: This will require careful data management to avoid conflicts

-- 1. Drop existing unique constraints that include guildId
ALTER TABLE "Character" DROP CONSTRAINT IF EXISTS "Character_guildId_name_key";
ALTER TABLE "NPC" DROP CONSTRAINT IF EXISTS "NPC_guildId_name_key";

-- 2. Add new unique constraints without guildId (be careful of potential conflicts)
-- For characters, we'll use userId + name to ensure uniqueness per user across all guilds
ALTER TABLE "Character" ADD CONSTRAINT "Character_userId_name_key" UNIQUE ("userId", "name");

-- For NPCs, we'll use createdBy + name to ensure uniqueness per creator across all guilds
ALTER TABLE "NPC" ADD CONSTRAINT "NPC_createdBy_name_key" UNIQUE ("createdBy", "name");

-- 3. Remove guildId columns from tables (optional - can be done after testing)
-- WARNING: This will permanently delete guild association data!
-- Uncomment these lines only after confirming the migration works correctly:
-- ALTER TABLE "Character" DROP COLUMN "guildId";
-- ALTER TABLE "NPC" DROP COLUMN "guildId";
-- ALTER TABLE "CampaignState" DROP COLUMN "guildId";

-- 4. Update any existing campaign states to remove guildId dependency
-- This removes the guildId from the composite key in campaign_states
-- Note: You may need to handle conflicts if multiple guilds had the same channelId

-- Create a backup table first
CREATE TABLE "CampaignState_backup" AS SELECT * FROM "CampaignState";

-- Drop the existing campaign_states table primary key constraint
ALTER TABLE "CampaignState" DROP CONSTRAINT IF EXISTS "CampaignState_pkey";

-- Add new primary key based on channelId only
ALTER TABLE "CampaignState" ADD CONSTRAINT "CampaignState_pkey" PRIMARY KEY ("channelId");

-- 5. Clean up any duplicate campaign states by channelId (keep the most recent)
DELETE FROM "CampaignState" 
WHERE ctid NOT IN (
    SELECT ctid 
    FROM (
        SELECT ctid, ROW_NUMBER() OVER (
            PARTITION BY "channelId" 
            ORDER BY "lastAdvancedAt" DESC, "loadedAt" DESC
        ) as rn
        FROM "CampaignState"
    ) ranked
    WHERE rn = 1
);

-- 6. Verification queries (run these after migration to check data integrity)
-- SELECT COUNT(*) FROM "Character" GROUP BY "userId", "name" HAVING COUNT(*) > 1; -- Should return no rows
-- SELECT COUNT(*) FROM "NPC" GROUP BY "createdBy", "name" HAVING COUNT(*) > 1; -- Should return no rows
-- SELECT COUNT(*) FROM "CampaignState" GROUP BY "channelId" HAVING COUNT(*) > 1; -- Should return no rows

COMMIT;
