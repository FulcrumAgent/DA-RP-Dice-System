"use strict";
/**
 * Scene Management System for distributed/GM-less play
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sceneManager = exports.SceneManager = void 0;
const discord_js_1 = require("discord.js");
const database_1 = require("./database");
const logger_1 = require("./logger");
class SceneManager {
    constructor() {
        this.scenes = new Map();
        this.dataManager = new database_1.DataManager();
        this.loadScenes();
    }
    /**
     * Load all active scenes from storage
     */
    async loadScenes() {
        try {
            const scenesData = await this.dataManager.loadData('scenes.json');
            if (scenesData) {
                scenesData.forEach(scene => {
                    this.scenes.set(scene.id, scene);
                });
                logger_1.logger.info(`Loaded ${this.scenes.size} scenes from storage`);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to load scenes:', error);
        }
    }
    /**
     * Save all scenes to storage
     */
    async saveScenes() {
        try {
            const scenesArray = Array.from(this.scenes.values());
            await this.dataManager.saveData('scenes.json', scenesArray);
        }
        catch (error) {
            logger_1.logger.error('Failed to save scenes:', error);
        }
    }
    /**
     * Create a new scene with thread
     */
    async createScene(channel, host, title, description, participants = []) {
        try {
            // Create Discord thread
            const thread = await channel.threads.create({
                name: `🎭 ${title}`,
                type: discord_js_1.ChannelType.PublicThread,
                reason: `Scene created by ${host.displayName}`
            });
            // Add participants to thread
            const participantIds = [host.id, ...participants.map(p => p.id)];
            for (const participant of participants) {
                await thread.members.add(participant.id);
            }
            // Create scene object
            const scene = {
                id: `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                threadId: thread.id,
                guildId: channel.guild.id,
                channelId: channel.id,
                title,
                description,
                hostId: host.id,
                participants: participantIds,
                status: 'active',
                createdAt: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                resources: {
                    momentum: 0,
                    threat: 0,
                    determination: {}
                }
            };
            // Initialize determination for all participants
            participantIds.forEach(id => {
                scene.resources.determination[id] = 0;
            });
            // Store scene
            this.scenes.set(scene.id, scene);
            await this.saveScenes();
            // Post scene intro
            await this.postSceneIntro(thread, scene, host, participants);
            logger_1.logger.info(`Created scene "${title}" hosted by ${host.displayName}`);
            return { scene, thread };
        }
        catch (error) {
            logger_1.logger.error('Failed to create scene:', error);
            throw new Error('Failed to create scene. Please try again.');
        }
    }
    /**
     * Post scene introduction message
     */
    async postSceneIntro(thread, scene, host, participants) {
        const participantMentions = participants.map(p => `<@${p.id}>`).join(' ');
        const introEmbed = {
            color: 0xD4AF37, // Dune gold
            title: `🎭 ${scene.title}`,
            description: scene.description || 'A new scene begins...',
            fields: [
                {
                    name: '🎪 Scene Host',
                    value: `<@${host.id}>`,
                    inline: true
                },
                {
                    name: '👥 Participants',
                    value: participantMentions || 'None yet',
                    inline: true
                },
                {
                    name: '⚡ Resources',
                    value: `Momentum: ${scene.resources.momentum}\nThreat: ${scene.resources.threat}`,
                    inline: true
                }
            ],
            footer: {
                text: 'Use /scenehost pass @user to transfer hosting duties'
            },
            timestamp: new Date().toISOString()
        };
        await thread.send({ embeds: [introEmbed] });
    }
    /**
     * End a scene
     */
    async endScene(threadId, userId, summary) {
        const scene = this.getSceneByThread(threadId);
        if (!scene) {
            throw new Error('Scene not found');
        }
        if (scene.hostId !== userId) {
            throw new Error('Only the scene host can end the scene');
        }
        scene.status = 'completed';
        scene.summary = summary;
        scene.lastActivity = new Date().toISOString();
        await this.saveScenes();
        logger_1.logger.info(`Scene "${scene.title}" ended by host`);
        return scene;
    }
    /**
     * Transfer scene hosting to another user
     */
    async transferHost(threadId, currentHostId, newHostId) {
        const scene = this.getSceneByThread(threadId);
        if (!scene) {
            throw new Error('Scene not found');
        }
        if (scene.hostId !== currentHostId) {
            throw new Error('Only the current host can transfer hosting duties');
        }
        if (!scene.participants.includes(newHostId)) {
            throw new Error('New host must be a participant in the scene');
        }
        scene.hostId = newHostId;
        scene.lastActivity = new Date().toISOString();
        await this.saveScenes();
        logger_1.logger.info(`Scene "${scene.title}" host transferred to ${newHostId}`);
        return scene;
    }
    /**
     * Add participant to scene
     */
    async addParticipant(threadId, userId) {
        const scene = this.getSceneByThread(threadId);
        if (!scene) {
            throw new Error('Scene not found');
        }
        if (!scene.participants.includes(userId)) {
            scene.participants.push(userId);
            scene.resources.determination[userId] = 0;
            scene.lastActivity = new Date().toISOString();
            await this.saveScenes();
        }
        return scene;
    }
    /**
     * Update scene resources
     */
    async updateResources(threadId, updates) {
        const scene = this.getSceneByThread(threadId);
        if (!scene) {
            throw new Error('Scene not found');
        }
        if (updates.momentum !== undefined) {
            scene.resources.momentum = Math.max(0, updates.momentum);
        }
        if (updates.threat !== undefined) {
            scene.resources.threat = Math.max(0, updates.threat);
        }
        if (updates.determination) {
            Object.assign(scene.resources.determination, updates.determination);
        }
        scene.lastActivity = new Date().toISOString();
        await this.saveScenes();
        return scene;
    }
    /**
     * Get scene by thread ID
     */
    getSceneByThread(threadId) {
        return Array.from(this.scenes.values()).find(scene => scene.threadId === threadId);
    }
    /**
     * Get all active scenes for a guild
     */
    getActiveScenes(guildId) {
        return Array.from(this.scenes.values()).filter(scene => scene.guildId === guildId && scene.status === 'active');
    }
    /**
     * Get scenes hosted by a user
     */
    getUserScenes(userId) {
        return Array.from(this.scenes.values()).filter(scene => scene.hostId === userId || scene.participants.includes(userId));
    }
    /**
     * Archive old completed scenes
     */
    async archiveOldScenes(daysOld = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        let archivedCount = 0;
        for (const scene of this.scenes.values()) {
            if (scene.status === 'completed' && new Date(scene.lastActivity) < cutoffDate) {
                scene.status = 'archived';
                archivedCount++;
            }
        }
        if (archivedCount > 0) {
            await this.saveScenes();
            logger_1.logger.info(`Archived ${archivedCount} old scenes`);
        }
        return archivedCount;
    }
}
exports.SceneManager = SceneManager;
exports.sceneManager = new SceneManager();
