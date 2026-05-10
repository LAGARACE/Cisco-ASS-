import type { DashboardData, Status } from "./types";

type JuniperIotApSampleDevice = {
  tags: {
    device_id: string;
    name: string;
    model: string;
    site_id: string;
  };
  fields: {
    ambient_temp: number;
    cpu_temp: number;
    humidity: number;
    pressure: number;
    num_clients: number;
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
  };
};

const sampleDevices: JuniperIotApSampleDevice[] = [
  {
    tags: {
      device_id: "DMUAPJNP01",
      name: "DMUAPJNP01",
      model: "AP45",
      site_id: "dmu-iot-lab"
    },
    fields: {
      ambient_temp: 22.4,
      cpu_temp: 61.8,
      humidity: 45.2,
      pressure: 1012.8,
      num_clients: 46,
      radio_24_util: 24,
      radio_5_util: 41,
      uptime: 1296840,
      accel_x: 0.01,
      accel_y: -0.02,
      accel_z: 0.99,
      radio_24_channel: 6,
      radio_5_channel: 44,
      radio_24_noise_floor: -94,
      radio_5_noise_floor: -97,
      radio_24_clients: 18,
      radio_5_clients: 28,
      power_constrained: false,
      power_budget: 25.5,
      iot_a1_analog: 2.8,
      iot_a2_analog: 1.4,
      iot_a3_analog: 3.1,
      iot_a4_analog: 0.7,
      iot_di1_digital: 1,
      iot_di2_digital: 0
    }
  }
];

