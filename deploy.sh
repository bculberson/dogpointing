#!/bin/bash

npm run build

aws s3 cp ./build/static s3://dogpointing/static --recursive --include "*" --cache-control max-age=86400
aws s3 cp ./build/favicon.ico s3://dogpointing/favicon.ico --cache-control max-age=3600
aws s3 cp ./build/asset-manifest.json s3://dogpointing/asset-manifest.json --cache-control max-age=0
aws s3 cp ./build/index.html s3://dogpointing/index.html --cache-control max-age=0
aws s3 cp ./build/manifest.json s3://dogpointing/manifest.json --cache-control max-age=0
aws s3 cp ./build/service-worker.js s3://dogpointing/service-worker.js --cache-control max-age=0
