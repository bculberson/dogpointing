#!/bin/bash

npm run build
pushd build
s3cmd -P sync . s3://dogpointing
popd
aws cloudfront create-invalidation --distribution-id E39NAYF10CHP4U --paths / /index.html
