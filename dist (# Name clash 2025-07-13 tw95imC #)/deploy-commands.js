"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployCommands = deployCommands;
const discord_js_1 = require("discord.js");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const dice_roller_1 = require("./commands/dice-roller");
const dune_system_1 = require("./commands/dune-system");
const sceneHostCommand = __importStar(require("./commands/scene-host"));
const characterSheetCommand = __importStar(require("./commands/character-sheet"));
const duneTestCommand = __importStar(require("./commands/dune-test"));
const referenceCommand = __importStar(require("./commands/reference"));
const npcManagerCommand = __importStar(require("./commands/npc-manager"));
async function deployCommands() {
    const botConfig = config_1.config.getConfig();
    if (!botConfig.discordToken) {
        logger_1.logger.error('DISCORD_TOKEN is required');
        process.exit(1);
    }
    if (!botConfig.clientId) {
        logger_1.logger.error('CLIENT_ID is required');
        process.exit(1);
    }
    const commands = [
        ...dice_roller_1.diceRollerCommands,
        ...dune_system_1.duneSystemCommands,
        sceneHostCommand.data,
        characterSheetCommand.data,
        duneTestCommand.data,
        referenceCommand.data,
        npcManagerCommand.data
    ].map(command => command.toJSON());
    const rest = new discord_js_1.REST({ version: '10' }).setToken(botConfig.discordToken);
    try {
        logger_1.logger.info(`Started refreshing ${commands.length} application (/) commands.`);
        let data;
        if (botConfig.guildId) {
            data = await rest.put(discord_js_1.Routes.applicationGuildCommands(botConfig.clientId, botConfig.guildId), { body: commands });
            logger_1.logger.info(`Successfully reloaded ${data.length} guild application (/) commands for guild ${botConfig.guildId}.`);
        }
        else {
            data = await rest.put(discord_js_1.Routes.applicationCommands(botConfig.clientId), { body: commands });
            logger_1.logger.info(`Successfully reloaded ${data.length} global application (/) commands.`);
        }
    }
    catch (error) {
        logger_1.logger.error('Error deploying commands:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    deployCommands();
}