export function createMockDashboard(): DashboardData {
  const now = new Date();
  const totalClients = sum(sampleDevices.map((device) => device.fields.num_clients));
  const avgAmbientTemp = average(sampleDevices.map((device) => device.fields.ambient_temp));
  const avgHumidity = average(sampleDevices.map((device) => device.fields.humidity));
  const constrainedCount = sampleDevices.filter((device) => device.fields.power_constrained).length;

  const timeline = Array.from({ length: 12 }, (_, index) => {
    const hour = new Date(now);
    hour.setHours(now.getHours() - (11 - index));
    const activityCurve = 0.72 + Math.sin(index / 2.1) * 0.18 + index * 0.015;

    return {
      time: hour.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      num_clients: Math.round(totalClients * activityCurve),
      ambient_temp: Number((avgAmbientTemp + Math.sin(index / 2.3) * 0.8).toFixed(1)),
      humidity: Number((avgHumidity + Math.cos(index / 2.5) * 2.4).toFixed(1))
    };
  });

  return {
    generatedAt: now.toISOString(),
    overview: [
      {
        label: "Juniper IoT APs",
        value: String(sampleDevices.length),
        detail: "Sample Juniper IoT AP telemetry tags",
        trend: `${sampleDevices.length} active`,
        status: "healthy"
      },
      {
        label: "Connected Clients",
        value: String(totalClients),
        detail: "Sum of num_clients",
        trend: `${sum(sampleDevices.map((device) => device.fields.radio_5_clients))} on 5 GHz`,
        status: "healthy"
      },
      {
        label: "Avg Ambient Temp",
        value: `${avgAmbientTemp.toFixed(1)} C`,
        detail: "Mean ambient_temp",
        trend: `${avgHumidity.toFixed(1)}% RH`,
        status: "warning"
      },
      {
        label: "Power Constrained",
        value: String(constrainedCount),
        detail: "APs with power_constrained=true",
        trend: `${average(sampleDevices.map((device) => device.fields.power_budget)).toFixed(1)} W avg`,
        status: constrainedCount > 0 ? "warning" : "healthy"
      }
    ],
    timeline,
    accessPoints: sampleDevices.map((device) => ({
      id: device.tags.device_id,
      name: `${device.tags.name} (${device.tags.model})`,
      ip: device.tags.device_id,
      room: device.tags.name,
      building: device.tags.site_id,
      cpu_temp: device.fields.cpu_temp,
      pressure: device.fields.pressure,
      num_clients: device.fields.num_clients,
      ambient_temp: device.fields.ambient_temp,
      humidity: device.fields.humidity,
      radio_24_util: device.fields.radio_24_util,
      radio_5_util: device.fields.radio_5_util,
      uptime: device.fields.uptime,
      accel_x: device.fields.accel_x,
      accel_y: device.fields.accel_y,
      accel_z: device.fields.accel_z,
      radio_24_channel: device.fields.radio_24_channel,
      radio_5_channel: device.fields.radio_5_channel,
      radio_24_noise_floor: device.fields.radio_24_noise_floor,
      radio_5_noise_floor: device.fields.radio_5_noise_floor,
      radio_24_clients: device.fields.radio_24_clients,
      radio_5_clients: device.fields.radio_5_clients,
      power_constrained: device.fields.power_constrained,
      power_budget: device.fields.power_budget,
      iot_a1_analog: device.fields.iot_a1_analog,
      iot_a2_analog: device.fields.iot_a2_analog,
      iot_a3_analog: device.fields.iot_a3_analog,
      iot_a4_analog: device.fields.iot_a4_analog,
      iot_di1_digital: device.fields.iot_di1_digital,
      iot_di2_digital: device.fields.iot_di2_digital,
      status: getDeviceStatus(device)
    })),
    collector: {
      host: "juniper-iot-ap-collector",
      protocol: "Juniper IoT AP telemetry",
      metrics: [
        {
          label: "CPU Temp",
          value: `${average(sampleDevices.map((device) => device.fields.cpu_temp)).toFixed(1)} C`,
          detail: "Mean cpu_temp",
          status: "warning"
        },
        {
          label: "2.4 GHz Util",
          value: `${average(sampleDevices.map((device) => device.fields.radio_24_util)).toFixed(0)}%`,
          detail: "Mean radio_24_util",
          status: "healthy"
        },
        {
          label: "5 GHz Util",
          value: `${average(sampleDevices.map((device) => device.fields.radio_5_util)).toFixed(0)}%`,
          detail: "Mean radio_5_util",
          status: "warning"
        },
        {
          label: "Avg Uptime",
          value: formatUptime(average(sampleDevices.map((device) => device.fields.uptime))),
          detail: "Mean uptime",
          status: "healthy"
        }
      ],
      events: [
        {
          id: "collector-schema",
          service: "Sample schema",
          message: "Tags: device_id, name, model, site_id",
          startedAt: "Live",
          severity: "healthy"
        },
        {
          id: "collector-fields",
          service: "Juniper IoT AP fields",
          message: "Using AP telemetry plus Juniper IO pins: iot_a1_analog, iot_a2_analog, iot_a3_analog, iot_a4_analog, iot_di1_digital, and iot_di2_digital",
          startedAt: "Sample data",
          severity: "warning"
        }
      ]
    },
    insights: [
      {
        id: "ins-DMUAPJNP01-stable",
        service: "DMUAPJNP01",
        message: "AP telemetry is healthy: ambient_temp, cpu_temp, humidity, radio_24_util, radio_5_util, radio_24_noise_floor, radio_5_noise_floor, and power_budget are within expected ranges.",
        startedAt: "latest sample",
        severity: "healthy"
      }
    ]
  };
}

export function getSampleJuniperIotApDevices(): JuniperIotApSampleDevice[] {
  return sampleDevices;
}

function getDeviceStatus(device: JuniperIotApSampleDevice): Status {
  if (device.fields.cpu_temp >= 80) {
    return "critical";
  }

  if (
    device.fields.power_constrained ||
    device.fields.radio_24_util >= 80 ||
    device.fields.radio_5_util >= 80
  ) {
    return "warning";
  }

  return "healthy";
}

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function formatUptime(seconds: number): string {
  const days = Math.round(seconds / 86400);
  return `${days}d`;
}
