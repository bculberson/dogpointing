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
iot_client = boto3.client('iot-data', region_name='us-east-2')


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
    session_response = session_table.get_item(Key={'key': session_key})
    session = session_response['Item']
    if 'max_story_key' in session:
        story_key = session['max_story_key']
        # close old story
        response = story_table.update_item(
          Key={'story_key': str(story_key), 'session_key': session_key},
          UpdateExpression="set closed = :closed",
          ExpressionAttributeValues={
            ':closed': True
          },
          ReturnValues="UPDATED_NEW"
        )
        story_key = story_key + 1
    else:
        story_key = 1

    session['max_story_key'] = story_key
    response = session_table.update_item(
      Key={'key': session_key},
      UpdateExpression="set max_story_key = :max_story_key",
      ExpressionAttributeValues={
        ':max_story_key': story_key
      },
      ReturnValues="UPDATED_NEW"
    )

    users = get_user_info(session_key)
    votes = {}
    for key in users.keys():
      votes[key] = {"key": key, "name": users[key], "value": "Cat"}

    expiration = time.mktime((datetime.now() + timedelta(days=1)).timetuple())
    item={
        'story_key': str(story_key),
        'session_key': session_key,
        'expiration': int(expiration),
        'name': event['story']['name'],
        'votes': votes.values(),
        'closed': False,
        'complete': False,
        }

    story_table.put_item(Item=item)

    response = story_table.get_item(Key={'story_key': str(story_key), 'session_key': session_key})
    # publish story
    topic = "dp/%s" % str(session_key)
    iot_client.publish(
            topic=topic,
            qos=1,
            payload=json.dumps(item))
    return response['Item']
