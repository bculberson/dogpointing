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
dynamodb = boto3.resource("dynamodb", region_name='us-east-2',
                          endpoint_url="http://dynamodb.us-east-2.amazonaws.com")
table = dynamodb.Table('dp_users')


def lambda_handler(event, context):
    logger.debug('got event{}'.format(event))
    user_key = str(random.randint(0, 999999))
    session_key = event['session_key']
    expiration = time.mktime((datetime.now() + timedelta(days=1)).timetuple())
    item = {
        'user_key': user_key,
        'session_key': session_key,
        'expiration': int(expiration),
        'name': event['user']['name'],
        'observer': event['user']['observer']
    }

    table.put_item(Item=item)
    return item
