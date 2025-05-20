import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';

export async function getFfmpegMetadata(file: Uint8Array) {
  return new Promise<ffmpeg.FfprobeData | null>((resolve, reject) => {
    try {
      const videoBuffer = Buffer.from(file, file.byteOffset, file.byteLength);
      const stream = new Readable({});
      stream.push(videoBuffer);
      stream.push(null); // Push null to end the stream

      ffmpeg(stream).ffprobe((err, metadata) => {
        // console.log(err, metadata);
        if (err) {
          throw new Error('[METADATA]: Invalid Audio/Video file');
        } else {
          resolve(metadata);
        }
      });
    } catch {
      resolve(null);
    }
  });
}
