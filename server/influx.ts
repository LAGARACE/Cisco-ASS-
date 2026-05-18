import { InfluxDB } from "@influxdata/influxdb-client";
import type {
  AccessPoint,
  CollectorMetric,
  DashboardData,
  Insight,
  Status,
  TimePoint
} from "./types";
import { createMockDashboard } from "./mockData";

type InfluxConfig = {
  url: string;
  token: string;
  org: string;
  bucket: string;
  mockData: boolean;
  measurement: string;
};

type JuniperIotApTelemetryRecord = {
  time: string;
  deviceId: string;
  name: string;
  model: string;
  siteId: string;
  ambientTemp?: number;
  cpuTemp?: number;
  humidity?: number;
  pressure?: number;
  numClients?: number;
  radio24Util?: number;
  radio5Util?: number;
  uptime?: number;
  accelX?: number;
  accelY?: number;
  accelZ?: number;
  radio24Channel?: number;
  radio5Channel?: number;
  radio24NoiseFloor?: number;
  radio5NoiseFloor?: number;
  radio24Clients?: number;
  radio5Clients?: number;
  powerConstrained?: boolean;
  powerBudget?: number;
  iotA1Analog?: number;
  iotA2Analog?: number;
  iotA3Analog?: number;
  iotA4Analog?: number;
  iotDi1Digital?: number;
  iotDi2Digital?: number;
};

