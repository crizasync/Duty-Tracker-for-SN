import ModalDateTimeField from "../components/ModalDateTimeField";
import FacilityPicker from "../components/FacilityPicker";
import { locationFromLog } from "../utils/geoMap";
import { dutyRecordsEvent } from "../services/dutyLogs";
import ModalDecoration from "../components/ModalDecoration";
import RecordEmpty from "../components/RecordEmpty";
import RecordFilters from "../components/RecordFilters";
import useDesktopRecords from "../hooks/useDesktopRecords";
import PageHeading from "../components/PageHeading";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Eye, LayoutGrid, List, Pencil, Trash2, X, Clock3, CirclePlus, Hospital, ChevronRight } from "lucide-react";
import MenuBar from "../components/MenuBar";
import {
  createDutyLog,
  deleteDutyLog,
  getDutyLogs,
  updateDutyLog,
} from "../services/dutyLogs";

const initialForm = {
  dutyDate: "",
  hospital: "",
  ward: "",
  shift: "Morning",
  timeIn: "",
  timeOut: "",
  remarks: "",
  facilityLocation: null,
};

export default function DutyLogs() {
  const [formData, setFormData] = useState(initialForm);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    shift: "",
  });
  const [dutyLogs, setDutyLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const desktopRecords = useDesktopRecords();
  const [viewMode, setViewMode] = useState("tile");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [viewLog, setViewLog] = useState(null);
  const [editingLogId, setEditingLogId] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [updating, setUpdating] = useState(false);

  const loadDutyLogs = useCallback(async (queryFilters = {}) => {
    try {
      const params = {
        ...(queryFilters.startDate
          ? { startDate: queryFilters.startDate }
          : {}),
        ...(queryFilters.endDate ? { endDate: queryFilters.endDate } : {}),
        ...(queryFilters.shift ? { shift: queryFilters.shift } : {}),
      };
      const res = await getDutyLogs(params);
      setDutyLogs(res.data.dutyLogs || []);
      setOffline(Boolean(res.data.offline));
    } catch {
      toast.error("Could not load duty logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDutyLogs();
  }, [loadDutyLogs]);

  useEffect(() => {
    const refresh = () => { loadDutyLogs(filters); };
    window.addEventListener(dutyRecordsEvent, refresh);
    return () => window.removeEventListener(dutyRecordsEvent, refresh);
  }, [loadDutyLogs, filters]);

  const totalLoggedHours = useMemo(
    () => dutyLogs.reduce((sum, row) => sum + Number(row.total_hours || 0), 0),
    [dutyLogs],
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await createDutyLog(formData);
      toast.success(result.data.pending ? "Saved on this device. Will sync when connected." : "Duty log created");
      setFormData(initialForm);
      setIsCreateOpen(false);
      await loadDutyLogs();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create duty log");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDutyLog(id);
      toast.success("Duty log deleted");
      await loadDutyLogs();
    } catch {
      toast.error("Failed to delete duty log");
    }
  };

  const handleFilter = async (e) => {
    e.preventDefault();
    setLoading(true);
    await loadDutyLogs(filters);
  };

  const clearFilters = async () => {
    const resetFilters = { startDate: "", endDate: "", shift: "" };
    setFilters(resetFilters);
    setLoading(true);
    await loadDutyLogs(resetFilters);
  };

  const openEditModal = (log) => {
    if (log.pending) { toast("This shift is saved on your device. Connect to sync before editing."); return; }
    setEditingLogId(log.id);
    setEditForm({
      dutyDate: String(log.duty_date).slice(0, 10),
      hospital: log.hospital || "",
      ward: log.ward || "",
      shift: log.shift || "Morning",
      timeIn: log.time_in || "",
      timeOut: log.time_out || "",
      remarks: log.remarks || "",
      facilityLocation: locationFromLog(log),
    });
    setIsEditOpen(true);
  };

  const openViewModal = (log) => {
    setViewLog(log);
    setIsViewOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingLogId(null);
    setEditForm(initialForm);
  };

  const closeViewModal = () => {
    setIsViewOpen(false);
    setViewLog(null);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editingLogId) return;

    setUpdating(true);
    try {
      await updateDutyLog(editingLogId, editForm);
      toast.success("Duty log updated");
      closeEditModal();
      await loadDutyLogs(filters);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update duty log");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="app-page min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <MenuBar />
        {offline && <p className="geo-notice" role="status">You are offline. Showing records saved on this device. New shifts will sync when connected.</p>}

        <div className="records-panel rounded-3xl border border-rose-200 bg-white p-6 shadow-sm md:p-8">
          <PageHeading eyebrow="DUTY LOGS" title="Your shifts" description="Every shift, in one place.">
            <div className="flex flex-wrap items-center gap-2">
              <div className="hours-heading-badge rounded-xl border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-700">
                <Clock3 size={27} /> <span>Total Logged Hours:<strong>{totalLoggedHours.toFixed(2)}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="page-heading-primary-action rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
              >
                <CirclePlus size={18} /> Add Duty Log
              </button>
            </div>
          </PageHeading>

          <RecordFilters onSubmit={handleFilter} onClear={clearFilters} loading={loading}>

            <label className="record-filter-field"><span>From</span><input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300"
            /></label>
            <label className="record-filter-field"><span>To</span><input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
              className="rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300"
            /></label>
            <label className="record-filter-field"><span>Shift</span><select
              value={filters.shift}
              onChange={(e) =>
                setFilters({ ...filters, shift: e.target.value })
              }
              className="rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300"
            >
              <option value="">All Shifts</option>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Night">Night</option>
            </select></label>

          </RecordFilters>

          <div className="record-view-switch mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 px-3 py-2">
            <p className="text-sm font-semibold text-rose-800">Logs View</p>
            <div className="ml-auto inline-flex rounded-xl border border-rose-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  viewMode === "list"
                    ? "bg-pink-500 text-white"
                    : "text-rose-700 hover:bg-rose-100"
                }`}
              >
                <List size={14} />
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("tile")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  viewMode === "tile"
                    ? "bg-pink-500 text-white"
                    : "text-rose-700 hover:bg-rose-100"
                }`}
              >
                <LayoutGrid size={14} />
                Cards
              </button>
            </div>
          </div>

          {desktopRecords && viewMode === "list" ? (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-rose-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-rose-100 text-rose-900">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Hospital</th>
                    <th className="px-4 py-3">Ward</th>
                    <th className="px-4 py-3">Shift</th>
                    <th className="px-4 py-3">Hours</th>
                    <th className="px-4 py-3">Remarks</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100 bg-white">
                  {!loading && dutyLogs.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center text-rose-700"
                      >
                        No duty logs found.
                      </td>
                    </tr>
                  )}

                  {dutyLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-rose-50/60">
                      <td className="px-4 py-3">
                        {String(log.duty_date).slice(0, 10)}
                      </td>
                      <td className="px-4 py-3">{log.hospital}</td>
                      <td className="px-4 py-3">{log.ward}</td>
                      <td className="px-4 py-3">{log.shift}</td>
                      <td className="px-4 py-3 font-semibold text-rose-800">
                        {Number(log.total_hours || 0).toFixed(2)}
                      </td>
                      <td
                        className="max-w-[260px] truncate px-4 py-3"
                        title={log.remarks || ""}
                      >
                        {log.remarks || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openViewModal(log)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <button
                            type="button"
                            disabled={log.pending}
                            onClick={() => openEditModal(log)}
                            className="inline-flex items-center gap-1 rounded-lg border border-pink-300 bg-pink-50 px-2.5 py-1.5 text-xs font-semibold text-pink-700 transition hover:bg-pink-100"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(log.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="record-cards mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {loading && <p className="record-loading col-span-full" role="status">Finding your records...</p>}
              {!loading && dutyLogs.length === 0 && (
                <RecordEmpty>No duty logs found.</RecordEmpty>
              )}

              {dutyLogs.map((log) => (
                <details
                  key={log.id}
                  open={desktopRecords || undefined}
                  className="shift-record rounded-2xl border border-rose-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <summary className="shift-record-summary"><span className="hospital-icon"><Hospital size={25} /></span><span>{log.hospital || "Hospital"}{log.pending && <small className="duty-pending-badge">Waiting to sync</small>}</span><ChevronRight size={19} /></summary>
                  <div className="shift-record-content">
                    <p className="text-sm text-rose-700">{String(log.duty_date).slice(0, 10)} ? {log.shift} ? {log.ward}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-rose-50 px-3 py-2">
                      <p className="text-xs text-rose-600">Time In</p>
                      <p className="font-semibold text-rose-900">
                        {log.time_in}
                      </p>
                    </div>
                    <div className="rounded-lg bg-rose-50 px-3 py-2">
                      <p className="text-xs text-rose-600">Time Out</p>
                      <p className="font-semibold text-rose-900">
                        {log.time_out}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-rose-800">
                    <span className="font-semibold">Hours:</span>{" "}
                    {Number(log.total_hours || 0).toFixed(2)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-rose-700">
                    {log.remarks || "No remarks"}
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openViewModal(log)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(log)}
                      className="inline-flex items-center gap-1 rounded-lg border border-pink-300 bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-700 transition hover:bg-pink-100"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(log.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>

      {isEditOpen && (
        <div className="cute-modal-overlay fixed inset-0 z-50 grid place-items-center bg-rose-950/35 p-4 backdrop-blur-sm">
          <div className="cute-modal w-full max-w-2xl rounded-3xl border border-pink-200 bg-white p-6 shadow-2xl md:p-7">
            <div className="cute-modal-heading mb-4 flex items-center justify-between">
              <ModalDecoration />
              <div>
                <h2 className="text-rose-900">
                  Edit Duty Log
                </h2>
                <p className="text-sm text-rose-700">
                  Update your logged shift details.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-lg border border-rose-200 p-2 text-rose-700 transition hover:bg-rose-50"
                aria-label="Close edit modal"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleEditSave}
              className="grid gap-3 md:grid-cols-2"
            >
              <ModalDateTimeField label="Duty date"
                type="date"
                value={editForm.dutyDate}
                onChange={(e) =>
                  setEditForm({ ...editForm, dutyDate: e.target.value })
                }
                className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                required
              />
              <input
                type="text"
                placeholder="e.g. Philippine General Hospital" aria-label="Hospital"
                value={editForm.hospital}
                onChange={(e) =>
                  setEditForm({ ...editForm, hospital: e.target.value, facilityLocation: null })
                }
                className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                required
              />
              <FacilityPicker hospital={editForm.hospital} location={editForm.facilityLocation} onChange={(facility) => setEditForm({ ...editForm, facilityLocation: facility, ...(facility?.name ? { hospital: facility.name } : {}) })} />
              <input
                type="text"
                placeholder="e.g. Emergency Room" aria-label="Ward"
                value={editForm.ward}
                onChange={(e) =>
                  setEditForm({ ...editForm, ward: e.target.value })
                }
                className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                required
              />
              <select
                value={editForm.shift}
                onChange={(e) =>
                  setEditForm({ ...editForm, shift: e.target.value })
                }
                className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                required
              >
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Night</option>
              </select>
              <ModalDateTimeField label="Time in"
                type="time"
                value={editForm.timeIn}
                onChange={(e) =>
                  setEditForm({ ...editForm, timeIn: e.target.value })
                }
                className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                required
              />
              <ModalDateTimeField label="Time out"
                type="time"
                value={editForm.timeOut}
                onChange={(e) =>
                  setEditForm({ ...editForm, timeOut: e.target.value })
                }
                className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                required
              />
              <input
                type="text"
                placeholder="Optional notes about your shift" aria-label="Remarks"
                value={editForm.remarks}
                onChange={(e) =>
                  setEditForm({ ...editForm, remarks: e.target.value })
                }
                className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300 md:col-span-2"
              />

              <div className="mt-2 flex justify-end gap-2 md:col-span-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {updating ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewOpen && viewLog && (
        <div className="cute-modal-overlay fixed inset-0 z-50 grid place-items-center bg-rose-950/35 p-4 backdrop-blur-sm">
          <div className="cute-modal w-full max-w-2xl rounded-3xl border border-pink-200 bg-white p-6 shadow-2xl md:p-7">
            <div className="cute-modal-heading mb-4 flex items-center justify-between">
              <ModalDecoration />
              <div>
                <h2 className="text-rose-900">
                  Duty Log Details
                </h2>
                <p className="text-sm text-rose-700">
                  Read-only view of the selected entry.
                </p>
              </div>
              <button
                type="button"
                onClick={closeViewModal}
                className="rounded-lg border border-rose-200 p-2 text-rose-700 transition hover:bg-rose-50"
                aria-label="Close view modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                  Date
                </p>
                <p className="mt-1 text-sm font-semibold text-rose-900">
                  {String(viewLog.duty_date).slice(0, 10)}
                </p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                  Hospital
                </p>
                <p className="mt-1 text-sm font-semibold text-rose-900">
                  {viewLog.hospital || "-"}
                </p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                  Ward
                </p>
                <p className="mt-1 text-sm font-semibold text-rose-900">
                  {viewLog.ward || "-"}
                </p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                  Shift
                </p>
                <p className="mt-1 text-sm font-semibold text-rose-900">
                  {viewLog.shift || "-"}
                </p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                  Time In
                </p>
                <p className="mt-1 text-sm font-semibold text-rose-900">
                  {viewLog.time_in || "-"}
                </p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                  Time Out
                </p>
                <p className="mt-1 text-sm font-semibold text-rose-900">
                  {viewLog.time_out || "-"}
                </p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                  Total Hours
                </p>
                <p className="mt-1 text-sm font-semibold text-rose-900">
                  {Number(viewLog.total_hours || 0).toFixed(2)}
                </p>
              </div>
              <div className="rounded-xl border border-pink-200 bg-pink-50/50 px-4 py-3 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
                  Remarks
                </p>
                <p className="mt-1 text-sm text-rose-800">
                  {viewLog.remarks || "No remarks"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="cute-modal-overlay fixed inset-0 z-50 grid place-items-center bg-rose-950/35 p-4 backdrop-blur-sm">
          <div className="cute-modal w-full max-w-2xl rounded-3xl border border-pink-200 bg-white p-6 shadow-2xl md:p-7">
            <div className="cute-modal-heading mb-4 flex items-center justify-between">
              <ModalDecoration />
              <div>
                <h2 className="text-rose-900">
                  Add Duty Log
                </h2>
                <p className="text-sm text-rose-700">
                  Create a new shift entry.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg border border-rose-200 p-2 text-rose-700 transition hover:bg-rose-50"
                aria-label="Close create modal"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2">
              <ModalDateTimeField label="Duty date"
                type="date"
                value={formData.dutyDate}
                onChange={(e) =>
                  setFormData({ ...formData, dutyDate: e.target.value })
                }
                className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                required
              />
              <input
                type="text"
                placeholder="e.g. Philippine General Hospital" aria-label="Hospital"
                value={formData.hospital}
                onChange={(e) =>
                  setFormData({ ...formData, hospital: e.target.value, facilityLocation: null })
                }
                className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                required
              />
              <FacilityPicker hospital={formData.hospital} location={formData.facilityLocation} onChange={(facility) => setFormData({ ...formData, facilityLocation: facility, ...(facility?.name ? { hospital: facility.name } : {}) })} />
              <input
                type="text"
                placeholder="e.g. Emergency Room" aria-label="Ward"
                value={formData.ward}
                onChange={(e) =>
                  setFormData({ ...formData, ward: e.target.value })
                }
                className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                required
              />
              <select
                value={formData.shift}
                onChange={(e) =>
                  setFormData({ ...formData, shift: e.target.value })
                }
                className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                required
              >
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Night</option>
              </select>
              <ModalDateTimeField label="Time in"
                type="time"
                value={formData.timeIn}
                onChange={(e) =>
                  setFormData({ ...formData, timeIn: e.target.value })
                }
                className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                required
              />
              <ModalDateTimeField label="Time out"
                type="time"
                value={formData.timeOut}
                onChange={(e) =>
                  setFormData({ ...formData, timeOut: e.target.value })
                }
                className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                required
              />
              <input
                type="text"
                placeholder="Optional notes about your shift" aria-label="Remarks"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300 md:col-span-2"
              />

              <div className="mt-2 flex justify-end gap-2 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Saving..." : "Add Duty Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
