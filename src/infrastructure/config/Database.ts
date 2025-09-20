import { PrismaClient } from '@prisma/client';

export class Database {
    private static instance: PrismaClient;

    public static getInstance(): PrismaClient {
        if (!Database.instance) {
            Database.instance = new PrismaClient({
                log: process.env['NODE_ENV'] === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
            });
        }
        return Database.instance;
    }

    public static async connect(): Promise<void> {
        const prisma = Database.getInstance();
        await prisma.$connect();
        console.log('Database connected successfully');
    }

    public static async disconnect(): Promise<void> {
        const prisma = Database.getInstance();
        await prisma.$disconnect();
        console.log('Database disconnected');
    }
}
