import { injectable, inject } from 'tsyringe';
import { IMusicService } from '@domain/interfaces/services/IMusicService';
import { ICacheService } from '@domain/interfaces/services/ICacheService';
import { MusicQueue } from '@domain/entities/MusicQueue';

export interface QueueAction {
    type: 'skip' | 'pause' | 'resume' | 'stop' | 'shuffle' | 'clear' | 'previous' | 'setVolume';
    volume?: number;
}

export interface ManageQueueRequest {
    guildId: string;
    userId: string;
    action: QueueAction;
}

export interface ManageQueueResponse {
    success: boolean;
    message: string;
    queue?: MusicQueue;
}

@injectable()
export class ManageQueueUseCase {
    constructor(
        @inject('IMusicService') private musicService: IMusicService,
        @inject('ICacheService') private cacheService: ICacheService
    ) { }

    async execute(request: ManageQueueRequest): Promise<ManageQueueResponse> {
        try {
            const queue = await this.musicService.getQueue(request.guildId);
            if (!queue) {
                return {
                    success: false,
                    message: 'No music queue found for this server.'
                };
            }

            let updatedQueue: MusicQueue;
            let message: string;

            switch (request.action.type) {
                case 'skip':
                    updatedQueue = queue.next();
                    await this.musicService.setQueue(request.guildId, updatedQueue);
                    message = 'Skipped to next track.';
                    break;

                case 'pause':
                    updatedQueue = queue.pause();
                    await this.musicService.setQueue(request.guildId, updatedQueue);
                    await this.musicService.pause(request.guildId);
                    message = 'Music paused.';
                    break;

                case 'resume':
                    updatedQueue = queue.play();
                    await this.musicService.setQueue(request.guildId, updatedQueue);
                    await this.musicService.play(request.guildId);
                    message = 'Music resumed.';
                    break;

                case 'stop':
                    updatedQueue = queue.clear();
                    await this.musicService.setQueue(request.guildId, updatedQueue);
                    await this.musicService.stop(request.guildId);
                    message = 'Music stopped and queue cleared.';
                    break;

                case 'shuffle':
                    updatedQueue = queue.shuffle();
                    await this.musicService.setQueue(request.guildId, updatedQueue);
                    message = 'Queue shuffled.';
                    break;

                case 'clear':
                    updatedQueue = queue.clear();
                    await this.musicService.setQueue(request.guildId, updatedQueue);
                    message = 'Queue cleared.';
                    break;

                case 'previous':
                    updatedQueue = queue.previous();
                    await this.musicService.setQueue(request.guildId, updatedQueue);
                    message = 'Skipped to previous track.';
                    break;

                case 'setVolume':
                    if (request.action.volume === undefined) {
                        return {
                            success: false,
                            message: 'Volume value is required for setVolume action.'
                        };
                    }
                    updatedQueue = queue.setVolume(request.action.volume);
                    await this.musicService.setQueue(request.guildId, updatedQueue);
                    await this.musicService.setVolume(request.guildId, request.action.volume);
                    message = `Volume set to ${request.action.volume}%.`;
                    break;

                default:
                    return {
                        success: false,
                        message: 'Invalid queue action.'
                    };
            }

            // Publish queue update to other instances
            await this.cacheService.publish(
                `music:queue:${request.guildId}`,
                JSON.stringify(updatedQueue)
            );

            return {
                success: true,
                message,
                queue: updatedQueue
            };
        } catch (error) {
            console.error('Error in ManageQueueUseCase:', error);
            return {
                success: false,
                message: 'An error occurred while managing the queue.'
            };
        }
    }
}
