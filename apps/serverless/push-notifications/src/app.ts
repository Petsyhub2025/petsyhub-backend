import dotenv from 'dotenv';
dotenv.config();
import { sendToMsgHandler } from './helpers/send-to-msghandler.helper';
import { IUserPushNotificationLambdaEvent } from './interfaces/lambda-event.interface';

export const lambdaHandler = async (event: IUserPushNotificationLambdaEvent) => {
  console.log('event', event);

  if (!event) {
    throw new Error('Invalid event');
  }

  const { userPushNotificationId } = event;

  if (!userPushNotificationId) {
    throw new Error('Invalid userPushNotificationId');
  }

  await sendToMsgHandler(userPushNotificationId);
};
