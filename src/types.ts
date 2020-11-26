import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface DynamoDBQuery extends DataQuery {
  tableName: string;
  timeField: string;
  valueFields: string[];
  keyConditionExpression: string;
  expressionAttributeValues: StringKeyValues;
}

export const defaultQuery: Partial<DynamoDBQuery> = {};

/**
 * These are options configured for each DataSource instance
 */
export interface DynamoDBOptions extends DataSourceJsonData {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface DynamoDBSecureJsonData {}

export type StringKeyValues = { [key: string]: string };
