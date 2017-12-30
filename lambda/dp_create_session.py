import logging
import boto3
import time
import random
import string
from datetime import datetime
from datetime import timedelta

logger = logging.getLogger()
logger.setLevel(logging.INFO)
dynamodb = boto3.resource("dynamodb", region_name='us-east-2', endpoint_url="http://dynamodb.us-east-2.amazonaws.com")
table = dynamodb.Table('dp_sessions')

def lambda_handler(event, context):
    logger.debug('got event{}'.format(event))
    key = ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(5))
    expiration = time.mktime((datetime.now() + timedelta(days=1)).timetuple())
    item={
        'key': key,
        'expiration': int(expiration),
        }

    table.put_item(Item=item)
    return item
