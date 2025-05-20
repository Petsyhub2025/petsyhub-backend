import { getMsgHandlerBaseUrl, signS2SToken } from '@serverless/common/helpers';
import axios, { AxiosError } from 'axios';

export async function sendToMsgHandler(userPushNotificationId: string) {
  const baseUrl = getMsgHandlerBaseUrl();
  const token = signS2SToken();
  const msgHandlerUrl = `${baseUrl}/msghandler/user-push-notifications/private-auth/process-user-push-notification`;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'x-api-version': '1',
  };

  const body = {
    userPushNotificationId,
  };

  try {
    const response = await axios.post(msgHandlerUrl, body, {
      headers,
    });

    if (response?.status !== 200 && response?.status !== 201) {
      throw new Error('Request to msgHandler returned an invalid status code');
    }
  } catch (error) {
    console.log('error', error);

    if (error instanceof AxiosError) {
      console.log('error.response');
      console.log(error.response);
    }

    throw new Error('Request to msgHandler failed');
  }
}
