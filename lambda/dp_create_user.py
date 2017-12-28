import logging
import boto3
import time
import random
import botocore
from datetime import datetime
from datetime import timedelta
from boto3.dynamodb.conditions import Key

logger = logging.getLogger()
logger.setLevel(logging.INFO)
dynamodb = boto3.resource("dynamodb", region_name='us-east-2', endpoint_url="http://dynamodb.us-east-2.amazonaws.com")
table = dynamodb.Table('dp_users')
story_table = dynamodb.Table('dp_stories')


def get_stories(session_key):
  users = {}
  response = story_table.query(
      KeyConditionExpression=Key('session_key').eq(session_key)
  )
  return response['Items']


def lambda_handler(event, context):
    logger.debug('got event{}'.format(event))
    user_key = str(random.randint(0, 999999))
    session_key = event['session_key']
    expiration = time.mktime((datetime.now() + timedelta(days=1)).timetuple())
    item={
        'user_key': user_key,
        'session_key': session_key,
        'expiration': int(expiration),
        'name': event['user']['name'],
        'observer': event['user']['observer']
        }

    table.put_item(Item=item)

    user_response = table.get_item(Key={'user_key': user_key, 'session_key': session_key})

    # add user votes to stories
    if event['user']['observer'] == False:
        for story in get_stories(session_key):
            votes = story["votes"]
            votes.append({"key": user_key, "name": event['user']['name'], "value": "Cat"})
            try:
              response = story_table.update_item(
                Key={'story_key': story['story_key'], 'session_key': session_key},
                UpdateExpression="set votes = :votes, expiration = :expiration",
                ConditionExpression='expiration = :exp_expiration',
                ExpressionAttributeValues={
                  ':votes': votes,
                  ':expiration': int(expiration),
                  ':exp_expiration': story["expiration"],
                },
                ReturnValues="UPDATED_NEW"
              )
            except botocore.exceptions.ClientError as e:
              raise Exception("Error updating dynamo")

    return user_response['Item']
