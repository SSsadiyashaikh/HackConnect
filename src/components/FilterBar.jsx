import { FiSearch, FiFilter } from 'react-icons/fi';

const FilterBar = ({ filters, domains, onChange, onApply }) => {
  const handleChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <FiFilter className="h-4 w-4" />
          <span>Filter hackathons</span>
        </div>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search hackathons..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-9 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>

        {/* Domain */}
        <div className="flex-1 min-w-[160px]">
          <select
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={filters.domain}
            onChange={(e) => handleChange('domain', e.target.value)}
          >
            <option value="">All domains</option>
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="flex-1 min-w-[160px]">
          <input
            type="text"
            placeholder="Location or Online"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={filters.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </div>

        {/* Date */}
        <div className="flex-1 min-w-[140px]">
          <input
            type="date"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={filters.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
        </div>

        {/* Apply */}
        <div className="flex items-stretch lg:justify-end">
          <button
            type="button"
            onClick={onApply}
            className="inline-flex w-full lg:w-auto items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
