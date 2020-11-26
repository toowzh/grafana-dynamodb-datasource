// import defaults from 'lodash/defaults';

import React, { PureComponent, ChangeEvent } from 'react';
import { Segment } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { DynamoDBOptions, DynamoDBQuery, StringKeyValues } from './types';

import AWS from 'aws-sdk';
import { KeyValue } from 'components/KeyValue';
import { ValueList } from 'components/ValueList';

type Props = QueryEditorProps<DataSource, DynamoDBQuery, DynamoDBOptions>;
interface State {
  tableList: Array<SelectableValue<string>>;
}

export class QueryEditor extends PureComponent<Props, State> {
  onTableChange = (item: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, tableName: item.value || '' });
    onRunQuery();
  };

  onTimeFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, timeField: event.target.value || '' });
    onRunQuery();
  };

  onValueFieldChange = (items: string[]) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, valueFields: items || [] });
    onRunQuery();
  };

  onKeyConditionExpressionChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, keyConditionExpression: event.target.value });
    onRunQuery();
  };

  onExpressionAttributeValuesChange = (keyValues: StringKeyValues) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, expressionAttributeValues: keyValues });
    onRunQuery();
  };

  dynamoDB: AWS.DynamoDB;
  constructor(props: Props) {
    super(props);
    AWS.config.update({
      credentials: new AWS.Credentials(this.props.datasource.accessKeyId, this.props.datasource.secretAccessKey),
      region: this.props.datasource.region,
    });
    this.dynamoDB = new AWS.DynamoDB();
    this.state = {
      tableList: [],
    };
  }

  getTables() {
    this.dynamoDB.listTables((err, data) => {
      const tableList = data.TableNames?.map(x => ({ label: x, value: x } as SelectableValue<string>));
      if (tableList) {
        let newState = { ...this.state, tableList };
        this.setState(newState);
      }
    });
  }

  componentDidMount() {
    this.getTables();
  }

  render() {
    const { tableName, keyConditionExpression, expressionAttributeValues, timeField, valueFields } = this.props.query;
    return (
      <div>
        <div className="gf-form">
          <label className="gf-form-label query-keyword">Table name</label>
          <Segment onChange={this.onTableChange} options={this.state.tableList} value={tableName} />
          <label className="gf-form-label query-keyword">Time Field</label>
          <input type="text" className="gf-form-input" onChange={this.onTimeFieldChange} value={timeField} />
          <label className="gf-form-label query-keyword">Value Fields</label>
          <ValueList values={valueFields} onChange={this.onValueFieldChange} />
        </div>
        <div className="gf-form">
          <label className="gf-form-label query-keyword">Key condition expression</label>
          <input
            type="text"
            className="gf-form-input"
            onChange={this.onKeyConditionExpressionChange}
            value={keyConditionExpression || ''}
          />
        </div>
        <div className="gf-form">
          <label className="gf-form-label query-keyword">Expression attribute values</label>
          <KeyValue keyValues={expressionAttributeValues} onChange={this.onExpressionAttributeValuesChange} />
        </div>
      </div>
    );
  }
}
