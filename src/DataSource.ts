import defaults from 'lodash/defaults';

import {
  DataQueryRequest,
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

  async query(options: DataQueryRequest<DynamoDBQuery>) {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();

    // Return a constant for each query.
    const promises = options.targets.map((target) => {
      const query = defaults(target, defaultQuery);
      let expressionAttributeValues: ExpressionAttributeValueMap = AWS.DynamoDB.Converter.marshall({
        ...query.expressionAttributeValues,
        ':from': from / 1000,
        ':to': to / 1000,
      });
      console.log([query.timeField, ...query.valueFields].join(', '));
      const queryInput: AWS.DynamoDB.QueryInput = {
        TableName: query.tableName,
        KeyConditionExpression: `${query.keyConditionExpression} AND ${query.timeField} BETWEEN :from AND :to`,
        ProjectionExpression: [query.timeField, ...query.valueFields].join(', '),
        ExpressionAttributeValues: expressionAttributeValues,
      };

      const results = this.doQuery(queryInput);
      return this.processData(results, query);
    });

    return Promise.all(promises).then((data) => ({ data }));
  }

  async doQuery(queryInput: AWS.DynamoDB.QueryInput) {
    let _queryInput = { ...queryInput };
    let response = await this.dynamoDB.query(_queryInput).promise();
    let temp = response.Items;
    console.log(temp);
    if (!temp) {
      return null;
    }
    let results = temp.map((x) => AWS.DynamoDB.Converter.unmarshall(x));

    while (response.LastEvaluatedKey) {
      console.log(response.LastEvaluatedKey);
      _queryInput.ExclusiveStartKey = response.LastEvaluatedKey;
      response = await this.dynamoDB.query(_queryInput).promise();
      if (!response.Items) {
        break;
      }
      results = results.concat(response.Items.map((x) => AWS.DynamoDB.Converter.unmarshall(x)));
      console.log(response.Items);
    }
    results = results.sort((a, b) => a['date_time'] - b['date_time']);
    return results;
  }

  async processData(
    results: Promise<Array<{ [key: string]: any }> | null>,
    query: Partial<DynamoDBQuery> & DynamoDBQuery
  ): Promise<MutableDataFrame<any> | null> {
    const data = await results;
    console.log(data);
    if (data && data.length >= 1) {
      let timeList = data.map((x_1) => new Date(Number(x_1[query.timeField]) * 1000));
      let temp: { [key: string]: any[] } = {};
      data.forEach((x_2) => {
        Object.keys(x_2).forEach((k) => {
          temp[k] = [];
        });
      });
      data.forEach((x_3) => {
        const keys = Object.keys(x_3);
        query.valueFields
          .filter((k_1) => keys.indexOf(k_1) === -1)
          .forEach((k_2) => {
            temp[k_2].push(null);
          });
        keys.forEach((k_3) => {
          temp[k_3].push(x_3[k_3]);
        });
      });
      const values = Object.keys(temp)
        .filter((k_4) => query.valueFields.indexOf(k_4) !== -1)
        .map((k_5) => ({
          name: k_5,
          values: temp[k_5],
          type: FieldType.number,
        }));
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

      return frame;
    }
    return null;
  }

  async testDatasource() {
    // Implement a health check for your data source.
    return {
      status: 'success',
      message: 'Success',
    };
  }
}
