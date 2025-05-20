import { RedisModule, RedisModuleOptions } from '@songkeys/nestjs-redis';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AppConfig, CommonModule } from '@instapets-backend/common';
import { PublicModule } from './modules/public/public.module';
import { UserModule } from './modules/user/user.module';
import { AdminModule } from '@authentication/admin/admin.module';
import { ServiceProviderModule } from './modules/service-provider/service-provider.module';
import { CustomerModule } from '@authentication/customer/customer.module';

@Module({
  imports: [
    UserModule,
    AdminModule,
    ServiceProviderModule,
    CustomerModule,
    PublicModule,
    CommonModule.registerAsync({
      appConfig: { appShortName: 'authentication' },
      inject: { default: [AppConfig] },
      useFactory: {
        default: () => ({
          memoryConfig: {
            minHeapSizeInBytes: 512 * 1024 * 1024,
            maxHeapSizeInBytes: 1024 * 1024 * 1024,
          },
        }),
      },
    }),
    RedisModule.forRootAsync({
      imports: [],
      inject: [AppConfig],
      useFactory: async (appConfigService: AppConfig): Promise<RedisModuleOptions> => {
        return {
          config: {
            host: appConfigService.REDIS_HOST ?? 'redis',
            port: appConfigService.REDIS_PORT,
          },
        };
      },
    }),
    PassportModule.register({ session: false, property: 'persona' }),
  ],
  providers: [],
})
export class AppModule {}
