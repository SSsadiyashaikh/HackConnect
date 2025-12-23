import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { FiCalendar, FiMapPin, FiUsers, FiClock, FiSearch } from 'react-icons/fi';
import { format } from 'date-fns';

const StudentDashboard = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    domain: '',
    location: '',
    date: '',
  });

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hackathon Dashboard</h1>
        <p className="text-gray-600">Discover and join exciting hackathons</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search hackathons..."
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            value={filters.domain}
            onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
          >
            <option value="">All Domains</option>
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Location..."
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          />
          <input
            type="date"
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
        </div>
      </div>

      {/* Hackathons List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : hackathons.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hackathons found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((hackathon) => (
            <div
              key={hackathon._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{hackathon.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    hackathon.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                    hackathon.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {hackathon.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{hackathon.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <FiMapPin className="mr-2" />
                    {hackathon.isOnline ? 'Online' : hackathon.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FiCalendar className="mr-2" />
                    {format(new Date(hackathon.startDate), 'MMM dd, yyyy')} - {format(new Date(hackathon.endDate), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FiUsers className="mr-2" />
                    {hackathon.participants?.length || 0} participants
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FiClock className="mr-2" />
                    Deadline: {format(new Date(hackathon.registrationDeadline), 'MMM dd, yyyy')}
                  </div>
                </div>

                <div className="mb-4">
                  <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded mr-2">
                    {hackathon.domain}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <Link
                    to={`/hackathons/${hackathon._id}`}
                    className="flex-1 text-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
                  >
                    View Details
                  </Link>
                  {hackathon.participants?.some(p => p._id === JSON.parse(localStorage.getItem('user'))?.id) ? (
                    <button
                      disabled
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-600 rounded-md cursor-not-allowed"
                    >
                      Registered
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(hackathon._id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                    >
                      Register
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;


