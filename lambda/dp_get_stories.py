import boto3
import logging
from boto3.dynamodb.conditions import Key, Attr

logger = logging.getLogger()
logger.setLevel(logging.INFO)
dynamodb = boto3.resource("dynamodb", region_name='us-east-2',
                          endpoint_url="http://dynamodb.us-east-2.amazonaws.com")
table = dynamodb.Table('dp_stories')


def lambda_handler(event, context):
    logger.debug('got event{}'.format(event))
    session_key = event['session_key']

    if event['latest'] != "":
        response = table.query(
            KeyConditionExpression=Key('session_key').eq(session_key),
            ScanIndexForward=False,
            Limit=1
        )
        return response["Items"]
    else:
        response = table.query(
            KeyConditionExpression=Key('session_key').eq(session_key)
        )
        return response["Items"]
