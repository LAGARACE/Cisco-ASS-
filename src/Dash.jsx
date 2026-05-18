import {
  AlertTriangle,
  DoorClosed,
  DoorOpen,
  Lightbulb,
  Ruler,
  LogOut,
  Maximize2,
  Minimize2,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Button,
  Card,
  Chip,
  CloseButton,
  Label,
  ProgressBar,
  Separator,
  Spinner,
  Table,
} from "@heroui/react";
import { fetchDashboard } from "./api";
import loginLogo from "./assets/ciscoass.png";

const statusTone = {
  healthy: "success",
  warning: "warning",
  critical: "danger",
};

const statusLabel = {
  healthy: "Healthy",
  warning: "Review",
  critical: "Action",
};

function getPiSensorDisplay(sensor) {
  const sensorId = String(sensor.sensorId ?? "").trim().toLowerCase();
  const numericValue = Number(sensor.value ?? 0);

  if (sensorId === "distance") {
    return {
      Icon: Ruler,
      title: "Distance",
      label: "Distance",
      value: `${numericValue.toFixed(1)} cm`,
      chip: null,
    };
  }

  if (sensorId === "door_1") {
    const isOpen = numericValue === 1;

    return {
      Icon: isOpen ? DoorOpen : DoorClosed,
      title: "Door 1",
      label: "Door 1",
      value: isOpen ? "Open" : "Closed",
      chip: {
        color: isOpen ? "success" : "danger",
        label: isOpen ? "Open" : "Closed",
      },
    };
  }

  if (sensorId === "light") {
    const isLight = numericValue === 1;

    return {
      Icon: Lightbulb,
      title: "Light",
      label: "Light",
      value: isLight ? "Light" : "Dark",
      chip: {
        color: isLight ? "success" : "danger",
        label: isLight ? "Light" : "Dark",
      },
    };
  }

  return {
    Icon: Ruler,
    title: sensor.label,
    label: sensor.label,
    value: sensor.value,
    chip: null,
  };
}

const baseWidgetTitles = {
  timeline: "Client And Environment Trend",
  load: "Device Client Load",
  radar: "Radio Health Radar",
  radioUtil: "Radio Utilization",
  clientSplit: "Radio Client Split",
  rf: "RF Channel And Noise",
  environment: "Environment Sensors",
  piTelemetry: "Pi Telemetry",
  motionPower: "Motion And Power",
  ioPins: "Juniper IO Pins",
  devices: "Devices",
  collector: "Collector Status",
  insights: "Operational Insights",
  schema: "Schema Coverage",
};

function formatUptime(seconds) {
  const safeSeconds = Number(seconds) || 0;
  if (safeSeconds <= 0) return "0h";

  const days = Math.floor(safeSeconds / 86400);
  const hours = Math.round((safeSeconds % 86400) / 3600);

  if (days > 0) return `${days}d ${hours}h`;
  return `${Math.round(safeSeconds / 3600)}h`;
}

