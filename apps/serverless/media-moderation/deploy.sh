#!/bin/bash
# Script to deploy Lambda to AWS
# Usage: ./scripts/deploy.sh <lambda_name>

# Use git branch name as environment
ENV=$(git branch --show-current)
LAMBDA_NAME="media-moderation"

# Check env
if [ -z "$ENV" ]
then
    echo "Please ensure you are on a valid git branch for the environment"
    exit 1
fi

# Check if env is valid
if [ "$ENV" != "dev" ] && [ "$ENV" != "tst" ] && [ "$ENV" != "prod" ]
then
    echo "[WARN]: The git branch must be either 'dev', 'tst' or 'prod'. Assuming 'dev' environment for deployment"
    ENV="dev"
fi

echo "Deploying to $ENV environment"

# Download .env file from S3
echo "Downloading .env file from S3"
aws s3 cp s3://instapets-$ENV-backend-env-configs/.env .env

# Login to docker for AWS ECR
echo "Logging in to AWS ECR"
aws ecr get-login-password --region eu-central-1 | docker login --username AWS --password-stdin 724337166007.dkr.ecr.eu-central-1.amazonaws.com

# Build docker image
echo "Building docker image"
docker build --platform linux/amd64 -t instapets-backend-lambda-$LAMBDA_NAME:$ENV .

# Tag docker image
echo "Tagging docker image"
docker tag instapets-backend-lambda-$LAMBDA_NAME:$ENV 724337166007.dkr.ecr.eu-central-1.amazonaws.com/instapets-backend-lambda-$LAMBDA_NAME:$ENV

# Push docker image to ECR
echo "Pushing docker image to ECR"
docker push 724337166007.dkr.ecr.eu-central-1.amazonaws.com/instapets-backend-lambda-$LAMBDA_NAME:$ENV

# Deploy Lambda
echo "Deploying Lambda"
aws lambda update-function-code --function-name instapets-$ENV-backend-lambda-$LAMBDA_NAME --image-uri 724337166007.dkr.ecr.eu-central-1.amazonaws.com/instapets-backend-lambda-$LAMBDA_NAME:$ENV

# Clean up
echo "Cleaning up"
rm .env