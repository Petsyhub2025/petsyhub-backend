# Install dependencies only when needed
FROM public.ecr.aws/lambda/nodejs:18 as deps
WORKDIR /usr/src/app
COPY ./package*.json ./
RUN npm ci --omit=dev

FROM public.ecr.aws/lambda/nodejs:18 as runner
RUN yum install -y \
    wget \
    xz \
    tar \
    && yum clean all

RUN wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-6.1-amd64-static.tar.xz
RUN tar -xvf ffmpeg-6.1-amd64-static.tar.xz
RUN mv ffmpeg-6.1-amd64-static/ffmpeg /usr/local/bin/ffmpeg
RUN mv ffmpeg-6.1-amd64-static/ffprobe /usr/local/bin/ffprobe
RUN chmod +x /usr/local/bin/ffmpeg
RUN chmod +x /usr/local/bin/ffprobe

WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/package.json ./package.json
COPY . .

CMD ["main.lambdaHandler"]

