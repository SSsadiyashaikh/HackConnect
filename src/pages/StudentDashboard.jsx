import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useMemo } from 'react';
import FilterBar from '../components/FilterBar';
import HackathonCard from '../components/HackathonCard';
import HackathonCardSkeleton from '../components/HackathonCardSkeleton';

const StudentDashboard = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    domain: '',
    location: '',
    date: '',
  });

  const currentUserId = useMemo(
    () => JSON.parse(localStorage.getItem('user'))?.id,
    []
  );

  const totalHackathons = hackathons.length;
  const upcomingHackathons = hackathons.filter(h => h.status === 'upcoming').length;
  const registeredHackathons = hackathons.filter(h =>
    h.participants?.some(p => p._id === currentUserId)
  ).length;

  useEffect(() => {
    fetchHackathons();
  }, [filters]);

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.domain) params.append('domain', filters.domain);
      if (filters.location) params.append('location', filters.location);
      if (filters.date) params.append('date', filters.date);

      const response = await api.get(`/hackathons?${params.toString()}`);
      setHackathons(response.data);
    } catch (error) {
      console.error('Error fetching hackathons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (hackathonId) => {
    try {
      await api.post(`/hackathons/${hackathonId}/register`);
      fetchHackathons();
      alert('Successfully registered!');
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  const domains = [
    'Web Development',
    'Mobile Development',
    'AI/ML',
    'Blockchain',
    'IoT',
    'Cybersecurity',
    'Data Science',
    'Game Development',
    'Other',
  ];

  const handleApplyFilters = () => {
    fetchHackathons();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page header */}
      <section className="pt-2 sm:pt-4 pb-4">
        <div className="rounded-2xl bg-gradient-to-r from-primary-50 via-sky-50 to-indigo-50 px-5 py-5 sm:px-8 sm:py-6 border border-slate-100">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-1">
            Hackathon Dashboard
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Discover, register, and collaborate in hackathons that match your skills.
          </p>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">Total Hackathons</p>
          <p className="text-2xl font-semibold text-slate-900">{totalHackathons}</p>
          <p className="mt-1 text-xs text-slate-500">Visible with current filters</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">Upcoming</p>
          <p className="text-2xl font-semibold text-blue-600">{upcomingHackathons}</p>
          <p className="mt-1 text-xs text-slate-500">Yet to start</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">You&apos;re Registered</p>
          <p className="text-2xl font-semibold text-emerald-600">{registeredHackathons}</p>
          <p className="mt-1 text-xs text-slate-500">Hackathons you joined</p>
        </div>
      </section>

      {/* Filters */}
      <section className="mb-6">
        <FilterBar
          filters={filters}
          domains={domains}
          onChange={setFilters}
          onApply={handleApplyFilters}
        />
      </section>

      {/* Hackathons list */}
      <section className="pb-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <HackathonCardSkeleton key={idx} />
            ))}
          </div>
        ) : hackathons.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600 text-2xl font-semibold">
              HC
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">No hackathons found</h2>
            <p className="text-sm text-slate-500 mb-3 max-w-md">
              Try adjusting your filters or check back later. New hackathons are added regularly.
            </p>
            <button
              type="button"
              onClick={() => setFilters({ search: '', domain: '', location: '', date: '' })}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {hackathons.map((hackathon) => (
              <HackathonCard
                key={hackathon._id}
                hackathon={hackathon}
                variant="student"
                isRegistered={hackathon.participants?.some((p) => p._id === currentUserId)}
                onViewDetails={() => (window.location.href = `/hackathons/${hackathon._id}`)}
                onRegister={() => handleRegister(hackathon._id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;