function getInfluxConfig(): InfluxConfig {
  return {
    url: process.env.INFLUX_URL ?? "http://localhost:8086",
    token: process.env.INFLUX_TOKEN ?? "",
    org: process.env.INFLUX_ORG ?? "",
    bucket: process.env.INFLUX_BUCKET ?? "",
    mockData: process.env.MOCK_DATA !== "false",
    measurement: process.env.INFLUX_MEASUREMENT ?? "mist_telemetry"
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const config = getInfluxConfig();

  if (config.mockData || !config.token || !config.org || !config.bucket) {
    return createMockDashboard();
  }

  try {
    return await queryJuniperIotApDashboard(config);
  } catch (error) {
    console.error("InfluxDB query failed, returning mock dashboard", error);
    return createMockDashboard();
  }
}

async function queryJuniperIotApDashboard(config: InfluxConfig): Promise<DashboardData> {
  const [timeline, latest] = await Promise.all([
    queryRoomTimeline(config),
    queryLatestDeviceTelemetry(config)
  ]);

  if (timeline.length === 0 && latest.length === 0) {
    return createMockDashboard();
  }

  const accessPoints = createAccessPoints(latest);
  const overview = createOverview(accessPoints, latest);
  const collectorMetrics = createCollectorMetrics(latest);
  const insights = createInsights(accessPoints, latest);

  return {
    generatedAt: new Date().toISOString(),
    overview,
    timeline: timeline.length > 0 ? timeline : createTimelineFromLatest(latest),
    accessPoints,
    collector: {
      host: new URL(config.url).host,
      protocol: "Juniper IoT AP telemetry",
      metrics: collectorMetrics,
      events: [
        {
          id: "collector-live",
          service: "InfluxDB feed",
          message: `${latest.length} AP device streams read from ${config.bucket}/${config.measurement}`,
          startedAt: "Live",
          severity: latest.length > 0 ? "healthy" : "warning"
        },
        {
          id: "collector-power",
          service: "Power budget",
          message: summarizePowerState(latest),
          startedAt: "Latest sample",
          severity: latest.some((record) => record.powerConstrained) ? "warning" : "healthy"
        }
      ]
    },
    insights
  };
}

async function queryRoomTimeline(config: InfluxConfig): Promise<TimePoint[]> {
  const queryApi = new InfluxDB({ url: config.url, token: config.token }).getQueryApi(config.org);
  const flux = `
from(bucket: "${config.bucket}")
  |> range(start: -12h)
  |> filter(fn: (r) => r._measurement == "${config.measurement}")
  |> filter(fn: (r) => r._field == "num_clients" or r._field == "ambient_temp" or r._field == "humidity")
  |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
  |> yield(name: "hourly")
`;

  const byTime = new Map<string, TimePoint>();

  await new Promise<void>((resolve, reject) => {
    queryApi.queryRows(flux, {
      next(row, tableMeta) {
        const record = tableMeta.toObject(row);
        const date = new Date(String(record._time));
        const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        const point = byTime.get(time) ?? {
          time,
          num_clients: 0,
          ambient_temp: 0,
          humidity: 0
        };

        if (record._field === "num_clients") {
          point.num_clients = Math.round(Number(record._value));
        }

        if (record._field === "ambient_temp") {
          point.ambient_temp = Number(Number(record._value).toFixed(1));
        }

        if (record._field === "humidity") {
          point.humidity = Number(Number(record._value).toFixed(1));
        }

        byTime.set(time, point);
      },
      error: reject,
      complete: resolve
    });
  });

  return Array.from(byTime.values());
}

async function queryLatestDeviceTelemetry(config: InfluxConfig): Promise<JuniperIotApTelemetryRecord[]> {
  const queryApi = new InfluxDB({ url: config.url, token: config.token }).getQueryApi(config.org);
  const flux = `
from(bucket: "${config.bucket}")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "${config.measurement}")
  |> filter(fn: (r) =>
    r._field == "ambient_temp" or
    r._field == "cpu_temp" or
    r._field == "humidity" or
    r._field == "pressure" or
    r._field == "num_clients" or
    r._field == "radio_24_util" or
    r._field == "radio_5_util" or
    r._field == "uptime" or
    r._field == "accel_x" or
    r._field == "accel_y" or
    r._field == "accel_z" or
    r._field == "radio_24_channel" or
    r._field == "radio_5_channel" or
    r._field == "radio_24_noise_floor" or
    r._field == "radio_5_noise_floor" or
    r._field == "radio_24_clients" or
    r._field == "radio_5_clients" or
    r._field == "power_constrained" or
    r._field == "power_budget" or
    r._field == "iot_a1_analog" or
    r._field == "iot_a2_analog" or
    r._field == "iot_a3_analog" or
    r._field == "iot_a4_analog" or
    r._field == "iot_di1_digital" or
    r._field == "iot_di2_digital"
  )
  |> group(columns: ["device_id", "name", "model", "site_id", "_field"])
  |> last()
  |> pivot(rowKey: ["device_id", "name", "model", "site_id"], columnKey: ["_field"], valueColumn: "_value")
`;

  const records: JuniperIotApTelemetryRecord[] = [];

  await new Promise<void>((resolve, reject) => {
    queryApi.queryRows(flux, {
      next(row, tableMeta) {
        const record = tableMeta.toObject(row);
        records.push({
          time: new Date().toISOString(),
          deviceId: String(record.device_id ?? "unknown-device"),
          name: String(record.name ?? record.device_id ?? "Unnamed AP"),
          model: String(record.model ?? "Unknown model"),
          siteId: String(record.site_id ?? "Unknown site"),
          ambientTemp: toNumber(record.ambient_temp),
          cpuTemp: toNumber(record.cpu_temp),
          humidity: toNumber(record.humidity),
          pressure: toNumber(record.pressure),
          numClients: toNumber(record.num_clients),
          radio24Util: toNumber(record.radio_24_util),
          radio5Util: toNumber(record.radio_5_util),
          uptime: toNumber(record.uptime),
          accelX: toNumber(record.accel_x),
          accelY: toNumber(record.accel_y),
          accelZ: toNumber(record.accel_z),
          radio24Channel: toNumber(record.radio_24_channel),
          radio5Channel: toNumber(record.radio_5_channel),
          radio24NoiseFloor: toNumber(record.radio_24_noise_floor),
          radio5NoiseFloor: toNumber(record.radio_5_noise_floor),
          radio24Clients: toNumber(record.radio_24_clients),
          radio5Clients: toNumber(record.radio_5_clients),
          powerConstrained: toBoolean(record.power_constrained),
          powerBudget: toNumber(record.power_budget),
          iotA1Analog: toNumber(record.iot_a1_analog),
          iotA2Analog: toNumber(record.iot_a2_analog),
          iotA3Analog: toNumber(record.iot_a3_analog),
          iotA4Analog: toNumber(record.iot_a4_analog),
          iotDi1Digital: toNumber(record.iot_di1_digital),
          iotDi2Digital: toNumber(record.iot_di2_digital)
        });
      },
      error: reject,
      complete: resolve
    });
  });

  return records.sort((a, b) => (b.numClients ?? 0) - (a.numClients ?? 0));
}

function createAccessPoints(records: JuniperIotApTelemetryRecord[]): AccessPoint[] {
  return records.slice(0, 12).map((record) => {
    const clients = record.numClients ?? (record.radio24Clients ?? 0) + (record.radio5Clients ?? 0);
    const radioUtil = Math.max(record.radio24Util ?? 0, record.radio5Util ?? 0);

    return {
      id: record.deviceId,
      name: record.name,
      ip: record.deviceId,
      room: record.name,
      building: record.siteId,
      cpu_temp: round1(record.cpuTemp),
      pressure: round1(record.pressure),
      num_clients: clients,
      ambient_temp: round1(record.ambientTemp),
      humidity: round1(record.humidity),
      radio_24_util: round1(record.radio24Util),
      radio_5_util: round1(record.radio5Util),
      uptime: Math.round(record.uptime ?? 0),
      accel_x: round1(record.accelX),
      accel_y: round1(record.accelY),
      accel_z: round1(record.accelZ),
      radio_24_channel: Math.round(record.radio24Channel ?? 0),
      radio_5_channel: Math.round(record.radio5Channel ?? 0),
      radio_24_noise_floor: round1(record.radio24NoiseFloor),
      radio_5_noise_floor: round1(record.radio5NoiseFloor),
      radio_24_clients: Math.round(record.radio24Clients ?? 0),
      radio_5_clients: Math.round(record.radio5Clients ?? 0),
      power_constrained: Boolean(record.powerConstrained),
      power_budget: round1(record.powerBudget),
      iot_a1_analog: round1(record.iotA1Analog),
      iot_a2_analog: round1(record.iotA2Analog),
      iot_a3_analog: round1(record.iotA3Analog),
      iot_a4_analog: round1(record.iotA4Analog),
      iot_di1_digital: Math.round(record.iotDi1Digital ?? 0),
      iot_di2_digital: Math.round(record.iotDi2Digital ?? 0),
      status: getDeviceStatus(record, radioUtil)
    };
  });
}

function createOverview(accessPoints: AccessPoint[], records: JuniperIotApTelemetryRecord[]) {
  const avgTemp = average(records.map((record) => record.ambientTemp));
  const avgHumidity = average(records.map((record) => record.humidity));
  const totalClients = sum(records.map((record) => record.numClients));
  const constrained = records.filter((record) => record.powerConstrained).length;

  return [
    {
      label: "Juniper IoT APs",
      value: String(records.length),
      detail: "Devices reporting telemetry",
      trend: `${accessPoints.length} shown`,
      status: records.length > 0 ? "healthy" : "critical"
    },
    {
      label: "Connected Clients",
      value: String(totalClients),
      detail: "Latest num_clients total",
      trend: `${sum(records.map((record) => record.radio5Clients))} on 5 GHz`,
      status: totalClients > 0 ? "healthy" : "warning"
    },
    {
      label: "Avg Ambient Temp",
      value: `${avgTemp.toFixed(1)} C`,
      detail: "From ambient_temp field",
      trend: `${avgHumidity.toFixed(1)}% RH`,
      status: avgTemp >= 28 ? "warning" : "healthy"
    },
    {
      label: "Power Constrained",
      value: String(constrained),
      detail: "APs reporting reduced budget",
      trend: `${average(records.map((record) => record.powerBudget)).toFixed(0)} W avg`,
      status: constrained > 0 ? "warning" : "healthy"
    }
  ] satisfies DashboardData["overview"];
}

function createCollectorMetrics(records: JuniperIotApTelemetryRecord[]): CollectorMetric[] {
  const avgCpu = average(records.map((record) => record.cpuTemp));
  const avgRadio24 = average(records.map((record) => record.radio24Util));
  const avgRadio5 = average(records.map((record) => record.radio5Util));
  const avgUptime = average(records.map((record) => record.uptime));

  return [
    {
      label: "CPU Temp",
      value: `${avgCpu.toFixed(1)} C`,
      detail: "Average cpu_temp",
      status: avgCpu >= 80 ? "critical" : avgCpu >= 70 ? "warning" : "healthy"
    },
    {
      label: "2.4 GHz Util",
      value: `${avgRadio24.toFixed(0)}%`,
      detail: "Average radio_24_util",
      status: avgRadio24 >= 80 ? "warning" : "healthy"
    },
    {
      label: "5 GHz Util",
      value: `${avgRadio5.toFixed(0)}%`,
      detail: "Average radio_5_util",
      status: avgRadio5 >= 80 ? "warning" : "healthy"
    },
    {
      label: "Avg Uptime",
      value: formatUptime(avgUptime),
      detail: "Latest uptime mean",
      status: "healthy"
    }
  ];
}

function createInsights(accessPoints: AccessPoint[], records: JuniperIotApTelemetryRecord[]): Insight[] {
  const hotDevices = records.filter((record) => (record.cpuTemp ?? 0) >= 80);
  const constrained = records.filter((record) => record.powerConstrained);
  const busyRadios = records.filter(
    (record) => Math.max(record.radio24Util ?? 0, record.radio5Util ?? 0) >= 80
  );

  const insights: Insight[] = [
    ...hotDevices.slice(0, 2).map((record) => ({
      id: `cpu-${record.deviceId}`,
      service: record.name,
      message: `cpu_temp is ${round1(record.cpuTemp)} C; check AP ventilation or load.`,
      startedAt: "latest sample",
      severity: "critical" as Status
    })),
    ...constrained.slice(0, 2).map((record) => ({
      id: `power-${record.deviceId}`,
      service: record.name,
      message: `Power constrained with ${round1(record.powerBudget)} W budget; verify switch PoE allocation.`,
      startedAt: "latest sample",
      severity: "warning" as Status
    })),
    ...busyRadios.slice(0, 2).map((record) => ({
      id: `radio-${record.deviceId}`,
      service: record.name,
      message: `High radio utilization detected; 2.4 GHz ${round1(record.radio24Util)}%, 5 GHz ${round1(record.radio5Util)}%.`,
      startedAt: "latest sample",
      severity: "warning" as Status
    }))
  ];

  if (insights.length > 0) {
    return insights;
  }

  return accessPoints.slice(0, 3).map((ap) => ({
    id: `stable-${ap.id}`,
    service: ap.name,
    message: `${ap.num_clients} clients, ${ap.ambient_temp} C, ${ap.humidity}% humidity. Telemetry is within normal bands.`,
    startedAt: "latest sample",
    severity: "healthy"
  }));
}

function createTimelineFromLatest(records: JuniperIotApTelemetryRecord[]): TimePoint[] {
  const now = new Date();
  const clients = sum(records.map((record) => record.numClients));
  const temp = average(records.map((record) => record.ambientTemp));
  const humidity = average(records.map((record) => record.humidity));

  return [
    {
      time: now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      num_clients: clients,
      ambient_temp: round1(temp),
      humidity: round1(humidity)
    }
  ];
}

function getDeviceStatus(record: JuniperIotApTelemetryRecord, radioUtil: number): Status {
  if ((record.cpuTemp ?? 0) >= 80) {
    return "critical";
  }

  if (record.powerConstrained || radioUtil >= 80 || (record.ambientTemp ?? 0) >= 28) {
    return "warning";
  }

  return "healthy";
}

function summarizePowerState(records: JuniperIotApTelemetryRecord[]): string {
  const constrained = records.filter((record) => record.powerConstrained).length;

  if (constrained > 0) {
    return `${constrained} APs are reporting power_constrained=true.`;
  }

  return "No APs are currently reporting power constraint.";
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function average(values: Array<number | undefined>): number {
  const validValues = values.filter((value): value is number => value !== undefined);

  if (validValues.length === 0) {
    return 0;
  }

  return sum(validValues) / validValues.length;
}

function sum(values: Array<number | undefined>): number {
  return Math.round(
    values.reduce<number>((total, value) => total + (Number.isFinite(value) ? Number(value) : 0), 0)
  );
}

function round1(value: number | undefined): number {
  return Number((value ?? 0).toFixed(1));
}

function formatUptime(seconds: number): string {
  if (seconds <= 0) {
    return "0h";
  }

  const hours = seconds > 86400 ? seconds / 3600 : seconds;

  if (hours >= 24) {
    return `${Math.round(hours / 24)}d`;
  }

  return `${Math.round(hours)}h`;
}
