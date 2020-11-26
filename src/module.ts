import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './DataSource';
import { ConfigEditor } from './ConfigEditor';
import { QueryEditor } from './QueryEditor';
import { DynamoDBQuery, DynamoDBOptions } from './types';

export const plugin = new DataSourcePlugin<DataSource, DynamoDBQuery, DynamoDBOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
