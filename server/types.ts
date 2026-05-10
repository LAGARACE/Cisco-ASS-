export type Status = "healthy" | "warning" | "critical";

export type MetricCard = {
  label: string;
  value: string;
  detail: string;
  trend: string;
  status: Status;
};

export type TimePoint = {
  time: string;
  num_clients: number;
  ambient_temp: number;
  humidity: number;
};

export type AccessPoint = {
  id: string;
  name: string;
  ip: string;
  room: string;
  building: string;
  cpu_temp: number;
  pressure: number;
  num_clients: number;
  ambient_temp: number;
  humidity: number;
  radio_24_util: number;
  radio_5_util: number;
  uptime: number;
  accel_x: number;
  accel_y: number;
  accel_z: number;
  radio_24_channel: number;
  radio_5_channel: number;
  radio_24_noise_floor: number;
  radio_5_noise_floor: number;
  radio_24_clients: number;
  radio_5_clients: number;
  power_constrained: boolean;
  power_budget: number;
  iot_a1_analog: number;
  iot_a2_analog: number;
  iot_a3_analog: number;
  iot_a4_analog: number;
  iot_di1_digital: number;
  iot_di2_digital: number;
  status: Status;
};

export type CollectorMetric = {
  label: string;
  value: string;
  detail: string;
  status: Status;
};

export type Insight = {
  id: string;
  service: string;
  message: string;
  startedAt: string;
  severity: Status;
};

export type DashboardData = {
  generatedAt: string;
  overview: MetricCard[];
  timeline: TimePoint[];
  accessPoints: AccessPoint[];
  collector: {
    host: string;
    protocol: string;
    metrics: CollectorMetric[];
    events: Insight[];
  };
  insights: Insight[];
};
