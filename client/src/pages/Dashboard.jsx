import PageHeading from "../components/PageHeading";
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
  Clock3,
  ArrowUpRight,
  Heart,
  Sparkles,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { getDashboardSummary, getMonthlyHours } from "../services/dashboard";
import MenuBar from "../components/MenuBar";

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="stat-card rounded-2xl border border-pink-200 bg-white/75 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-rose-700">{title}</p>
        <span className="stat-icon"><Icon size={19} strokeWidth={1.7} /></span>
      </div>
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
      <div className="app-page min-h-screen p-4 md:p-6">
        <MenuBar />
        <div className="mx-auto max-w-6xl animate-pulse rounded-3xl border border-pink-200 bg-white/70 p-8" role="status" aria-label="Loading dashboard">
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
      <div className="app-page min-h-screen p-4 md:p-6">
        <MenuBar />
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-8 text-center">
          <p className="font-semibold text-rose-900">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page min-h-screen theme-page-background p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <MenuBar />

        <section className="dashboard-heading rounded-3xl border border-pink-200 bg-white p-6 md:p-8">
          <PageHeading eyebrow="DASHBOARD" title={`Hi, ${user?.full_name?.split(" ")[0] || "Clinician"}.`} description="A little progress, every day.">
            <Link to="/duty-logs" className="page-heading-badge">Log a shift <ArrowUpRight size={16} /></Link>
          </PageHeading>
        </section>

        <section className="mobile-duty-summary" aria-label="Your duty hours">
          <div>
            <p className="mobile-summary-label"><Heart size={13} aria-hidden="true" /> Your journey</p>
            <h2>{dashboard?.totalHours ?? 0} <span>hours</span></h2>
            <p>Total duty hours logged</p>
            <Link to="/duty-logs">Keep growing <ArrowUpRight size={14} /></Link>
          </div>
          <div className="mobile-shift-badge">
            <Sparkles className="shift-badge-sparkle" size={23} aria-hidden="true" />
            <div className="shift-badge-icon"><Stethoscope size={25} strokeWidth={1.7} aria-hidden="true" /></div>
            <strong>{dashboard?.totalDutyLogs ?? 0}</strong>
            <span>{dashboard?.totalDutyLogs === 1 ? "shift logged" : "shifts logged"}</span>
            <Heart className="shift-badge-heart" size={16} aria-hidden="true" />
          </div>
        </section>

        <section className="dashboard-stats grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Clinical activity summary">
          <StatCard
            icon={ClipboardPlus}
            title="Total Duty Logs"
            value={dashboard?.totalDutyLogs ?? 0}
            subtitle="All sessions recorded"
          />
          <StatCard
            title="Total Procedures"
            icon={Stethoscope}
            value={dashboard?.totalProcedures ?? 0}
            subtitle="Clinical procedures tracked"
          />
          <StatCard
            title="Total Reflections"
            icon={NotebookPen}
            value={dashboard?.totalReflections ?? 0}
            subtitle="Reflection entries completed"
          />
          <StatCard
            title="Total Hours"
            icon={Clock3}
            value={dashboard?.totalHours ?? 0}
            subtitle="All hours recorded · No limit"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-pink-200 bg-white/75 p-6 shadow-sm lg:col-span-2">
            <h2 className="text-rose-950">Monthly Hours</h2>
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
                        stopColor="var(--color-pink-500)"
                        stopOpacity={0.55}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-pink-500)"
                        stopOpacity={0.08}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-pink-200)" />
                  <XAxis dataKey="month" stroke="var(--color-rose-800)" />
                  <YAxis allowDecimals={false} stroke="var(--color-rose-800)" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="var(--color-pink-600)"
                    strokeWidth={3}
                    fill="url(#pinkHours)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-pink-200 bg-white/75 p-6 shadow-sm">
              <h2 className="text-rose-950">
                Hours Logged
              </h2>
              <p className="mt-1 text-sm text-rose-900/70">
                {dashboard?.totalHours ?? 0} total hours
              </p>
              <p className="mt-2 text-sm font-semibold text-pink-700">
                Keep logging — there’s no hour limit.
              </p>
            </div>

            <div className="dashboard-quick-actions rounded-3xl border border-pink-200 bg-white/75 p-6 shadow-sm">
              <h2 className="text-rose-950">Quick Actions</h2>
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
