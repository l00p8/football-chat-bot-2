import * as VkBot from 'node-vk-bot-api';

import {Injectable} from '@nestjs/common';
import {ConfigService} from '../common/config.service';
import {AppEmitter} from '../common/event-bus.service';
import {VKMessage} from './vk.message';

@Injectable()
export class VKService {
    private bot: VkBot<any>;

    constructor(config: ConfigService, appEmitter: AppEmitter) {
        const token: string = config.get('VK_TOKEN');
        const confirmation: string = config.get('VK_CONFIRMATION');

        this.bot = new VkBot({token, confirmation});

        this.getCommandEventMapping(appEmitter).forEach(([command, event]) => {
            this.bot.command(`/${command}`, async ctx => {
                const [from] = await this.bot.execute('users.get', {
                    user_ids: ctx.message.from_id,
                });
                ctx.command = command;
                ctx.message.from = from;
                appEmitter.emit(event, new VKMessage(ctx));
            });
        });
    }

    public getBot(): VkBot<any> {
        return this.bot;
    }

    public launch(): void {
        this.bot.startPolling();
    }

    /**
     * Returns mapping structure that links commands and corresponded events
     * @private
     * @param {AppEmitter} appEmitter
     * @returns {Array<[string, string]>}
     * @memberOf VKService
     */
    private getCommandEventMapping(
        appEmitter: AppEmitter,
    ): [string, string][] {
        return [
            ['event_add', appEmitter.EVENT_ADD],
            ['event_remove', appEmitter.EVENT_REMOVE],
            ['info', appEmitter.EVENT_INFO],
            ['add', appEmitter.PLAYER_ADD],
            ['remove', appEmitter.PLAYER_REMOVE],
        ];
    }
}
