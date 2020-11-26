import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { DynamoDBOptions } from './types';

const { SecretFormField, FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<DynamoDBOptions> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  onRegionChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      region: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  // Secure field (only sent to the backend)
  onAccessKeyIDChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      accessKeyId: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onSecretAccessKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      secretAccessKey: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onResetSecretAccessKey = () => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        secretAccessKey: false,
      },
      jsonData: {
        ...options.jsonData,
        secretAccessKey: '',
      },
    });
  };

  render() {
    const { options } = this.props;
    const { jsonData, secureJsonFields } = options;
    // const secureJsonData = (options.secureJsonData || {}) as DynamoDBSecureJsonData;

    return (
      <div className="gf-form-group">
        <div className="gf-form">
          <FormField
            label="AWS Region"
            labelWidth={10}
            inputWidth={20}
            onChange={this.onRegionChange}
            value={jsonData.region || ''}
            placeholder="ap-northeast-1"
          />
        </div>

        <div className="gf-form-inline">
          <div className="gf-form">
            <FormField
              label="Access Key ID"
              labelWidth={10}
              inputWidth={20}
              onChange={this.onAccessKeyIDChange}
              value={jsonData.accessKeyId || ''}
              placeholder="Your access key ID"
            />
          </div>
        </div>

        <div className="gf-form-inline">
          <div className="gf-form">
            <SecretFormField
              isConfigured={(secureJsonFields && secureJsonFields.secretAccessKey) as boolean}
              value={jsonData.secretAccessKey || ''}
              label="Secret Access Key"
              placeholder="Your secret access key"
              labelWidth={10}
              inputWidth={20}
              onReset={this.onResetSecretAccessKey}
              onChange={this.onSecretAccessKeyChange}
            />
          </div>
        </div>
      </div>
    );
  }
}
