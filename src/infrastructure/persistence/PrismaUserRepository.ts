import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '@domain/interfaces/repositories/IUserRepository';
import { User } from '@domain/entities/User';

@injectable()
export class PrismaUserRepository implements IUserRepository {
    constructor(@inject('PrismaClient') private prisma: PrismaClient) { }

    async findById(id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { id }
        });

        if (!user) return null;

        return this.mapToDomain(user);
    }

    async findByDiscordId(discordId: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { discordId }
        });

        if (!user) return null;

        return this.mapToDomain(user);
    }

    async create(user: User): Promise<User> {
        const created = await this.prisma.user.create({
            data: {
                id: user.id,
                discordId: user.id, // Assuming discordId is the same as id for now
                username: user.username,
                discriminator: user.discriminator,
                avatar: user.avatar || null,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });

        return this.mapToDomain(created);
    }

    async update(user: User): Promise<User> {
        const updated = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                username: user.username,
                discriminator: user.discriminator,
                avatar: user.avatar || null,
                updatedAt: user.updatedAt
            }
        });

        return this.mapToDomain(updated);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.user.delete({
            where: { id }
        });
    }

    async findAll(): Promise<User[]> {
        const users = await this.prisma.user.findMany();
        return users.map(user => this.mapToDomain(user));
    }

    private mapToDomain(user: any): User {
        return new User(
            user.id,
            user.username,
            user.discriminator,
            user.avatar,
            user.createdAt,
            user.updatedAt
        );
    }
}
