import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { FiPlus, FiUsers, FiCalendar, FiEdit, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';

const OrganizerDashboard = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: '',
    location: '',
    isOnline: false,
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    maxParticipants: '',
    maxTeamSize: 4,
    minTeamSize: 1,
    skillRequirements: '',
    prizes: '',
  });

  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hackathons');
      // Filter to show only organizer's hackathons
      const user = JSON.parse(localStorage.getItem('user'));
      const myHackathons = response.data.filter(
        h => h.organizer?._id === user.id || h.organizer === user.id
      );
      setHackathons(myHackathons);
    } catch (error) {
      console.error('Error fetching hackathons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const skillReqs = formData.skillRequirements
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      const prizes = formData.prizes
        .split(',')
        .map(p => p.trim())
        .filter(p => p)
        .map((p, i) => ({
          position: ['1st', '2nd', '3rd'][i] || `${i + 1}th`,
          prize: p,
        }));

      await api.post('/hackathons', {
        ...formData,
        skillRequirements: skillReqs,
        prizes,
        maxParticipants: formData.maxParticipants || null,
      });

      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        domain: '',
        location: '',
        isOnline: false,
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        maxParticipants: '',
        maxTeamSize: 4,
        minTeamSize: 1,
        skillRequirements: '',
        prizes: '',
      });
      fetchHackathons();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create hackathon');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this hackathon?')) return;
    try {
      await api.delete(`/hackathons/${id}`);
      fetchHackathons();
    } catch (error) {
      alert('Failed to delete hackathon');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Organizer Dashboard</h1>
          <p className="text-gray-600">Manage your hackathons and participants</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <FiPlus className="mr-2" />
          Create Hackathon
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Hackathon</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domain *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                >
                  <option value="">Select domain</option>
                  <option>Web Development</option>
                  <option>Mobile Development</option>
                  <option>AI/ML</option>
                  <option>Blockchain</option>
                  <option>IoT</option>
                  <option>Cybersecurity</option>
                  <option>Data Science</option>
                  <option>Game Development</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.isOnline}
                  onChange={(e) => setFormData({ ...formData, isOnline: e.target.checked })}
                />
                <label className="text-sm font-medium text-gray-700">Online Event</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Deadline *
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.registrationDeadline}
                  onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Participants (optional)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Team Size
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.maxTeamSize}
                  onChange={(e) => setFormData({ ...formData, maxTeamSize: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Team Size
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.minTeamSize}
                  onChange={(e) => setFormData({ ...formData, minTeamSize: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                required
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skill Requirements (comma-separated)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="React, Node.js, Python..."
                value={formData.skillRequirements}
                onChange={(e) => setFormData({ ...formData, skillRequirements: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prizes (comma-separated)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="$1000, $500, $250..."
                value={formData.prizes}
                onChange={(e) => setFormData({ ...formData, prizes: e.target.value })}
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Create Hackathon
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : hackathons.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No hackathons created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {hackathons.map((hackathon) => (
            <div key={hackathon._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{hackathon.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{hackathon.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/hackathons/${hackathon._id}`}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                  >
                    <FiEdit />
                  </Link>
                  <button
                    onClick={() => handleDelete(hackathon._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FiUsers className="mr-2" />
                  {hackathon.participants?.length || 0} participants
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FiCalendar className="mr-2" />
                  {format(new Date(hackathon.startDate), 'MMM dd, yyyy')}
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Status: </span>
                  <span className={`font-medium ${
                    hackathon.status === 'upcoming' ? 'text-blue-600' :
                    hackathon.status === 'ongoing' ? 'text-green-600' :
                    'text-gray-600'
                  }`}>
                    {hackathon.status}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded">
                    {hackathon.domain}
                  </span>
                </div>
              </div>
              <Link
                to={`/hackathons/${hackathon._id}`}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                View Details & Manage →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;


