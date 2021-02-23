import React, { Component } from 'react';
import { Button, Icon } from '@grafana/ui';

export interface Props {
  values: string[];
  onChange: (values: string[]) => void;
}

export class ValueList extends Component<Props> {
  render() {
    const { values, onChange } = this.props;
    return (
      <div className="gf-form">
        {values &&
          values.map((value, index) => (
            <input
              key={`{key}-key`}
              type="text"
              className="gf-form-input"
              value={value || ''}
              data-index={index}
              onChange={(e) => {
                const index = Number(e.target.dataset.index);
                const value = e.target.value;
                values[index] = value;
                onChange(values);
              }}
              onBlur={() => onChange(values.filter((x) => x !== ''))}
            />
          ))}
        <Button onClick={() => onChange([...(values || []), ''])} className="gf-form-label query-part">
          <Icon name="plus" />
        </Button>
      </div>
    );
  }
}
