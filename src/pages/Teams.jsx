import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiUsers, FiPlus, FiMessageSquare } from 'react-icons/fi';

const Teams = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const hackathonId = searchParams.get('hackathon');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    lookingFor: '',
  });

  useEffect(() => {
    if (hackathonId) {
      fetchTeams(hackathonId);
    }
  }, [hackathonId]);

  const fetchTeams = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/teams/hackathon/${id}`);
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const lookingFor = formData.lookingFor
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      await api.post('/teams', {
        name: formData.name,
        hackathonId,
        description: formData.description,
        lookingFor,
      });

      setShowCreateForm(false);
      setFormData({ name: '', description: '', lookingFor: '' });
      fetchTeams(hackathonId);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create team');
    }
  };

  const handleJoinTeam = async (teamId, role = 'other') => {
    try {
      await api.post(`/teams/${teamId}/join`, { role });
      fetchTeams(hackathonId);
      alert('Successfully joined team!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to join team');
    }
  };

  const isMember = (team) => {
    if (team.leader?._id === user?.id || team.leader === user?.id) return true;
    return team.members?.some(m => m.user?._id === user?.id || m.user === user?.id);
  };

  if (!hackathonId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-500">Please select a hackathon to view teams</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <FiPlus className="mr-2" />
          Create Team
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Team</h2>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Name *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Looking For (comma-separated skills)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="React, Node.js, Designer..."
                value={formData.lookingFor}
                onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value })}
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Create Team
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
      ) : teams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No teams yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {teams.map((team) => (
            <div key={team._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{team.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{team.description}</p>
                </div>
                {isMember(team) && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    Member
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <FiUsers className="mr-2" />
                  {team.members?.length || 0}/{team.maxSize} members
                </div>

                {/* Show a short list of team members */}
                {team.members && team.members.length > 0 && (
                  <div className="mt-1 space-y-1 text-sm text-gray-700">
                    {team.members.slice(0, 3).map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span>
                          {typeof member.user === 'object' ? member.user.name : 'Member'}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {member.role}
                        </span>
                      </div>
                    ))}
                    {team.members.length > 3 && (
                      <p className="text-xs text-gray-500 mt-1">
                        +{team.members.length - 3} more member(s)
                      </p>
                    )}
                  </div>
                )}

                {team.lookingFor?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {team.lookingFor.map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/teams/${team._id}`}
                  className="flex-1 text-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  View Team
                </Link>
                {!isMember(team) && team.members?.length < team.maxSize && (
                  <button
                    onClick={() => handleJoinTeam(team._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Join Team
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Teams;


