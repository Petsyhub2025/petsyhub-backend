import { getMsgHandlerBaseUrl, signS2SToken } from '@serverless/common/helpers';
import axios, { AxiosError } from 'axios';
import { IMsgHandlerRequest } from '@serverless/video-job-analysis/interfaces/msghandler-request.interface';
import { Logger } from '@serverless/common/classes/logger.class';

export async function sendToMsgHandler(request: IMsgHandlerRequest) {
  const baseUrl = getMsgHandlerBaseUrl();
  const token = signS2SToken();
  const msgHandlerUrl = `${baseUrl}/msghandler/media-moderation/private-auth/update-sensitive-content`;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'x-api-version': '1',
  };

  try {
    const response = await axios.post(msgHandlerUrl, request, {
      headers,
    });

    if (response?.status !== 200 && response?.status !== 201) {
      throw new Error('Request to msgHandler returned an invalid status code');
    }
  } catch (error) {
    const logger = Logger.getInstance();
    logger.error('Error sending request to msgHandler', { error });

    if (error instanceof AxiosError) {
      logger.error('Error response from msgHandler', {
        response: error.response?.data,
        status: error.response?.status,
      });
    }
  }
}
