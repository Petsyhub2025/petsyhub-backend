import { Inject, Injectable } from '@nestjs/common';
import firebaseAdmin from 'firebase-admin';
import { FCM_SERVICE_PROVIDER_APP } from '@common/modules/fcm/constants/fcm.constant';
import { SharedFCMService } from './shared-fcm.service';

@Injectable()
export class ServiceProviderFCMService extends SharedFCMService {
  constructor(@Inject(FCM_SERVICE_PROVIDER_APP) private serviceProviderApp: firebaseAdmin.app.App) {
    super(serviceProviderApp);
  }
}
