import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisService } from '@songkeys/nestjs-redis';
import { Server, ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(appOrHttpServer: INestApplicationContext, private redisService: RedisService) {
    super(appOrHttpServer);
  }

  connectToRedis(): void {
    const pubClient = this.redisService.getClient();
    const subClient = pubClient.duplicate();

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server: Server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);

    // server.use((socket, next) => {

    // });

    return server;
  }
}
