import { SUPPORTED_AUDIO_FORMATS } from '@serverless/media-moderation/constants';
import { getFfmpegMetadata } from './ffmpeg-meta.helper';

export async function isAudio(audio: Uint8Array) {
  const audioMetadata = await getFfmpegMetadata(audio);

  const hasAudio = audioMetadata?.streams?.some((stream) => stream.codec_type === 'audio');
  const hasNoVideo = !audioMetadata?.streams?.some((stream) => stream.codec_type === 'video');
  const isSupportedAudioFormat = SUPPORTED_AUDIO_FORMATS.includes(audioMetadata?.format?.format_name);

  return audioMetadata?.streams?.length && hasAudio && hasNoVideo && isSupportedAudioFormat;
}
