import React, { Component } from 'react';
import { StringKeyValues } from '../types';
import { Button, Icon } from '@grafana/ui';

export interface Props {
  keyValues: StringKeyValues;
  onChange: (values: StringKeyValues) => void;
}

export class KeyValue extends Component<Props> {
  render() {
    const { keyValues, onChange } = this.props;
    return (
      <div className="gf-form">
        {keyValues &&
          Object.keys(keyValues).map((key) => [
            <input
              key={`{key}-key`}
              type="text"
              className="gf-form-input"
              value={key || ''}
              data-originkey={key}
              onChange={(e) => {
                const originKey = e.target.dataset.originkey || '';
                const value = e.target.value;
                if (!keyValues[value]) {
                  let newKeyValues = { ...keyValues };
                  delete newKeyValues[originKey];
                  if (value !== '') {
                    newKeyValues[value] = keyValues[originKey];
                  }
                  onChange(newKeyValues);
                }
              }}
            />,
            <label className="gf-form-label query-keyword" key={`{key}-label`}>
              =
            </label>,
            <input
              key={`{key}-value`}
              type="text"
              className="gf-form-input"
              value={keyValues[key] || ''}
              data-originkey={key}
              onChange={(e) => {
                const originKey = e.target.dataset.originkey || '';
                const value = e.target.value;
                let newKeyValues = { ...keyValues };
                newKeyValues[originKey] = value;
                onChange(newKeyValues);
              }}
            />,
          ])}
        <Button onClick={() => onChange({ ...keyValues, '': '' })} className="gf-form-label query-part">
          <Icon name="plus" />
        </Button>
      </div>
    );
  }
}
