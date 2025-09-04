# NPC Tier System Migration Guide

## Overview
This document outlines the migration process for existing NPCs to the new tier-based system implemented in the Dune: Awakened Adventures Discord bot.

## What Changed

### New NPC Tier System
The bot now supports three distinct NPC tiers:

1. **Minion (Supporting Character)**
   - Basic stat block with simplified attributes and skills
   - No drives - uses skill + attribute rolls only
   - Suitable for background characters, guards, servants

2. **Toughened (Notable/Elite Supporting Character)**
   - Enhanced stats compared to minions
   - No drives - uses skill + attribute rolls only
   - Suitable for lieutenants, skilled professionals, minor antagonists

3. **Nemesis (Adversary)**
   - Full character sheet like player characters
   - Includes all five drives with statements
   - Uses skill + drive rolls like PCs
   - Suitable for major antagonists, important allies, recurring characters

## Database Schema Changes

### Existing NPCs
- All existing NPCs will default to `tier: 'toughened'` if no tier is specified
- Existing NPCs without drives will continue to function normally
- Existing NPCs with drives will be treated as Nemesis tier automatically

### New Fields
- `tier` field: 'minion' | 'toughened' | 'nemesis'
- Enhanced drive support for Nemesis tier NPCs only

## Migration Process

### Automatic Migration
The system handles most migration automatically:

1. **Existing NPCs without drives**: Classified as 'toughened' tier
2. **Existing NPCs with drives**: Classified as 'nemesis' tier
3. **New NPCs**: Must specify tier during creation

### Manual Migration (Recommended)
For better organization, server administrators should review and manually set appropriate tiers:

```
/npc edit name:<npc_name> field:tier value:minion
/npc edit name:<npc_name> field:tier value:toughened  
/npc edit name:<npc_name> field:tier value:nemesis
```

**Important**: Changing an NPC's tier will regenerate their stats to match the new tier's power level.

## Roll System Changes

### Before Migration
- All NPCs used the same roll mechanics
- Drive usage was inconsistent

### After Migration
- **Minion/Toughened NPCs**: Use skill + attribute rolls only
- **Nemesis NPCs**: Can use skill + drive rolls like player characters
- Roll command now includes tier validation

### New Roll Types
- `Basic Roll`: Simple attribute roll
- `Skill Roll`: Skill + attribute (all tiers)
- `Skill + Drive (Nemesis only)`: Skill + drive combination (Nemesis only)
- `Attack/Defend`: Combat rolls

## UI and Command Changes

### NPC Creation
- `/npc create` now requires tier selection
- `/npc generate` includes tier-appropriate stat generation

### NPC Display
- NPC embeds show tier information
- Drives only displayed for Nemesis tier NPCs
- Tier-specific color coding in embeds

### Autocomplete
- Drive autocomplete only available for Nemesis NPCs
- Helpful messages for non-Nemesis NPCs attempting to use drives

## Best Practices

### Tier Assignment Guidelines
- **Minion**: Unnamed background characters, basic guards, servants
- **Toughened**: Named supporting characters, skilled professionals, minor threats
- **Nemesis**: Major antagonists, important allies, recurring characters with complex motivations

### Stat Regeneration Warning
When changing an NPC's tier, their stats will be completely regenerated. Consider this carefully for established NPCs.

### Drive Management
- Only create drives for NPCs that truly need complex motivations
- Drives should reflect the character's core motivations and conflicts
- Remember that drives are only available for Nemesis tier NPCs

## Troubleshooting

### Common Issues
1. **"Drives only available for Nemesis tier"**: Upgrade NPC to Nemesis tier or use skill-only rolls
2. **Stats changed after tier change**: This is expected behavior - stats regenerate to match tier
3. **Missing drives after downgrade**: Drives are removed when downgrading from Nemesis tier

### Support Commands
- `/npc view <name>`: Check current tier and stats
- `/npc list`: See all NPCs with their tiers
- `/npc edit <name> field:tier value:<tier>`: Change NPC tier

## Technical Notes

### For Developers
- Tier changes trigger complete stat regeneration via `PrismaCharacterManager.generateNPCStatsForTier()`
- Drive validation occurs at both command and database levels
- Legacy compatibility maintained through `formatNPCForLegacyCompatibility()`

### Database Considerations
- Tier changes are transactional to prevent data corruption
- Old related data (skills, assets, traits, drives) is deleted before new data creation
- All changes are logged for audit purposes

## Rollback Plan

If issues arise, NPCs can be manually restored:
1. Note the NPC's original stats before tier changes
2. Use `/npc edit` to restore individual fields
3. Contact server administrators for bulk restoration if needed

---

**Migration completed by**: Fulcrum Development Team  
**Date**: Implementation of NPC Tier System  
**Version**: 1.0.0
