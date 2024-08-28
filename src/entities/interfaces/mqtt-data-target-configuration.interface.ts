export interface MqttDataTargetConfiguration {
  url: string;
  port: number;
  topic: string;
  qos: 0 | 1 | 2;
  timeout: number;
  username?: string;
  password?: string;
}
