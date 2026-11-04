import ModalDecoration from "../components/ModalDecoration";
import RecordEmpty from "../components/RecordEmpty";
import RecordFilters from "../components/RecordFilters";
import useDesktopRecords from "../hooks/useDesktopRecords";
import PageHeading from "../components/PageHeading";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Eye, LayoutGrid, List, Pencil, Plus, Trash2, X } from "lucide-react";
import MenuBar from "../components/MenuBar";
import {
  createProcedure,
  deleteProcedure,
  getProcedures,
  updateProcedure,
} from "../services/procedures";

const initialForm = {
  procedureName: "",
  status: "Completed",
  frequency: "",
  notes: "",
  datePerformed: "",
};

export default function Procedures() {
  const [formData, setFormData] = useState(initialForm);
  const [filters, setFilters] = useState({ status: "", procedureName: "" });
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const desktopRecords = useDesktopRecords();
  const [viewMode, setViewMode] = useState("tile");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [viewProcedure, setViewProcedure] = useState(null);
  const [editingProcedureId, setEditingProcedureId] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);

  const loadProcedures = useCallback(async (queryFilters = {}) => {
    try {
      const params = {
        ...(queryFilters.status ? { status: queryFilters.status } : {}),
        ...(queryFilters.procedureName
          ? { procedureName: queryFilters.procedureName }
          : {}),
      };
      const res = await getProcedures(params);
      setProcedures(res.data.procedures || []);
    } catch {
      toast.error("Could not load procedures");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProcedures();
  }, [loadProcedures]);

  const totalProcedures = procedures.length;
  const completedProcedures = useMemo(
    () => procedures.filter((item) => item.status === "Completed").length,
    [procedures],
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createProcedure(formData);
      toast.success("Procedure created");
      setFormData(initialForm);
      setIsCreateOpen(false);
      await loadProcedures();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create procedure",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProcedure(id);
      toast.success("Procedure deleted");
      await loadProcedures(filters);
    } catch {
      toast.error("Failed to delete procedure");
    }
  };

  const handleFilter = async (e) => {
    e.preventDefault();
    setLoading(true);
    await loadProcedures(filters);
  };

  const clearFilters = async () => {
    const resetFilters = { status: "", procedureName: "" };
    setFilters(resetFilters);
    setLoading(true);
    await loadProcedures(resetFilters);
  };

  const openEditModal = (procedure) => {
    setEditingProcedureId(procedure.id);
    setEditForm({
      procedureName: procedure.procedure_name || "",
      status: procedure.status || "Completed",
      frequency: procedure.frequency || "",
      notes: procedure.notes || "",
      datePerformed: String(procedure.date_performed).slice(0, 10),
    });
    setIsEditOpen(true);
  };

  const openViewModal = (procedure) => {
    setViewProcedure(procedure);
    setIsViewOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingProcedureId(null);
    setEditForm(initialForm);
  };

  const closeViewModal = () => {
    setIsViewOpen(false);
    setViewProcedure(null);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editingProcedureId) return;

    setUpdating(true);
    try {
      await updateProcedure(editingProcedureId, editForm);
      toast.success("Procedure updated");
      closeEditModal();
      await loadProcedures(filters);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update procedure",
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="app-page min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <MenuBar />

        <div className="records-panel rounded-3xl border border-rose-200 bg-white p-6 shadow-sm md:p-8">
          <PageHeading eyebrow="PROCEDURES" title="Your practice" description="Keep your skills growing.">
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-xl border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-700">
                Total: {totalProcedures} | Completed: {completedProcedures}
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="page-heading-primary-action inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
              >
                <Plus size={16} />
                Add Procedure
              </button>
            </div>
          </PageHeading>

          <RecordFilters onSubmit={handleFilter} onClear={clearFilters} loading={loading}>

            <label className="record-filter-field"><span>Procedure name</span><input
              type="text"
              placeholder="Search procedure name"
              value={filters.procedureName}
              onChange={(e) =>
                setFilters({ ...filters, procedureName: e.target.value })
              }
              className="rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300"
            /></label>
            <label className="record-filter-field"><span>Status</span><select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300"
            >
              <option value="">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select></label>

          </RecordFilters>

          <div className="record-view-switch mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 px-3 py-2">
            <p className="text-sm font-semibold text-rose-800">View</p>
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
                    <th className="px-4 py-3">Procedure</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Frequency</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100 bg-white">
                  {!loading && procedures.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-rose-700"
                      >
                        No procedures found.
                      </td>
                    </tr>
                  )}
                  {procedures.map((procedure) => (
                    <tr key={procedure.id} className="hover:bg-rose-50/60">
                      <td className="px-4 py-3">
                        {String(procedure.date_performed).slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 font-medium text-rose-900">
                        {procedure.procedure_name}
                      </td>
                      <td className="px-4 py-3">{procedure.status}</td>
                      <td className="px-4 py-3">
                        {procedure.frequency || "-"}
                      </td>
                      <td
                        className="max-w-[260px] truncate px-4 py-3"
                        title={procedure.notes || ""}
                      >
                        {procedure.notes || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openViewModal(procedure)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(procedure)}
                            className="inline-flex items-center gap-1 rounded-lg border border-pink-300 bg-pink-50 px-2.5 py-1.5 text-xs font-semibold text-pink-700 transition hover:bg-pink-100"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(procedure.id)}
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
              {!loading && procedures.length === 0 && (
                <RecordEmpty>No procedures found.</RecordEmpty>
              )}
              {procedures.map((procedure) => (
                <article
                  key={procedure.id}
                  className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
                        {procedure.status}
                      </p>
                      <h3 className="mt-1 text-rose-900">
                        {procedure.procedure_name}
                      </h3>
                      <p className="text-sm text-rose-700">
                        {procedure.frequency || "No frequency specified"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-700">
                      {String(procedure.date_performed).slice(0, 10)}
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm text-rose-700">
                    {procedure.notes || "No notes"}
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openViewModal(procedure)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(procedure)}
                      className="inline-flex items-center gap-1 rounded-lg border border-pink-300 bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-700 transition hover:bg-pink-100"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(procedure.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {isCreateOpen && (
        <ModalShell
          title="Add Procedure"
          onClose={() => setIsCreateOpen(false)}
        >
          <ProcedureForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreate}
            submitting={submitting}
            submitLabel="Add Procedure"
          />
        </ModalShell>
      )}

      {isEditOpen && (
        <ModalShell title="Edit Procedure" onClose={closeEditModal}>
          <ProcedureForm
            formData={editForm}
            setFormData={setEditForm}
            onSubmit={handleEditSave}
            submitting={updating}
            submitLabel="Save Changes"
          />
        </ModalShell>
      )}

      {isViewOpen && viewProcedure && (
        <ModalShell title="Procedure Details" onClose={closeViewModal}>
          <div className="grid gap-3 md:grid-cols-2">
            <DetailCard
              label="Date"
              value={String(viewProcedure.date_performed).slice(0, 10)}
            />
            <DetailCard label="Status" value={viewProcedure.status} />
            <DetailCard
              label="Procedure Name"
              value={viewProcedure.procedure_name}
            />
            <DetailCard label="Frequency" value={viewProcedure.frequency} />
            <div className="rounded-xl border border-pink-200 bg-pink-50/50 px-4 py-3 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
                Notes
              </p>
              <p className="mt-1 text-sm text-rose-800">
                {viewProcedure.notes || "No notes"}
              </p>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="cute-modal-overlay fixed inset-0 z-50 grid place-items-center bg-rose-950/35 p-4 backdrop-blur-sm">
          <div className="cute-modal w-full max-w-2xl rounded-3xl border border-pink-200 bg-white p-6 shadow-2xl md:p-7">
            <div className="cute-modal-heading mb-4 flex items-center justify-between">
              <ModalDecoration />
          <div>
            <h2 className="text-rose-900">{title}</h2>
            <p className="text-sm text-rose-700">
              Use the form below to save your entry.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-rose-200 p-2 text-rose-700 transition hover:bg-rose-50"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ProcedureForm({
  formData,
  setFormData,
  onSubmit,
  submitting,
  submitLabel,
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
      <input
        type="text"
        placeholder="Procedure name"
        value={formData.procedureName}
        onChange={(e) =>
          setFormData({ ...formData, procedureName: e.target.value })
        }
        className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
        required
      />
      <select
        value={formData.status}
        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
        required
      >
        <option>Completed</option>
        <option>Pending</option>
      </select>
      <input
        type="text"
        placeholder="Frequency"
        value={formData.frequency}
        onChange={(e) =>
          setFormData({ ...formData, frequency: e.target.value })
        }
        className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
      />
      <input
        type="date"
        value={formData.datePerformed}
        onChange={(e) =>
          setFormData({ ...formData, datePerformed: e.target.value })
        }
        className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
        required
      />
      <textarea
        placeholder="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        className="min-h-28 rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300 md:col-span-2"
      />

      <div className="mt-2 flex justify-end gap-2 md:col-span-2">
        <button
          type="button"
          onClick={() => {
            const closeButton = document.activeElement;
            if (closeButton && typeof closeButton.blur === "function")
              closeButton.blur();
          }}
          className="hidden"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function DetailCard({ label, value }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-rose-900">{value || "-"}</p>
    </div>
  );
}
