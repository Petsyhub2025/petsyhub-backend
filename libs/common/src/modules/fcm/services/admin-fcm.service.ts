import { Inject, Injectable } from '@nestjs/common';
import firebaseAdmin from 'firebase-admin';
import { SharedFCMService } from './shared-fcm.service';
import { FCM_ADMIN_APP } from '@common/modules/fcm/constants';

@Injectable()
export class AdminFCMService extends SharedFCMService {
  constructor(@Inject(FCM_ADMIN_APP) private adminApp: firebaseAdmin.app.App) {
    super(adminApp);
  }
}
