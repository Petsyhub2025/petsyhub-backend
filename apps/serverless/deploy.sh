#!/bin/bash
# Script to deploy Lambda to AWS
# Usage: ./scripts/deploy.sh <lambda_name>

# Use git branch name as environment
ENV=$(git branch --show-current)

# Check if lambda name is provided
if [ -z "$1" ]
then
    echo "Please pass the lambda name as the first argument"
    exit 1
fi
LAMBDA_NAME=$1

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

# Install dependencies in dist folder
echo "Installing dependencies in dist folder"
npm ci --omit=dev || exit 1

# Zip files
echo "Zipping files"
zip -r ./instapets-backend-lambda-$LAMBDA_NAME.zip "main.js" "node_modules" ".env" "package.json" "package-lock.json"

# Upload to S3
echo "Uploading to S3"
aws s3 cp instapets-backend-lambda-$LAMBDA_NAME.zip s3://instapets-$ENV-backend-lambda-$LAMBDA_NAME/instapets-backend-lambda-$LAMBDA_NAME.zip 

# Deploy to AWS
echo "Deploying to AWS"
aws lambda update-function-code --function-name instapets-$ENV-backend-lambda-$LAMBDA_NAME --s3-bucket instapets-$ENV-backend-lambda-$LAMBDA_NAME --s3-key instapets-backend-lambda-$LAMBDA_NAME.zip --publish

# Clean up
echo "Cleaning up"
rm instapets-backend-lambda-$LAMBDA_NAME.zip
rm .env
rm -rf node_modules