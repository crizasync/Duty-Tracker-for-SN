import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ClipboardPlus,
  FlaskConical,
  NotebookPen,
  Stethoscope,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { getDashboardSummary, getMonthlyHours } from "../services/dashboard";
import MenuBar from "../components/MenuBar";

function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-pink-200 bg-white/75 p-5 shadow-sm backdrop-blur">
      <p className="text-sm font-medium text-rose-700">{title}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-rose-950">
        {value}
      </p>
      <p className="mt-1 text-xs text-rose-800/70">{subtitle}</p>
    </div>
  );
}

function formatMonthLabel(month) {
  if (!month || month.length !== 7) return month;
  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);
  return date.toLocaleString("en-US", { month: "short" });
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [dashboard, setDashboard] = useState(null);
  const [monthlyHours, setMonthlyHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [summaryRes, monthlyRes] = await Promise.all([
          getDashboardSummary(),
          getMonthlyHours(),
        ]);

        setDashboard(summaryRes.data.dashboard);
        setMonthlyHours(monthlyRes.data.monthlyHours || []);
      } catch {
        setError("Unable to load dashboard right now.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const chartData = useMemo(
    () =>
      monthlyHours.map((entry) => ({
        month: formatMonthLabel(entry.month),
        hours: Number(entry.hours || 0),
      })),
    [monthlyHours],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 p-6">
        <div className="mx-auto max-w-6xl animate-pulse rounded-3xl border border-pink-200 bg-white/70 p-8">
          <div className="h-8 w-56 rounded bg-pink-100" />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="h-32 rounded-2xl bg-pink-100" />
            <div className="h-32 rounded-2xl bg-pink-100" />
            <div className="h-32 rounded-2xl bg-pink-100" />
            <div className="h-32 rounded-2xl bg-pink-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-rose-50 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 text-center">
          <p className="font-semibold text-rose-900">{error}</p>
        </div>
      </div>
    );
  }

  const progress = Math.min(Number(dashboard?.progress || 0), 100);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#ffe3ee_0%,#ffd7e9_35%,#fff3f8_70%,#fff_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <MenuBar />

        <section className="overflow-hidden rounded-3xl border border-pink-200 bg-white/75 p-6 shadow-[0_18px_50px_rgba(244,114,182,0.2)] backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-pink-600">Dashboard</p>
              <h1 className="mt-1 text-3xl font-black text-rose-950 sm:text-4xl">
                Welcome, {user?.full_name || "Clinician"}
              </h1>
              <p className="mt-2 text-sm text-rose-900/75">
                Keep your duty logs, procedures, and reflections in one place.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Duty Logs"
            value={dashboard?.totalDutyLogs ?? 0}
            subtitle="All sessions recorded"
          />
          <StatCard
            title="Total Procedures"
            value={dashboard?.totalProcedures ?? 0}
            subtitle="Clinical procedures tracked"
          />
          <StatCard
            title="Total Reflections"
            value={dashboard?.totalReflections ?? 0}
            subtitle="Reflection entries completed"
          />
          <StatCard
            title="Total Hours"
            value={dashboard?.totalHours ?? 0}
            subtitle={`Required: ${dashboard?.requiredHours ?? 0} hrs`}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-pink-200 bg-white/75 p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-bold text-rose-950">Monthly Hours</h2>
            <p className="mt-1 text-sm text-rose-900/70">
              Your logged hours trend
            </p>

            <div className="mt-5 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="pinkHours" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#ec4899"
                        stopOpacity={0.55}
                      />
                      <stop
                        offset="95%"
                        stopColor="#ec4899"
                        stopOpacity={0.08}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f9a8d4" />
                  <XAxis dataKey="month" stroke="#9f1239" />
                  <YAxis allowDecimals={false} stroke="#9f1239" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="#db2777"
                    strokeWidth={3}
                    fill="url(#pinkHours)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-pink-200 bg-white/75 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-rose-950">
                Hours Progress
              </h2>
              <p className="mt-1 text-sm text-rose-900/70">
                {dashboard?.totalHours ?? 0} of {dashboard?.requiredHours ?? 0}{" "}
                hours
              </p>
              <div className="mt-4 h-3 rounded-full bg-pink-100">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-sm font-semibold text-pink-700">
                {progress.toFixed(2)}% complete
              </p>
            </div>

            <div className="rounded-3xl border border-pink-200 bg-white/75 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-rose-950">Quick Actions</h2>
              <div className="mt-4 space-y-3">
                <Link
                  to="/duty-logs"
                  className="flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-3 py-2 text-sm font-semibold text-pink-700 transition hover:bg-pink-100"
                >
                  <ClipboardPlus size={16} />
                  Open Duty Logs
                </Link>
                <Link
                  to="/procedures"
                  className="flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-3 py-2 text-sm font-semibold text-pink-700 transition hover:bg-pink-100"
                >
                  <Stethoscope size={16} />
                  Open Procedures
                </Link>
                <Link
                  to="/reflections"
                  className="flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-3 py-2 text-sm font-semibold text-pink-700 transition hover:bg-pink-100"
                >
                  <NotebookPen size={16} />
                  Open Reflections
                </Link>
                <Link
                  to="/reports"
                  className="flex items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-3 py-2 text-sm font-semibold text-pink-700 transition hover:bg-pink-100"
                >
                  <FlaskConical size={16} />
                  Open Reports
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
