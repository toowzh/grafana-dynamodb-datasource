import defaults from 'lodash/defaults';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';

import { DynamoDBQuery, DynamoDBOptions, defaultQuery } from './types';

import AWS from 'aws-sdk';
import { ExpressionAttributeValueMap } from 'aws-sdk/clients/dynamodb';

export class DataSource extends DataSourceApi<DynamoDBQuery, DynamoDBOptions> {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;

  dynamoDB: AWS.DynamoDB;
  constructor(instanceSettings: DataSourceInstanceSettings<DynamoDBOptions>) {
    super(instanceSettings);

    this.region = instanceSettings.jsonData.region || 'us-east-1';
    this.accessKeyId = instanceSettings.jsonData.accessKeyId || '';
    this.secretAccessKey = instanceSettings.jsonData.secretAccessKey || '';
    AWS.config.update({
      credentials: new AWS.Credentials(this.accessKeyId, this.secretAccessKey),
      region: this.region,
    });
    this.dynamoDB = new AWS.DynamoDB();
  }

  async query(options: DataQueryRequest<DynamoDBQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();

    // Return a constant for each query.
    const promises = options.targets.map(target => {
      const query = defaults(target, defaultQuery);
      console.log('query', query);
      console.log('from', from);
      console.log('to', to);
      let expressionAttributeValues: ExpressionAttributeValueMap = AWS.DynamoDB.Converter.marshall(
        query.expressionAttributeValues
      );
      const queryInput: AWS.DynamoDB.QueryInput = {
        TableName: query.tableName,
        KeyConditionExpression: query.keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
      };
      return this.dynamoDB
        .query(queryInput)
        .promise()
        .then(data => {
          if (data.Items && data.Items.length >= 1) {
            const items = data.Items.map(x => AWS.DynamoDB.Converter.unmarshall(x));
            let timeList = items.map(x => Date.parse(x[query.timeField]));
            let temp: { [key: string]: any[] } = {};
            items.forEach(x => {
              Object.keys(x).forEach(k => {
                temp[k] = [];
              });
            });
            items.forEach(x => {
              Object.keys(x).forEach(k => {
                temp[k].push(x[k]);
              });
            });
            const values = Object.keys(temp)
              .filter(k => query.valueFields.indexOf(k) !== -1)
              .map(k => ({
                name: k,
                values: temp[k],
                type: FieldType.number,
              }));
            console.log(values);
            const frame = new MutableDataFrame({
              refId: query.refId,
              fields: [
                {
                  name: 'Time',
                  values: timeList,
                  type: FieldType.time,
                },
                ...values,
              ],
              length: timeList.length,
            });

            console.log(frame);
            return frame;
          }
          return null;
        });
    });

    return Promise.all(promises).then(data => ({ data }));
  }

  async testDatasource() {
    // Implement a health check for your data source.
    return {
      status: 'success',
      message: 'Success',
    };
  }
}
