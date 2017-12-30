#!/bin/bash
set -e

site()
{
  npm run build

  aws s3 cp ./build/static s3://dogpointing/static --recursive --include "*" --cache-control max-age=86400 --acl public-read
  aws s3 cp ./build/favicon.ico s3://dogpointing/favicon.ico --cache-control max-age=3600 --acl public-read
  aws s3 cp ./build/asset-manifest.json s3://dogpointing/asset-manifest.json --cache-control max-age=0 --acl public-read
  aws s3 cp ./build/manifest.json s3://dogpointing/manifest.json --cache-control max-age=0 --acl public-read
  aws s3 cp ./build/service-worker.js s3://dogpointing/service-worker.js --cache-control max-age=0 --acl public-read
  aws s3 cp ./build/index.html s3://dogpointing/index.html --cache-control max-age=0 --acl public-read
}

api()
{
  pushd lambda
  declare -a arr=("dp_create_session"
                  "dp_create_story"
                  "dp_create_user"
                  "dp_get_session"
                  "dp_get_stories"
                  "dp_get_users"
                  "dp_patch_story"
                  "dp_notify_clients"
                  )

  for i in "${arr[@]}"
  do
    zip $i.zip $i.py
    aws s3 cp $i.zip s3://dogpointing/deploy/$i.zip
    aws lambda update-function-code --function-name $i --s3-bucket dogpointing --s3-key deploy/$i.zip --publish  --region us-east-2
    rm -f $i.zip
  done
  popd
}

if [ "$#" -eq 0 ] || [ "$1" == "all" ] || [ "$1" == "site" ]; then
  site
fi

if [ "$#" -eq 0 ] || [ "$1" == "all" ] || [ "$1" == "api" ]; then
  api
fi
