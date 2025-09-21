import { injectable, inject } from 'tsyringe';
import { Client, EmbedBuilder, VoiceChannel, GuildMember, Guild } from 'discord.js';
import { IDiscordService } from '@domain/interfaces/services/IDiscordService';

@injectable()
export class DiscordService implements IDiscordService {
    constructor(@inject('DiscordClient') private client: Client) { }

    async sendMessage(channelId: string, content: string, embeds?: any[]): Promise<void> {
        const channel = await this.client.channels.fetch(channelId);
        if (!channel?.isTextBased()) return;

        try {
            await (channel as any).send({
                content,
                embeds: embeds?.map(embed => new EmbedBuilder(embed))
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    async sendEmbed(channelId: string, embed: any): Promise<void> {
        const channel = await this.client.channels.fetch(channelId);
        if (!channel?.isTextBased()) return;

        try {
            await (channel as any).send({
                embeds: [new EmbedBuilder(embed)]
            });
        } catch (error) {
            console.error('Error sending embed:', error);
        }
    }

    async sendError(channelId: string, message: string): Promise<void> {
        const embed = {
            color: 0xff0000,
            title: '❌ Error',
            description: message,
            timestamp: new Date().toISOString()
        };
        await this.sendEmbed(channelId, embed);
    }

    async sendSuccess(channelId: string, message: string): Promise<void> {
        const embed = {
            color: 0x00ff00,
            title: '✅ Success',
            description: message,
            timestamp: new Date().toISOString()
        };
        await this.sendEmbed(channelId, embed);
    }

    async sendWarning(channelId: string, message: string): Promise<void> {
        const embed = {
            color: 0xffaa00,
            title: '⚠️ Warning',
            description: message,
            timestamp: new Date().toISOString()
        };
        await this.sendEmbed(channelId, embed);
    }

    async sendInfo(channelId: string, message: string): Promise<void> {
        const embed = {
            color: 0x0099ff,
            title: 'ℹ️ Info',
            description: message,
            timestamp: new Date().toISOString()
        };
        await this.sendEmbed(channelId, embed);
    }

    async joinVoiceChannel(guildId: string, channelId: string): Promise<void> {
        const guild = await this.client.guilds.fetch(guildId);
        const channel = await guild.channels.fetch(channelId) as VoiceChannel;

        if (!channel?.isVoiceBased()) {
            throw new Error('Channel is not a voice channel');
        }

        // This would typically use @discordjs/voice for actual voice connection
        // For now, we'll just log the action
        console.log(`Joining voice channel ${channelId} in guild ${guildId}`);
    }

    async leaveVoiceChannel(guildId: string): Promise<void> {
        // This would typically disconnect from voice using @discordjs/voice
        console.log(`Leaving voice channel in guild ${guildId}`);
    }

    async isInVoiceChannel(_guildId: string): Promise<boolean> {
        // This would check if the bot is connected to a voice channel
        // For now, return false as a placeholder
        return false;
    }

    async getVoiceChannelId(_guildId: string): Promise<string | null> {
        // This would return the current voice channel ID
        // For now, return null as a placeholder
        return null;
    }

    async hasPermission(guildId: string, userId: string, permission: string): Promise<boolean> {
        try {
            const guild = await this.client.guilds.fetch(guildId);
            const member = await guild.members.fetch(userId);

            // Check if member has the specified permission
            return member.permissions.has(permission as any);
        } catch {
            return false;
        }
    }

    async getGuildMember(guildId: string, userId: string): Promise<GuildMember | null> {
        try {
            const guild = await this.client.guilds.fetch(guildId);
            return await guild.members.fetch(userId);
        } catch (ex: any) {
            return null;
        }
    }

    async getGuild(guildId: string): Promise<Guild | null> {
        try {
            return await this.client.guilds.fetch(guildId);
        } catch {
            return null;
        }
    }
}
