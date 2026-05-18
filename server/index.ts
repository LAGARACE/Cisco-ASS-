import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDashboardData } from "./influx";
import { getSampleJuniperIotApDevices } from "./mockData";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "..", "dist");
const app = express();
const port = Number(process.env.API_PORT ?? 4100);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "cnas3003-iot-collector-api",
    generatedAt: new Date().toISOString()
  });
});

app.get("/api/dashboard", async (_request, response, next) => {
  try {
    response.json(await getDashboardData());
  } catch (error) {
    next(error);
  }
});

app.get("/api/sample-devices", (_request, response) => {
  response.json({
    measurement: "mist_telemetry",
    tags: ["device_id", "name", "model", "site_id"],
    fields: [
      "ambient_temp",
      "cpu_temp",
      "humidity",
      "pressure",
      "num_clients",
      "ble_nearby_count",
      "radio_24_util",
      "radio_5_util",
      "uptime",
      "accel_x",
      "accel_y",
      "accel_z",
      "radio_24_channel",
      "radio_5_channel",
      "radio_24_noise_floor",
      "radio_5_noise_floor",
      "radio_24_clients",
      "radio_5_clients",
      "power_constrained",
      "power_budget",
      "iot_a1_analog",
      "iot_a2_analog",
      "iot_a3_analog",
      "iot_a4_analog",
      "iot_di1_digital",
      "iot_di2_digital"
    ],
    piTelemetry: {
      measurement: "pi_telemetry",
      tags: ["device_id", "sensor_id"],
      fields: ["value"]
    },
    devices: getSampleJuniperIotApDevices()
  });
});

app.use(express.static(publicDir));

app.use((request, response, next) => {
  if (request.method !== "GET" || request.path.startsWith("/api")) {
    next();
    return;
  }

  response.sendFile(path.join(publicDir, "index.html"));
});

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(error);
    response.status(500).json({
      error: "Internal server error"
    });
  }
);

app.listen(port, () => {
  console.log(`Network monitor API listening on http://localhost:${port}`);
});
