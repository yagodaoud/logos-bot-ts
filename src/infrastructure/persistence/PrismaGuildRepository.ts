import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { IGuildRepository } from '@domain/interfaces/repositories/IGuildRepository';
import { Guild, MusicSettings, ModerationSettings } from '@domain/entities/Guild';

@injectable()
export class PrismaGuildRepository implements IGuildRepository {
    constructor(@inject('PrismaClient') private prisma: PrismaClient) { }

    async findById(id: string): Promise<Guild | null> {
        const guild = await this.prisma.guild.findUnique({
            where: { id }
        });

        if (!guild) return null;

        return this.mapToDomain(guild);
    }

    async findByDiscordId(discordId: string): Promise<Guild | null> {
        const guild = await this.prisma.guild.findUnique({
            where: { discordId }
        });

        if (!guild) return null;

        return this.mapToDomain(guild);
    }

    async create(guild: Guild): Promise<Guild> {
        const created = await this.prisma.guild.create({
            data: {
                id: guild.id,
                discordId: guild.id, // Assuming discordId is the same as id for now
                name: guild.name,
                musicSettings: JSON.stringify(guild.musicSettings),
                moderationSettings: JSON.stringify(guild.moderationSettings),
                createdAt: guild.createdAt,
                updatedAt: guild.updatedAt
            }
        });

        return this.mapToDomain(created);
    }

    async update(guild: Guild): Promise<Guild> {
        const updated = await this.prisma.guild.update({
            where: { id: guild.id },
            data: {
                name: guild.name,
                musicSettings: JSON.stringify(guild.musicSettings),
                moderationSettings: JSON.stringify(guild.moderationSettings),
                updatedAt: guild.updatedAt
            }
        });

        return this.mapToDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.guild.delete({
            where: { id }
        });
    }

    async findAll(): Promise<Guild[]> {
        const guilds = await this.prisma.guild.findMany();
        return guilds.map(guild => this.mapToDomain(guild));
    }

    private mapToDomain(guild: any): Guild {
        return new Guild(
            guild.id,
            guild.name,
            JSON.parse(guild.musicSettings) as MusicSettings,
            JSON.parse(guild.moderationSettings) as ModerationSettings,
            guild.createdAt,
            guild.updatedAt
        );
    }
}
