import { injectable } from 'tsyringe';
import Redis from 'ioredis';
import { ICacheService } from '@domain/interfaces/services/ICacheService';

@injectable()
export class RedisCacheService implements ICacheService {
    private redis: Redis;
    private subscriber: Redis;

    constructor() {
        const redisOptions: any = {
            enableReadyCheck: false,
            maxRetriesPerRequest: null,
        };

        if (process.env['REDIS_PASSWORD']) {
            redisOptions.password = process.env['REDIS_PASSWORD'];
        }

        this.redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379', redisOptions);
        this.subscriber = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379', redisOptions);
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        try {
            const serialized = JSON.stringify(value);
            if (ttl) {
                await this.redis.setex(key, ttl, serialized);
            } else {
                await this.redis.set(key, serialized);
            }
        } catch (error) {
            console.error('Redis set error:', error);
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (error) {
            console.error('Redis delete error:', error);
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        } catch (error) {
            console.error('Redis exists error:', error);
            return false;
        }
    }

    async expire(key: string, ttl: number): Promise<void> {
        try {
            await this.redis.expire(key, ttl);
        } catch (error) {
            console.error('Redis expire error:', error);
        }
    }

    async publish(channel: string, message: string): Promise<void> {
        try {
            await this.redis.publish(channel, message);
        } catch (error) {
            console.error('Redis publish error:', error);
        }
    }

    async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
        try {
            await this.subscriber.subscribe(channel);
            this.subscriber.on('message', (receivedChannel, message) => {
                if (receivedChannel === channel) {
                    callback(message);
                }
            });
        } catch (error) {
            console.error('Redis subscribe error:', error);
        }
    }

    async unsubscribe(channel: string): Promise<void> {
        try {
            await this.subscriber.unsubscribe(channel);
        } catch (error) {
            console.error('Redis unsubscribe error:', error);
        }
    }

    async disconnect(): Promise<void> {
        await this.redis.quit();
        await this.subscriber.quit();
    }
}
