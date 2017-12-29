import logging
import boto3
import botocore
import time
import random
import json
from datetime import datetime
from datetime import timedelta
from boto3.dynamodb.conditions import Key

logger = logging.getLogger()
logger.setLevel(logging.INFO)
dynamodb = boto3.resource("dynamodb", region_name='us-east-2', endpoint_url="http://dynamodb.us-east-2.amazonaws.com")
table = dynamodb.Table('dp_stories')
user_table = dynamodb.Table('dp_users')
iot_client = boto3.client('iot-data', region_name='us-east-2')


def vote_to_point(vote):
    if vote == "Chihuahua":
        return 0
    elif vote == "Corgi":
        return 1
    elif vote == "Pitbull":
        return 2
    elif vote == "Labrador":
        return 3
    elif vote == "Great Dane":
        return 4
    else:
        return 9


def cmp_votes(a, b):
    if vote_to_point(a["value"]) > vote_to_point(b["value"]):
        return 1
    elif vote_to_point(a["value"]) == vote_to_point(b["value"]):
        return 0
    else:
        return -1


def get_user(session_key, user_key):
    try:
        response = user_table.get_item(Key={'session_key': str(session_key), 'user_key': user_key})
        return response['Item']
    except botocore.exceptions.ClientError as e:
        return None


def lambda_handler(event, context):
    logger.debug('got event{}'.format(event))
    story_key = event['story_key']
    session_key = event['session_key']
    expiration = time.mktime((datetime.now() + timedelta(days=1)).timetuple())

    # validate vote
    user_key = event['story']['user_key']
    vote = event['story']['vote']

    user = get_user(session_key, user_key)
    if user is None:
      raise Exception('Vote not valid')

    response = table.get_item(Key={'story_key': story_key, 'session_key': session_key})
    story = response['Item']
    logger.debug('got story{}'.format(story))
    old_expiration = story['expiration']

    votes = {}
    for v in story["votes"]:
      votes[v["key"]] = v

    votes[user_key] = {"key": user_key, "name": user['name'], "value": vote}

    # is it complete?
    complete = True
    for vote in votes.values():
      if vote["value"] == "Cat":
        complete = False
        break

    votes_sorted = list(votes.values())
    votes_sorted.sort(cmp_votes)

    # save votes
    try:
      response = table.update_item(
        Key={'story_key': str(story_key), 'session_key': session_key},
        UpdateExpression="set votes = :votes, expiration = :expiration, complete = :complete",
        ConditionExpression='closed = :exp_closed and complete = :exp_complete and expiration = :exp_expiration',
        ExpressionAttributeValues={
          ':votes': votes_sorted,
          ':expiration': int(expiration),
          ':complete': complete,
          ':exp_expiration': old_expiration,
          ':exp_closed': False,
          ':exp_complete': False,
        },
        ReturnValues="UPDATED_NEW"
      )
    except botocore.exceptions.ClientError as e:
      raise Exception("Error updating dynamo")

    response = table.get_item(Key={'story_key': story_key, 'session_key': session_key})
    # publish story
    item={
        'story_key': str(story_key),
        'session_key': session_key,
        'expiration': int(expiration),
        'name': response['Item']['name'],
        'votes': response['Item']['votes'],
        'closed': False,
        'complete': complete,
        }
    topic = "dp/%s" % str(session_key)
    iot_client.publish(
            topic=topic,
            qos=1,
            payload=json.dumps(item))
    return response["Item"]
