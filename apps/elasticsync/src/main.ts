import { appBootstrapLoader } from '@instapets-backend/common';
import { AppModule } from './app.module';

appBootstrapLoader(
  AppModule,
  { enableSocket: false, swagger: { enabled: true, config: { version: '1.0.0' } } },
  { port: 5000 },
);