function ChartTooltip({ active, label, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      {label ? <div className="chart-tooltip-header">{label}</div> : null}
      <div className="chart-tooltip-items">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="chart-tooltip-item">
            <span
              className="chart-tooltip-dot"
              style={{ background: entry.color }}
            />
            <span className="chart-tooltip-label">
              {entry.name ?? entry.dataKey}
            </span>
            <span className="chart-tooltip-value">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WidgetCard({
  children,
  className = "",
  expandedWidgets,
  hiddenWidgets,
  id,
  onClose,
  onExpand,
  title,
}) {
  if (hiddenWidgets[id]) return null;

  return (
    <Card
      className={`dashboard-card finder-widget ${
        expandedWidgets[id] ? "finder-widget-expanded" : ""
      } ${className}`}
    >
      <div className="finder-titlebar">
        <span className="finder-title">{title}</span>
        <div className="widget-actions" aria-label={`${title} controls`}>
          <Button
            isIconOnly
            aria-label={`${expandedWidgets[id] ? "Restore" : "Expand"} ${title}`}
            className="widget-action-button"
            size="sm"
            variant="tertiary"
            onPress={() => onExpand(id)}
          >
            {expandedWidgets[id] ? (
              <Minimize2 size={15} />
            ) : (
              <Maximize2 size={15} />
            )}
          </Button>
          <CloseButton
            aria-label={`Close ${title}`}
            onPress={() => onClose(id)}
          />
        </div>
      </div>
      {children}
    </Card>
  );
}

function Dash({ onLogout, user }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [expandedWidgets, setExpandedWidgets] = useState({});
  const [hiddenWidgets, setHiddenWidgets] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await fetchDashboard());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dashboard API failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const activeInsights = useMemo(
    () =>
      data?.insights.filter((insight) => insight.severity !== "healthy")
        .length ?? 0,
    [data],
  );

  const deviceChart = useMemo(
    () =>
      data?.accessPoints.map((ap) => ({
        name: ap.room.replace(" AP", ""),
        num_clients: ap.num_clients,
        ble_nearby_count: ap.ble_nearby_count,
        ambient_temp: ap.ambient_temp,
      })) ?? [],
    [data],
  );

  const piSensorChart = useMemo(
    () =>
      data?.piSensors.map((sensor) => ({
        name: sensor.label,
        value: sensor.value,
      })) ?? [],
    [data],
  );

  const radioUtilChart = useMemo(
    () =>
      data?.accessPoints.map((ap) => ({
        name: ap.room.replace(" AP", ""),
        radio_24_util: ap.radio_24_util,
        radio_5_util: ap.radio_5_util,
      })) ?? [],
    [data],
  );

  const radioClientChart = useMemo(
    () =>
      data?.accessPoints.map((ap) => ({
        name: ap.room.replace(" AP", ""),
        radio_24_clients: ap.radio_24_clients,
        radio_5_clients: ap.radio_5_clients,
      })) ?? [],
    [data],
  );

  const noiseFloorChart = useMemo(
    () =>
      data?.accessPoints.map((ap) => ({
        name: ap.room.replace(" AP", ""),
        radio_24_noise_floor: ap.radio_24_noise_floor,
        radio_5_noise_floor: ap.radio_5_noise_floor,
      })) ?? [],
    [data],
  );

  const ioAnalogChart = useMemo(
    () =>
      data?.accessPoints.flatMap((ap) => [
        { pin: "A1", field: "iot_a1_analog", value: ap.iot_a1_analog, ap: ap.room },
        { pin: "A2", field: "iot_a2_analog", value: ap.iot_a2_analog, ap: ap.room },
        { pin: "A3", field: "iot_a3_analog", value: ap.iot_a3_analog, ap: ap.room },
        { pin: "A4", field: "iot_a4_analog", value: ap.iot_a4_analog, ap: ap.room },
      ]) ?? [],
    [data],
  );

  const radioHealthChart = useMemo(() => {
    if (!data?.accessPoints.length) return [];

    const average = (key) =>
      data.accessPoints.reduce((total, ap) => total + Number(ap[key] ?? 0), 0) /
      data.accessPoints.length;

    return [
      { metric: "Clients", value: Math.min(100, average("num_clients")) },
      { metric: "Occupancy", value: Math.min(100, average("ble_nearby_count")) },
      { metric: "Temp", value: Math.max(0, 100 - average("ambient_temp") * 2) },
      {
        metric: "Humidity",
        value: Math.max(0, 100 - Math.abs(average("humidity") - 45)),
      },
      { metric: "2.4 GHz", value: Math.max(0, 100 - average("radio_24_util")) },
      { metric: "5 GHz", value: Math.max(0, 100 - average("radio_5_util")) },
      {
        metric: "Power",
        value: data.accessPoints.some((ap) => ap.power_constrained) ? 64 : 96,
      },
    ];
  }, [data]);

  const widgetTitles = useMemo(() => {
    const metricTitles =
      data?.overview.reduce((titles, metric) => {
        titles[`metric-${metric.label}`] = metric.label;
        return titles;
      }, {}) ?? {};

    const accessPointTitles =
      data?.accessPoints.reduce((titles, ap) => {
        titles[`ap-${ap.id}`] = ap.room;
        return titles;
      }, {}) ?? {};

    return { ...baseWidgetTitles, ...metricTitles, ...accessPointTitles };
  }, [data]);

  const hiddenWidgetIds = useMemo(
    () => Object.keys(hiddenWidgets).filter((id) => hiddenWidgets[id]),
    [hiddenWidgets],
  );

  const closeWidget = (id) => {
    setHiddenWidgets((current) => ({ ...current, [id]: true }));
    setExpandedWidgets((current) => ({ ...current, [id]: false }));
  };

  const expandWidget = (id) => {
    setExpandedWidgets((current) => ({ ...current, [id]: !current[id] }));
  };

  const restoreWidget = (id) => {
    setHiddenWidgets((current) => ({ ...current, [id]: false }));
  };

  const widgetControls = {
    expandedWidgets,
    hiddenWidgets,
    onClose: closeWidget,
    onExpand: expandWidget,
  };

  const username = user?.name ?? localStorage.getItem("username") ?? "there";

  return (
    <div className="app-shell min-h-screen text-slate-950">
      <aside className="sidebar-panel hidden lg:flex">
        <div className="dashboard-brand">
          <img
            src={loginLogo}
            alt="Juniper IoT AP monitor logo"
            className="dashboard-brand-logo"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              Cisco ASS
            </p>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="topbar">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={loginLogo}
              alt="Juniper IoT AP monitor logo"
              className="h-10 w-auto object-contain lg:hidden"
            />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-slate-950">
                Welcome Back {username}
              </h1>
              <p className="truncate text-sm text-slate-500">
                Monitoring assets, AP telemetry with client, radio, sensor,
                BLE occupancy, Pi telemetry, and power signals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="dashboard-button dashboard-button-primary"
              isPending={loading}
              radius="full"
              onPress={load}
            >
              <RefreshCcw size={16} />
              Refresh
            </Button>
            <Button
              className="dashboard-button dashboard-button-danger"
              radius="full"
              variant="danger-soft"
              onPress={onLogout}
            >
              <LogOut size={16} />
              Log out
            </Button>
          </div>
        </header>

        <main className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6">
          <section className="widget-dock" aria-label="Widgets">
            <div>
              <p className="widget-dock-label">Widgets</p>
              <p className="widget-dock-copy">
                Closed cards appear here so you can add them back.
              </p>
            </div>
            <div className="widget-dock-list">
              {hiddenWidgetIds.length > 0 ? (
                hiddenWidgetIds.map((id) => (
                  <Chip
                    key={id}
                    className="widget-restore-chip"
                    color="accent"
                    size="sm"
                    variant="soft"
                    role="button"
                    tabIndex={0}
                    onClick={() => restoreWidget(id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        restoreWidget(id);
                      }
                    }}
                  >
                    <Chip.Label>{widgetTitles[id] ?? "Widget"}</Chip.Label>
                  </Chip>
                ))
              ) : (
                <span className="widget-empty">
                  All widgets are on the dashboard
                </span>
              )}
            </div>
          </section>

          {error ? (
            <Card className="border border-red-200 bg-red-50">
              <Card.Content className="flex flex-row items-center gap-3 text-red-700">
                <AlertTriangle size={20} />
                {error}
              </Card.Content>
            </Card>
          ) : null}

          {loading && !data ? (
            <div className="grid min-h-96 place-items-center gap-3 text-slate-600">
              <Spinner color="accent" size="lg" />
              <span className="text-sm">Loading Assets IoT AP telemetry</span>
            </div>
          ) : data ? (
            <>
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {data.overview.map((metric) => (
                  <WidgetCard
                    key={metric.label}
                    id={`metric-${metric.label}`}
                    title={metric.label}
                    {...widgetControls}
                  >
                    <Card.Content className="gap-4">
                      <div className="flex items-center justify-end">
                        <Chip
                          color={statusTone[metric.status]}
                          variant="soft"
                          size="sm"
                        >
                          {statusLabel[metric.status]}
                        </Chip>
                      </div>
                      <div>
                        <p className="text-3xl font-semibold tracking-normal text-slate-950">
                          {metric.value}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-slate-500">
                          {metric.detail}
                        </span>
                        <span className="font-medium text-slate-800">
                          {metric.trend}
                        </span>
                      </div>
                    </Card.Content>
                  </WidgetCard>
                ))}
              </section>

              <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.55fr_1fr]">
                <WidgetCard
                  id="timeline"
                  title={baseWidgetTitles.timeline}
                  {...widgetControls}
                >
                  <Card.Header className="flex-row items-center justify-between">
                    <div>
                      <Card.Title className="text-base">
                        Client And Environment Trend
                      </Card.Title>
                      <p className="text-sm text-slate-500">
                        Sample hourly values for num_clients,
                        ble_nearby_count, ambient_temp, and humidity
                      </p>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <div className="modern-chart-panel h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={data.timeline}
                          margin={{ top: 14, left: -8, right: 16, bottom: 4 }}
                        >
                          <defs>
                            <linearGradient
                              id="clientsGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#006FEE"
                                stopOpacity={0.28}
                              />
                              <stop
                                offset="95%"
                                stopColor="#006FEE"
                                stopOpacity={0.02}
                              />
                            </linearGradient>
                            <linearGradient
                              id="tempGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#9353D3"
                                stopOpacity={0.2}
                              />
                              <stop
                                offset="95%"
                                stopColor="#9353D3"
                                stopOpacity={0.01}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            vertical={false}
                            stroke="#d8e1ef"
                            strokeOpacity={0.7}
                          />
                          <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#7c8ba1", fontSize: 12 }}
                            dy={8}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#7c8ba1", fontSize: 12 }}
                            width={42}
                          />
                          <Tooltip
                            content={<ChartTooltip />}
                            cursor={{
                              stroke: "#006FEE",
                              strokeDasharray: "4 4",
                              strokeOpacity: 0.35,
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="num_clients"
                            name="Clients"
                            stroke="#006FEE"
                            strokeWidth={3}
                            fill="url(#clientsGradient)"
                            dot={false}
                            activeDot={{
                              r: 5,
                              fill: "#006FEE",
                              stroke: "#ffffff",
                              strokeWidth: 3,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="ble_nearby_count"
                            name="BLE occupancy"
                            stroke="#17C964"
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="ambient_temp"
                            name="ambient_temp C"
                            stroke="#9353D3"
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="humidity"
                            name="humidity %"
                            stroke="#F31260"
                            strokeWidth={2}
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Content>
                </WidgetCard>

                <WidgetCard
                  id="load"
                  title={baseWidgetTitles.load}
                  {...widgetControls}
                >
                  <Card.Header className="flex-row items-center justify-between">
                    <div>
                      <Card.Title className="text-base">
                        Device Client Load
                      </Card.Title>
                      <p className="text-sm text-slate-500">
                        Connected IoT clients and nearby BLE occupancy by AP
                      </p>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <div className="modern-chart-panel h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={deviceChart}
                          margin={{ top: 14, left: -8, right: 12, bottom: 4 }}
                        >
                          <defs>
                            <linearGradient
                              id="barGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#006FEE"
                                stopOpacity={1}
                              />
                              <stop
                                offset="100%"
                                stopColor="#004493"
                                stopOpacity={0.92}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            vertical={false}
                            stroke="#d8e1ef"
                            strokeOpacity={0.7}
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#7c8ba1", fontSize: 12 }}
                            dy={8}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#7c8ba1", fontSize: 12 }}
                            width={42}
                          />
                          <Tooltip
                            content={<ChartTooltip />}
                            cursor={{ fill: "rgba(0, 111, 238, 0.08)" }}
                          />
                          <Bar
                            dataKey="num_clients"
                            name="num_clients"
                            fill="url(#barGradient)"
                            radius={[10, 10, 4, 4]}
                            barSize={28}
                          />
                          <Bar
                            dataKey="ble_nearby_count"
                            name="ble_nearby_count"
                            fill="#17C964"
                            radius={[10, 10, 4, 4]}
                            barSize={28}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Content>
                </WidgetCard>
              </section>

              <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr]">
                <WidgetCard
                  id="radioUtil"
                  title={baseWidgetTitles.radioUtil}
                  {...widgetControls}
                >
                  <Card.Header>
                    <div>
                      <Card.Title className="text-base">
                        Radio Utilization
                      </Card.Title>
                      <p className="text-sm text-slate-500">
                        radio_24_util and radio_5_util by AP
                      </p>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <div className="modern-chart-panel h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={radioUtilChart}
                          margin={{ top: 14, left: -8, right: 12, bottom: 4 }}
                        >
                          <CartesianGrid
                            vertical={false}
                            stroke="#d8e1ef"
                            strokeOpacity={0.7}
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#7c8ba1", fontSize: 12 }}
                            dy={8}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#7c8ba1", fontSize: 12 }}
                            width={42}
                          />
                          <Tooltip
                            content={<ChartTooltip />}
                            cursor={{ fill: "rgba(0, 111, 238, 0.08)" }}
                          />
                          <Bar
                            dataKey="radio_24_util"
                            name="radio_24_util"
                            fill="#006FEE"
                            radius={[8, 8, 3, 3]}
                            barSize={26}
                          />
                          <Bar
                            dataKey="radio_5_util"
                            name="radio_5_util"
                            fill="#9353D3"
                            radius={[8, 8, 3, 3]}
                            barSize={26}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Content>
                </WidgetCard>

                <WidgetCard
                  id="clientSplit"
                  title={baseWidgetTitles.clientSplit}
                  {...widgetControls}
                >
                  <Card.Header>
                    <div>
                      <Card.Title className="text-base">
                        Radio Client Split
                      </Card.Title>
                      <p className="text-sm text-slate-500">
                        radio_24_clients and radio_5_clients by AP
                      </p>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <div className="modern-chart-panel h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={radioClientChart}
                          margin={{ top: 14, left: -8, right: 12, bottom: 4 }}
                        >
                          <CartesianGrid
                            vertical={false}
                            stroke="#d8e1ef"
                            strokeOpacity={0.7}
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#7c8ba1", fontSize: 12 }}
                            dy={8}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#7c8ba1", fontSize: 12 }}
                            width={42}
                          />
                          <Tooltip
                            content={<ChartTooltip />}
                            cursor={{ fill: "rgba(147, 83, 211, 0.08)" }}
                          />
                          <Bar
                            dataKey="radio_24_clients"
                            name="radio_24_clients"
                            fill="#00B8D9"
                            radius={[8, 8, 3, 3]}
                            barSize={26}
                          />
                          <Bar
                            dataKey="radio_5_clients"
                            name="radio_5_clients"
                            fill="#F31260"
                            radius={[8, 8, 3, 3]}
                            barSize={26}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Content>
                </WidgetCard>
              </section>

              <section className="grid grid-cols-1 gap-3 xl:grid-cols-[0.95fr_1.05fr]">
                <WidgetCard
                  id="radar"
                  title={baseWidgetTitles.radar}
                  {...widgetControls}
                >
                  <Card.Header className="flex-row items-center justify-between">
                    <div>
                      <Card.Title className="text-base">
                        Radio Health Radar
                      </Card.Title>
                      <p className="text-sm text-slate-500">
                        Live-ready AP health profile
                      </p>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <div className="modern-chart-panel h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radioHealthChart} outerRadius="72%">
                          <PolarGrid stroke="#d8e1ef" strokeOpacity={0.75} />
                          <PolarAngleAxis
                            dataKey="metric"
                            tick={{ fill: "#7c8ba1", fontSize: 12 }}
                          />
                          <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                          />
                          <Tooltip content={<ChartTooltip />} />
                          <Radar
                            dataKey="value"
                            name="Health score"
                            stroke="#006FEE"
                            strokeWidth={3}
                            fill="#006FEE"
                            fillOpacity={0.18}
                            dot={{ r: 3, fill: "#006FEE", strokeWidth: 0 }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Content>
                </WidgetCard>
              </section>

              <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr]">
                <WidgetCard
                  id="rf"
                  title={baseWidgetTitles.rf}
                  {...widgetControls}
                >
                  <Card.Header>
                    <div>
                      <Card.Title className="text-base">
                        RF Channel And Noise
                      </Card.Title>
                      <p className="text-sm text-slate-500">
                        radio channels and noise floor readings
                      </p>
                    </div>
                  </Card.Header>
                  <Card.Content className="gap-4">
                    <div className="modern-chart-panel h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={noiseFloorChart}
                          margin={{ top: 14, left: -8, right: 12, bottom: 4 }}
                        >
                          <CartesianGrid
                            vertical={false}
                            stroke="#d8e1ef"
                            strokeOpacity={0.7}
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#7c8ba1", fontSize: 12 }}
                            dy={8}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#7c8ba1", fontSize: 12 }}
                            width={42}
                          />
                          <Tooltip
                            content={<ChartTooltip />}
                            cursor={{ fill: "rgba(0, 111, 238, 0.08)" }}
                          />
                          <Bar
                            dataKey="radio_24_noise_floor"
                            name="radio_24_noise_floor"
                            fill="#006FEE"
                            radius={[8, 8, 3, 3]}
                            barSize={26}
                          />
                          <Bar
                            dataKey="radio_5_noise_floor"
                            name="radio_5_noise_floor"
                            fill="#9353D3"
                            radius={[8, 8, 3, 3]}
                            barSize={26}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="telemetry-grid">
                      {data.accessPoints.map((ap) => (
                        <div key={`${ap.id}-channels`} className="metric-tile">
                          <p className="text-sm font-medium text-slate-950">
                            {ap.room}
                          </p>
                          <div className="telemetry-pair">
                            <span>radio_24_channel</span>
                            <strong>{ap.radio_24_channel}</strong>
                          </div>
                          <div className="telemetry-pair">
                            <span>radio_5_channel</span>
                            <strong>{ap.radio_5_channel}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Content>
                </WidgetCard>

                <WidgetCard
                  id="environment"
                  title={baseWidgetTitles.environment}
                  {...widgetControls}
                >
                  <Card.Header>
                    <div>
                      <Card.Title className="text-base">
                        Environment Sensors
                      </Card.Title>
                      <p className="text-sm text-slate-500">
                        ambient_temp, cpu_temp, humidity, and pressure
                      </p>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <div className="telemetry-grid">
                      {data.accessPoints.map((ap) => (
                        <div
                          key={`${ap.id}-environment`}
                          className="metric-tile"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-950">
                              {ap.room}
                            </p>
                            <Chip
                              size="sm"
                              color={statusTone[ap.status]}
                              variant="soft"
                            >
                              {statusLabel[ap.status]}
                            </Chip>
                          </div>
                          <div className="telemetry-pair">
                            <span>ambient_temp</span>
                            <strong>{ap.ambient_temp} C</strong>
                          </div>
                          <div className="telemetry-pair">
                            <span>cpu_temp</span>
                            <strong>{ap.cpu_temp} C</strong>
                          </div>
                          <div className="telemetry-pair">
                            <span>humidity</span>
                            <strong>{ap.humidity}%</strong>
                          </div>
                          <div className="telemetry-pair">
                            <span>pressure</span>
                            <strong>{ap.pressure}</strong>
                          </div>
                          <div className="telemetry-pair">
                            <span>ble_nearby_count</span>
                            <strong>{ap.ble_nearby_count}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Content>
                </WidgetCard>
              </section>

              <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr]">
                <WidgetCard
                  id="piTelemetry"
                  title={baseWidgetTitles.piTelemetry}
                  {...widgetControls}
                >
                  <Card.Header>
                    <div>
                      <Card.Title className="text-base">
                        Pi Telemetry
                      </Card.Title>
                      <p className="text-sm text-slate-500">
                        Latest value field from pi_telemetry by sensor_id
                      </p>
                    </div>
                  </Card.Header>
                  <Card.Content className="gap-4">
                    <div className="modern-chart-panel h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={piSensorChart}
                          margin={{ top: 14, left: -8, right: 12, bottom: 4 }}
                        >
                          <CartesianGrid
                            vertical={false}
                            stroke="#d8e1ef"
                            strokeOpacity={0.7}
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#7c8ba1", fontSize: 12 }}
                            dy={8}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#7c8ba1", fontSize: 12 }}
                            width={42}
                          />
                          <Tooltip
                            content={<ChartTooltip />}
                            cursor={{ fill: "rgba(23, 201, 100, 0.08)" }}
                          />
                          <Bar
                            dataKey="value"
                            name="value"
                            fill="#17C964"
                            radius={[8, 8, 3, 3]}
                            barSize={34}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="telemetry-grid">
                      {data.piSensors.map((sensor) => {
                        const display = getPiSensorDisplay(sensor);
                        const SensorIcon = display.Icon;

                        return (
                          <div key={sensor.id} className="metric-tile">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="sensor-icon">
                                  <SensorIcon size={18} />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-slate-950">
                                    {display.title}
                                  </p>
                                  <p className="truncate text-xs text-slate-500">
                                    {sensor.collectorId}
                                  </p>
                                </div>
                              </div>
                              {display.chip ? (
                                <Chip
                                  size="sm"
                                  color={display.chip.color}
                                  variant="soft"
                                >
                                  {display.chip.label}
                                </Chip>
                              ) : (
                                <Chip
                                  size="sm"
                                  color={statusTone[sensor.status]}
                                  variant="soft"
                                >
                                  {statusLabel[sensor.status]}
                                </Chip>
                              )}
                            </div>
                            <div className="telemetry-pair">
                              <span>{display.label}</span>
                              <strong>{display.value}</strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card.Content>
                </WidgetCard>
              </section>

              <section className="grid grid-cols-1 gap-3">
                <WidgetCard
                  id="motionPower"
                  title={baseWidgetTitles.motionPower}
                  {...widgetControls}
                >
                  <Card.Header>
                    <div>
                      <Card.Title className="text-base">
                        Motion And Power
                      </Card.Title>
                      <p className="text-sm text-slate-500">
                        accel_x/y/z, uptime, power_budget, and power_constrained
                      </p>
                    </div>
                  </Card.Header>
                  <Card.Content>
                    <div className="telemetry-grid telemetry-grid-wide">
                      {data.accessPoints.map((ap) => (
                        <div
                          key={`${ap.id}-motion-power`}
                          className="metric-tile"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-950">
                              {ap.room}
                            </p>
                            <Chip
                              size="sm"
                              color={
                                ap.power_constrained ? "warning" : "success"
                              }
                              variant="soft"
                            >
                              power_constrained={String(ap.power_constrained)}
                            </Chip>
                          </div>
                          <div className="motion-axis-grid">
                            <div>
                              <span>accel_x</span>
                              <strong>{ap.accel_x}</strong>
                            </div>
                            <div>
                              <span>accel_y</span>
                              <strong>{ap.accel_y}</strong>
                            </div>
                            <div>
                              <span>accel_z</span>
                              <strong>{ap.accel_z}</strong>
                            </div>
                          </div>
                          <div className="telemetry-pair">
                            <span>power_budget</span>
                            <strong>{ap.power_budget} W</strong>
                          </div>
                          <div className="telemetry-pair">
                            <span>uptime</span>
                            <strong>{formatUptime(ap.uptime)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Content>
                </WidgetCard>
              </section>

              <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr]">
                <WidgetCard
                  id="ioPins"
                  title={baseWidgetTitles.ioPins}
                  {...widgetControls}
                >
                  <Card.Header>
                    <div>
                      <Card.Title className="text-base">
                        Juniper IO Pins
                      </Card.Title>
                      <p className="text-sm text-slate-500">
                        A1-A4 analog and DI1-DI2 digital pin readings
                      </p>
                    </div>
                  </Card.Header>
                  <Card.Content className="gap-4">
                    <div className="modern-chart-panel h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={ioAnalogChart}
                          margin={{ top: 14, left: -8, right: 12, bottom: 4 }}
                        >
                          <CartesianGrid
                            vertical={false}
                            stroke="#d8e1ef"
                            strokeOpacity={0.7}
                          />
                          <XAxis
                            dataKey="pin"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#7c8ba1", fontSize: 12 }}
                            dy={8}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#7c8ba1", fontSize: 12 }}
                            width={42}
                          />
                          <Tooltip
                            content={<ChartTooltip />}
                            cursor={{ fill: "rgba(0, 111, 238, 0.08)" }}
                          />
                          <Bar
                            dataKey="value"
                            name="analog"
                            fill="#006FEE"
                            radius={[8, 8, 3, 3]}
                            barSize={34}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="telemetry-grid">
                      {data.accessPoints.map((ap) => (
                        <div key={`${ap.id}-io-pins`} className="metric-tile">
                          <p className="text-sm font-medium text-slate-950">
                            {ap.room}
                          </p>
                          {[
                            ["A1", "iot_a1_analog", ap.iot_a1_analog],
                            ["A2", "iot_a2_analog", ap.iot_a2_analog],
                            ["A3", "iot_a3_analog", ap.iot_a3_analog],
                            ["A4", "iot_a4_analog", ap.iot_a4_analog],
                          ].map(([pin, field, value]) => (
                            <div key={field} className="telemetry-pair">
                              <span>
                                {pin} / {field}
                              </span>
                              <strong>{value}</strong>
                            </div>
                          ))}
                          <div className="io-digital-grid">
                            {[
                              ["DI1", "iot_di1_digital", ap.iot_di1_digital],
                              ["DI2", "iot_di2_digital", ap.iot_di2_digital],
                            ].map(([pin, field, value]) => (
                              <div
                                key={field}
                                className={Number(value) ? "io-digital-on" : ""}
                              >
                                <span>{pin}</span>
                                <strong>{Number(value) ? "HIGH" : "LOW"}</strong>
                                <small>{field}</small>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Content>
                </WidgetCard>
              </section>

              <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.35fr_1fr]">
                <WidgetCard
                  id="devices"
                  title={baseWidgetTitles.devices}
                  {...widgetControls}
                >
                  <Card.Header className="flex-row items-center justify-between">
                    <div>
                      <Card.Title className="text-base">
                        Assets IoT AP Devices
                      </Card.Title>
                      <p className="text-sm text-slate-500">
                        Tags: device_id, name, model, site_id
                      </p>
                    </div>
                    <Chip
                      color={activeInsights > 0 ? "warning" : "success"}
                      variant="soft"
                    >
                      {activeInsights} alerts
                    </Chip>
                  </Card.Header>
                  <Card.Content>
                    <Table variant="secondary">
                      <Table.ScrollContainer>
                        <Table.Content aria-label="Juniper IoT AP device sample table">
                          <Table.Header>
                            <Table.Column isRowHeader>DEVICE</Table.Column>
                            <Table.Column>SITE</Table.Column>
                            <Table.Column>CLIENTS</Table.Column>
                            <Table.Column>OCCUPANCY</Table.Column>
                            <Table.Column>ENV</Table.Column>
                            <Table.Column>STATUS</Table.Column>
                          </Table.Header>
                          <Table.Body>
                            {data.accessPoints.map((ap) => (
                              <Table.Row id={ap.id} key={ap.id}>
                                <Table.Cell>
                                  <div>
                                    <p className="font-medium text-slate-950">
                                      {ap.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {ap.id}
                                    </p>
                                  </div>
                                </Table.Cell>
                                <Table.Cell>{ap.building}</Table.Cell>
                                <Table.Cell>{ap.num_clients}</Table.Cell>
                                <Table.Cell>{ap.ble_nearby_count}</Table.Cell>
                                <Table.Cell>
                                  {ap.ambient_temp} C / {ap.humidity}%
                                </Table.Cell>
                                <Table.Cell>
                                  <Chip
                                    size="sm"
                                    color={statusTone[ap.status]}
                                    variant="soft"
                                  >
                                    {statusLabel[ap.status]}
                                  </Chip>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Content>
                      </Table.ScrollContainer>
                    </Table>
                  </Card.Content>
                </WidgetCard>

                <WidgetCard
                  id="collector"
                  title={baseWidgetTitles.collector}
                  {...widgetControls}
                >
                  <Card.Header className="flex-row items-center justify-between">
                    <div>
                      <Card.Title className="text-base">
                        Collector Status
                      </Card.Title>
                      <p className="text-sm text-slate-500">
                        {data.collector.host}
                      </p>
                    </div>
                    <Chip color="success" variant="soft">
                      {data.collector.protocol}
                    </Chip>
                  </Card.Header>
                  <Card.Content className="gap-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {data.collector.metrics.map((metric) => (
                        <div key={metric.label} className="metric-tile">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-slate-500">
                              {metric.label}
                            </p>
                            <Chip
                              size="sm"
                              color={statusTone[metric.status]}
                              variant="soft"
                            >
                              {statusLabel[metric.status]}
                            </Chip>
                          </div>
                          <p className="mt-2 text-2xl font-semibold text-slate-950">
                            {metric.value}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {metric.detail}
                          </p>
                        </div>
                      ))}
                    </div>

                    <Separator className="bg-slate-200" />

                    <div className="space-y-3">
                      {data.collector.events.map((event) => (
                        <div key={event.id} className="collector-event">
                          <div>
                            <p className="text-sm font-medium text-slate-950">
                              {event.service}
                            </p>
                            <p className="text-xs leading-5 text-slate-500">
                              {event.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Content>
                </WidgetCard>
              </section>

              <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr]">
                <WidgetCard
                  id="insights"
                  title={baseWidgetTitles.insights}
                  {...widgetControls}
                >
                  <Card.Header>
                    <Card.Title className="text-base">
                      Operational Insights
                    </Card.Title>
                  </Card.Header>
                  <Card.Content className="gap-3">
                    {data.insights.map((insight) => (
                      <div key={insight.id} className="insight-row">
                        <Chip
                          color={statusTone[insight.severity]}
                          variant="soft"
                          size="sm"
                        >
                          {statusLabel[insight.severity]}
                        </Chip>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-950">
                            {insight.service}
                          </p>
                          <p className="text-sm leading-5 text-slate-500">
                            {insight.message}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Observed {insight.startedAt}
                          </p>
                        </div>
                      </div>
                    ))}
                  </Card.Content>
                </WidgetCard>

                <WidgetCard
                  id="schema"
                  title={baseWidgetTitles.schema}
                  {...widgetControls}
                >
                  <Card.Header className="flex-row items-center justify-between">
                    <div>
                      <Card.Title className="text-base">
                        Schema Coverage
                      </Card.Title>
                      <p className="text-sm text-slate-500">
                        Fields used from mist_telemetry and pi_telemetry
                      </p>
                    </div>
                  </Card.Header>
                  <Card.Content className="gap-4">
                    {[
                      ["ambient_temp", "cpu_temp", "humidity", "pressure"],
                      [
                        "num_clients",
                        "ble_nearby_count",
                        "radio_24_clients",
                        "radio_5_clients",
                      ],
                      [
                        "radio_24_util",
                        "radio_5_util",
                        "radio_24_channel",
                        "radio_5_channel",
                      ],
                      ["radio_24_noise_floor", "radio_5_noise_floor"],
                      [
                        "uptime",
                        "accel_x",
                        "accel_y",
                        "accel_z",
                        "power_constrained",
                        "power_budget",
                      ],
                      [
                        "iot_a1_analog",
                        "iot_a2_analog",
                        "iot_a3_analog",
                        "iot_a4_analog",
                      ],
                      ["iot_di1_digital", "iot_di2_digital"],
                      ["pi_telemetry", "sensor_id", "value"],
                    ].map((group) => (
                      <div key={group.join("-")} className="field-chip-row">
                        {group.map((field) => (
                          <span key={field} className="field-chip">
                            {field}
                          </span>
                        ))}
                      </div>
                    ))}
                  </Card.Content>
                </WidgetCard>
              </section>

              <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {data.accessPoints.map((ap) => (
                  <WidgetCard
                    key={ap.id}
                    id={`ap-${ap.id}`}
                    title={ap.room}
                    {...widgetControls}
                  >
                    <Card.Content className="gap-4">
                      <div className="flex items-center justify-end">
                        <Chip
                          size="sm"
                          color={statusTone[ap.status]}
                          variant="soft"
                        >
                          {statusLabel[ap.status]}
                        </Chip>
                      </div>
                      <div>
                        <p className="font-medium text-slate-950">{ap.room}</p>
                        <p className="text-xs text-slate-500">{ap.building}</p>
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-slate-500">Room occupancy</span>
                          <span className="font-medium text-slate-950">
                            {ap.ble_nearby_count}
                          </span>
                        </div>
                        <ProgressBar
                          aria-label={`${ap.room} room occupancy`}
                          value={Math.min(ap.ble_nearby_count, 100)}
                          color={
                            ap.status === "critical" ? "danger" : "success"
                          }
                          size="sm"
                        >
                          <Label className="sr-only">
                            {ap.room} room occupancy
                          </Label>
                        </ProgressBar>
                        <p className="mt-2 text-xs text-slate-500">
                          {ap.num_clients} connected clients
                        </p>
                      </div>
                    </Card.Content>
                  </WidgetCard>
                ))}
              </section>

              <p className="pb-3 text-center text-xs text-slate-400">
                Last generated {new Date(data.generatedAt).toLocaleString()}
              </p>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export default Dash;
