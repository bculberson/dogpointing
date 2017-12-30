import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
dynamodb = boto3.resource("dynamodb", region_name='us-east-2',
                          endpoint_url="http://dynamodb.us-east-2.amazonaws.com")
table = dynamodb.Table('dp_sessions')


def lambda_handler(event, context):
    logger.debug('got event{}'.format(event))
    key = event['key']
    response = table.get_item(Key={'key': key})
    return response['Item']
