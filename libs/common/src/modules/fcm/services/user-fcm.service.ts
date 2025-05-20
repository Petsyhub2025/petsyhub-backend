import { Inject, Injectable } from '@nestjs/common';
import firebaseAdmin from 'firebase-admin';
import { FCM_USER_APP } from '../constants/fcm.constant';
import { SharedFCMService } from './shared-fcm.service';

@Injectable()
export class UserFCMService extends SharedFCMService {
  constructor(@Inject(FCM_USER_APP) private userApp: firebaseAdmin.app.App) {
    super(userApp);
  }
}
