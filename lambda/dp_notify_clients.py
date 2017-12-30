import json
import logging
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)
iot_client = boto3.client('iot-data', region_name='us-east-2')


def lambda_handler(event, context):
    logger.debug(event)

    for record in event['Records']:
        votes = []
        for vote in record['dynamodb']['NewImage']['votes']['L']:
            votes.append({"value": vote['M']['value']['S'], "name": vote['M']['name']['S'], "key": vote['M']['key']['S']})
        session_key = record['dynamodb']['Keys']['session_key']['S']
        item={
            'story_key': record['dynamodb']['Keys']['story_key']['S'],
            'session_key': session_key,
            'expiration': record['dynamodb']['NewImage']['expiration']['N'],
            'name': record['dynamodb']['NewImage']['name']['S'],
            'votes': votes,
            'complete': record['dynamodb']['NewImage']['complete']['BOOL'],
            }
        logger.debug(item)
        topic = "dp/%s" % session_key
        iot_client.publish(
            topic=topic,
            qos=1,
            payload=json.dumps(item))
    return 'Successfully processed {} records.'.format(len(event['Records']))
