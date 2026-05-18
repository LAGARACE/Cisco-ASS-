# CNAS3003 IoT Collector Dashboard

A HeroUI + React dashboard for the CNAS3003 mini project concept: using a preexisting campus access point deployment as an IoT collector layer, without requiring separate gateway devices.

## Concept

Enterprise, education, and hospitality environments often already have dense WiFi infrastructure. This project demonstrates how that infrastructure can be adapted to collect Mist AP telemetry such as clients, BLE nearby occupancy, ambient temperature, humidity, radio utilization, power budget, and CPU temperature.

The dashboard presents the captured data in a simple operational view so facilities or network teams can identify usage patterns and make better HVAC and lighting decisions.

## Features

- Campus AP collector overview.
- Client count, BLE nearby room occupancy, ambient temperature, and humidity trend chart.
- Mist AP telemetry table with site, model, client, occupancy, and status rollups.
- Pi telemetry widget for `pi_telemetry` sensor values.
- Collector service panel for CPU temperature, radio utilization, uptime, and power state.
- Operational insights for high CPU temperature, power constraints, and radio utilization.
- Express API with an InfluxDB adapter and deterministic mock fallback.

## Run It

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

For the interim sample data mode, keep:

```bash
MOCK_DATA=true
```

## Run With Docker

Make sure `.env` contains the live InfluxDB settings and `MOCK_DATA=false`, then start Docker Desktop and run:

```bash
docker compose -p mist-dashboard up --build -d
```

Open `http://localhost:4100`.

Useful commands:

```bash
docker compose -p mist-dashboard logs -f
docker compose -p mist-dashboard down
```

The container serves the built React dashboard and the Express API from the same port. The API routes remain under `/api`.

## Configure InfluxDB

Copy `.env.example` to `.env` and set:

```bash
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=...
INFLUX_ORG=...
INFLUX_BUCKET=...
INFLUX_MEASUREMENT=mist_telemetry
INFLUX_PI_MEASUREMENT=pi_telemetry
MOCK_DATA=false
```

The current API exposes:

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/sample-devices`

The Influx adapter expects the `mist_telemetry` measurement with tags `device_id`, `name`, `model`, and `site_id`. It reads fields including `ambient_temp`, `cpu_temp`, `humidity`, `pressure`, `num_clients`, `ble_nearby_count`, `radio_24_util`, `radio_5_util`, `uptime`, radio channel/noise/client fields, and `power_constrained`/`power_budget`. It also reads the `pi_telemetry` measurement from the same bucket with tags `device_id` and `sensor_id`, using the `value` field. Until credentials and measurements are available, or if the InfluxDB query fails, the API falls back to sample Mist and Pi telemetry.
