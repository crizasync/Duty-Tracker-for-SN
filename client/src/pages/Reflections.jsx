import ModalDateTimeField from "../components/ModalDateTimeField";
import ModalDecoration from "../components/ModalDecoration";
import { Link } from "react-router-dom";
import RecordEmpty from "../components/RecordEmpty";
import RecordFilters from "../components/RecordFilters";
import useDesktopRecords from "../hooks/useDesktopRecords";
import PageHeading from "../components/PageHeading";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Eye, LayoutGrid, List, Pencil, Plus, Trash2, X } from "lucide-react";
import MenuBar from "../components/MenuBar";
import {
  deleteReflection,
  getReflections,
  updateReflection,
} from "../services/reflection";

const initialForm = {
  title: "",
  content: "",
  dutyDate: "",
};

export default function Reflections() {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    keyword: "",
  });
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const desktopRecords = useDesktopRecords();
  const [viewMode, setViewMode] = useState("tile");
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [viewReflection, setViewReflection] = useState(null);
  const [editingReflectionId, setEditingReflectionId] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);

  const loadReflections = useCallback(async (queryFilters = {}) => {
    try {
      const params = {
        ...(queryFilters.startDate
          ? { startDate: queryFilters.startDate }
          : {}),
        ...(queryFilters.endDate ? { endDate: queryFilters.endDate } : {}),
        ...(queryFilters.keyword ? { keyword: queryFilters.keyword } : {}),
      };
      const res = await getReflections(params);
      setReflections(res.data.reflections || []);
    } catch {
      toast.error("Could not load reflections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReflections();
  }, [loadReflections]);

  const totalReflections = reflections.length;
  const totalWords = useMemo(
    () =>
      reflections.reduce(
        (sum, item) =>
          sum +
          String(item.content || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean).length,
        0,
      ),
    [reflections],
  );

  const handleDelete = async (id) => {
    try {
      await deleteReflection(id);
      toast.success("Reflection deleted");
      await loadReflections(filters);
    } catch {
      toast.error("Failed to delete reflection");
    }
  };

  const handleFilter = async (e) => {
    e.preventDefault();
    setLoading(true);
    await loadReflections(filters);
  };

  const clearFilters = async () => {
    const resetFilters = { startDate: "", endDate: "", keyword: "" };
    setFilters(resetFilters);
    setLoading(true);
    await loadReflections(resetFilters);
  };

  const openEditModal = (reflection) => {
    setEditingReflectionId(reflection.id);
    setEditForm({
      title: reflection.title || "",
      content: reflection.content || "",
      dutyDate: String(reflection.duty_date).slice(0, 10),
    });
    setIsEditOpen(true);
  };

  const openViewModal = (reflection) => {
    setViewReflection(reflection);
    setIsViewOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingReflectionId(null);
    setEditForm(initialForm);
  };

  const closeViewModal = () => {
    setIsViewOpen(false);
    setViewReflection(null);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    if (!editingReflectionId) return;

    setUpdating(true);
    try {
      await updateReflection(editingReflectionId, editForm);
      toast.success("Reflection updated");
      closeEditModal();
      await loadReflections(filters);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update reflection",
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
          <PageHeading eyebrow="REFLECTIONS" title="Your journal" description="A little space to reflect.">
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-xl border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-700">
                Total Reflections: {totalReflections} | Words: {totalWords}
              </div>
              <Link
                to="/reflections/new"
                className="page-heading-primary-action reflection-add-link inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105"
              >
                <Plus size={16} />
                Add Reflection
              </Link>
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
            <label className="record-filter-field"><span>Keyword</span><input
              type="text"
              placeholder="Search keyword"
              value={filters.keyword}
              onChange={(e) =>
                setFilters({ ...filters, keyword: e.target.value })
              }
              className="rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300"
            /></label>

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
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Content</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100 bg-white">
                  {!loading && reflections.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-rose-700"
                      >
                        No reflections found.
                      </td>
                    </tr>
                  )}

                  {reflections.map((reflection) => (
                    <tr key={reflection.id} className="hover:bg-rose-50/60">
                      <td className="px-4 py-3">
                        {String(reflection.duty_date).slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 font-medium text-rose-900">
                        {reflection.title}
                      </td>
                      <td
                        className="max-w-[360px] truncate px-4 py-3"
                        title={reflection.content || ""}
                      >
                        {reflection.content || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openViewModal(reflection)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(reflection)}
                            className="inline-flex items-center gap-1 rounded-lg border border-pink-300 bg-pink-50 px-2.5 py-1.5 text-xs font-semibold text-pink-700 transition hover:bg-pink-100"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(reflection.id)}
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
              {!loading && reflections.length === 0 && (
                <RecordEmpty>No reflections found.</RecordEmpty>
              )}

              {reflections.map((reflection) => (
                <article
                  key={reflection.id}
                  className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
                        Reflection Note
                      </p>
                      <h3 className="mt-1 text-rose-900">
                        {reflection.title}
                      </h3>
                    </div>
                    <div className="rounded-lg bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-700">
                      {String(reflection.duty_date).slice(0, 10)}
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-4 text-sm text-rose-700">
                    {reflection.content || "No content"}
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openViewModal(reflection)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(reflection)}
                      className="inline-flex items-center gap-1 rounded-lg border border-pink-300 bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-700 transition hover:bg-pink-100"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(reflection.id)}
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

      {isEditOpen && (
        <ModalShell title="Edit Reflection" onClose={closeEditModal}>
          <ReflectionForm
            formData={editForm}
            setFormData={setEditForm}
            onSubmit={handleEditSave}
            submitting={updating}
            submitLabel="Save Changes"
          />
        </ModalShell>
      )}

      {isViewOpen && viewReflection && (
        <ModalShell title="Reflection Details" onClose={closeViewModal}>
          <div className="grid gap-3 md:grid-cols-2">
            <DetailCard
              label="Date"
              value={String(viewReflection.duty_date).slice(0, 10)}
            />
            <DetailCard label="Title" value={viewReflection.title} />
            <div className="rounded-xl border border-pink-200 bg-pink-50/50 px-4 py-3 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
                Content
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-rose-800">
                {viewReflection.content || "No content"}
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

function ReflectionForm({
  formData,
  setFormData,
  onSubmit,
  submitting,
  submitLabel,
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
      <ModalDateTimeField label="Duty date"
        type="date"
        value={formData.dutyDate}
        onChange={(e) => setFormData({ ...formData, dutyDate: e.target.value })}
        className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
        required
      />
      <input
        type="text"
        placeholder="e.g. My first shift in the ER" aria-label="Reflection title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
        required
      />
      <textarea
        placeholder="What happened, what did you learn, and how did you feel?" aria-label="Reflection content"
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        className="min-h-36 rounded-xl border border-pink-200 bg-pink-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300 md:col-span-2"
        required
      />

      <div className="mt-2 flex justify-end gap-2 md:col-span-2">
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
