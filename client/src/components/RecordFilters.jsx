import { Flower2, RotateCcw, Search } from "lucide-react";

export default function RecordFilters({ onSubmit, onClear, loading, children }) {
  return (
    <form className="record-filters" onSubmit={onSubmit} aria-label="Find records">
      <div className="record-filter-heading"><span><Search size={20} /> Search & filters</span><Flower2 className="filter-flower" size={27} aria-hidden="true" /></div>
      <div className="record-filter-fields">{children}</div>
      <div className="record-filter-actions">
        <button type="submit" disabled={loading}><Search size={17} /> {loading ? "Finding..." : "Find records"}</button>
        <button type="button" onClick={onClear} disabled={loading}><RotateCcw size={16} /> Reset</button>
      </div>
    </form>
  );
}
