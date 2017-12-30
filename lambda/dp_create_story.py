import logging
import boto3
import time
import random
import json
from datetime import datetime
from datetime import timedelta
from boto3.dynamodb.conditions import Key, Attr

logger = logging.getLogger()
logger.setLevel(logging.INFO)
dynamodb = boto3.resource("dynamodb", region_name='us-east-2', endpoint_url="http://dynamodb.us-east-2.amazonaws.com")
story_table = dynamodb.Table('dp_stories')
session_table = dynamodb.Table('dp_sessions')
user_table = dynamodb.Table('dp_users')


def get_user_info(session_key):
  users = {}
  response = user_table.query(
      KeyConditionExpression=Key('session_key').eq(session_key)
  )
  for item in response['Items']:
    if item['observer'] == False:
      users[item['user_key']] = item['name']
  return users


def lambda_handler(event, context):
    logger.debug('got event{}'.format(event))
    session_key = event['session_key']

    users = get_user_info(session_key)
    votes = {}
    for key in users.keys():
      votes[key] = {"key": key, "name": users[key], "value": "Cat"}

    story_key = str(int(round(time.time() * 1000)))
    expiration = time.mktime((datetime.now() + timedelta(days=1)).timetuple())
    item={
        'story_key': story_key,
        'session_key': session_key,
        'expiration': int(expiration),
        'name': event['story']['name'],
        'votes': votes.values(),
        'complete': False,
        }

    story_table.put_item(Item=item)
    return item
