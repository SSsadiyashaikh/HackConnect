import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiMapPin, FiCalendar, FiUsers, FiClock, FiAward } from 'react-icons/fi';
import { format } from 'date-fns';

const HackathonDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [hackathon, setHackathon] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hackathonRes, teamsRes] = await Promise.all([
        api.get(`/hackathons/${id}`),
        api.get(`/teams/hackathon/${id}`),
      ]);
      setHackathon(hackathonRes.data);
      setTeams(teamsRes.data);

      if (user?.role === 'student') {
        try {
          const suggestionsRes = await api.get(`/teams/suggestions/${id}`);
          setSuggestions(suggestionsRes.data);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      await api.post(`/hackathons/${id}/register`);
      fetchData();
      alert('Successfully registered!');
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    }
  };

  const isRegistered = hackathon?.participants?.some(
    p => p._id === user?.id || p === user?.id
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-500">Hackathon not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{hackathon.title}</h1>
            <p className="text-gray-600">{hackathon.description}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            hackathon.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
            hackathon.status === 'ongoing' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {hackathon.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div className="flex items-center text-gray-700">
              <FiMapPin className="mr-3 text-primary-600" />
              <span>{hackathon.isOnline ? 'Online Event' : hackathon.location}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <FiCalendar className="mr-3 text-primary-600" />
              <span>
                {format(new Date(hackathon.startDate), 'MMM dd, yyyy')} -{' '}
                {format(new Date(hackathon.endDate), 'MMM dd, yyyy')}
              </span>
            </div>
            <div className="flex items-center text-gray-700">
              <FiClock className="mr-3 text-primary-600" />
              <span>Registration Deadline: {format(new Date(hackathon.registrationDeadline), 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <FiUsers className="mr-3 text-primary-600" />
              <span>{hackathon.participants?.length || 0} participants</span>
            </div>
          </div>
          <div>
            <div className="mb-4">
              <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                {hackathon.domain}
              </span>
            </div>
            {hackathon.skillRequirements?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Required Skills:</h3>
                <div className="flex flex-wrap gap-2">
                  {hackathon.skillRequirements.map((skill, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {hackathon.prizes?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <FiAward className="mr-2" />
                  Prizes:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {hackathon.prizes.map((prize, idx) => (
                    <li key={idx} className="text-gray-700">
                      {prize.position}: {prize.prize}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {user?.role === 'student' && (
          <div className="mt-6">
            {isRegistered ? (
              <div className="flex space-x-4">
                <button
                  disabled
                  className="px-6 py-2 bg-gray-300 text-gray-600 rounded-md cursor-not-allowed"
                >
                  Already Registered
                </button>
                <Link
                  to={`/teams?hackathon=${id}`}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  View Teams
                </Link>
              </div>
            ) : (
              <button
                onClick={handleRegister}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Register for Hackathon
              </button>
            )}
          </div>
        )}
      </div>

      {user?.role === 'student' && suggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Suggested Teams for You</h2>
          <div className="space-y-4">
            {suggestions.slice(0, 3).map((team) => (
              <div key={team._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    <p className="text-sm text-gray-600">{team.description}</p>
                    <div className="mt-2">
                      <span className="text-sm text-gray-600">
                        {team.members?.length || 0}/{team.maxSize} members
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/teams/${team._id}`}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                  >
                    View Team
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Teams ({teams.length})</h2>
        {teams.length === 0 ? (
          <p className="text-gray-500">No teams yet</p>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    <p className="text-sm text-gray-600">{team.description}</p>
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <FiUsers className="mr-2" />
                      {team.members?.length || 0}/{team.maxSize} members
                    </div>
                  </div>
                  <Link
                    to={`/teams/${team._id}`}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                  >
                    View Team
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HackathonDetails;


