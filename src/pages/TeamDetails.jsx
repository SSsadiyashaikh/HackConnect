import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { FiUsers, FiMessageSquare, FiSend, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';

const TeamDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [suggestedMembers, setSuggestedMembers] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  useEffect(() => {
    fetchTeam();
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('join-team', id);

    newSocket.on('receive-message', (data) => {
      setTeam((prev) => ({
        ...prev,
        chat: [...(prev?.chat || []), data],
      }));
    });

    return () => {
      newSocket.emit('leave-team', id);
      newSocket.close();
    };
  }, [id]);

  useEffect(() => {
    if (team && user && (team.leader?._id === user.id || team.leader === user.id)) {
      fetchSuggestedMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team, user]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/teams/${id}`);
      setTeam(response.data);
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestedMembers = async () => {
    try {
      setSuggestionsLoading(true);
      const response = await api.get(`/teams/${id}/member-suggestions`);
      setSuggestedMembers(response.data);
    } catch (error) {
      console.error('Error fetching suggested members:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await api.post(`/teams/${id}/chat`, { message });
      if (socket) {
        socket.emit('send-message', {
          teamId: id,
          user: { _id: user.id, name: user.name },
          message,
          timestamp: new Date(),
        });
      }
      setMessage('');
      fetchTeam();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const isLeader = team?.leader?._id === user?.id || team?.leader === user?.id;
  const isMember = isLeader || team?.members?.some(
    m => m.user?._id === user?.id || m.user === user?.id
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-gray-500">Team not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{team.name}</h1>
            <p className="text-gray-600 mb-4">{team.description}</p>
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <FiUsers className="mr-2" />
              {team.members?.length || 0}/{team.maxSize} members
            </div>
            {team.lookingFor?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Looking For:</h3>
                <div className="flex flex-wrap gap-2">
                  {team.lookingFor.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isMember && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FiMessageSquare className="mr-2" />
                Team Chat
              </h2>
              <div className="border border-gray-200 rounded-lg p-4 h-96 overflow-y-auto mb-4">
                {team.chat?.map((msg, idx) => (
                  <div key={idx} className="mb-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <FiUser className="text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="font-semibold text-sm">
                            {typeof msg.user === 'object' ? msg.user.name : 'User'}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {format(new Date(msg.timestamp), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        <p className="text-gray-700">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!team.chat || team.chat.length === 0) && (
                  <p className="text-gray-500 text-center">No messages yet</p>
                )}
              </div>
              <form onSubmit={sendMessage} className="flex space-x-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
                >
                  <FiSend className="mr-2" />
                  Send
                </button>
              </form>
            </div>
          )}
        </div>

        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Team Members</h2>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {typeof team.leader === 'object' ? team.leader.name : 'Leader'}
                      </p>
                      <Link
                        to={
                          typeof team.leader === 'object'
                            ? `/users/${team.leader._id}`
                            : `/users/${team.leader}`
                        }
                        className="inline-flex items-center gap-1 rounded-full border border-primary-100 bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700 hover:bg-primary-100"
                      >
                        <FiUser className="h-3 w-3" />
                        <span>View profile</span>
                      </Link>
                    </div>
                    <p className="text-sm text-gray-600">Team Leader</p>
                  </div>
                  {isLeader && (
                    <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs">
                      You
                    </span>
                  )}
                </div>
              </div>
              {team.members?.map((member, idx) => (
                <div key={idx} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {typeof member.user === 'object' ? member.user.name : 'Member'}
                        </p>
                        <Link
                          to={
                            typeof member.user === 'object'
                              ? `/users/${member.user._id}`
                              : `/users/${member.user}`
                          }
                          className="inline-flex items-center gap-1 rounded-full border border-primary-100 bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700 hover:bg-primary-100"
                        >
                          <FiUser className="h-3 w-3" />
                          <span>View profile</span>
                        </Link>
                      </div>
                      <p className="text-sm text-gray-600 capitalize">{member.role}</p>
                    </div>
                    {(member.user?._id === user?.id || member.user === user?.id) && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs">
                        You
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {!isMember && team.members?.length < team.maxSize && (
              <button
                onClick={async () => {
                  try {
                    await api.post(`/teams/${id}/join`);
                    fetchTeam();
                  } catch (error) {
                    alert(error.response?.data?.message || 'Failed to join team');
                  }
                }}
                className="w-full mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Join Team
              </button>
            )}
          </div>

          {isLeader && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Suggested Members</h2>
                <button
                  onClick={fetchSuggestedMembers}
                  className="text-sm px-3 py-1 bg-primary-100 text-primary-800 rounded-md hover:bg-primary-200"
                >
                  Refresh
                </button>
              </div>
              {suggestionsLoading ? (
                <p className="text-gray-500">Loading suggestions...</p>
              ) : suggestedMembers.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No suggested members yet. Make sure your team "Looking For" skills are filled and participants have skills in their profiles.
                </p>
              ) : (
                <div className="space-y-4">
                  {suggestedMembers.map((member) => (
                    <div key={member._id} className="border-b pb-3 last:border-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{member.name}</p>
                            <Link
                              to={`/users/${member._id}`}
                              className="inline-flex items-center gap-1 rounded-full border border-primary-100 bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700 hover:bg-primary-100"
                            >
                              <FiUser className="h-3 w-3" />
                              <span>View profile</span>
                            </Link>
                          </div>
                          <p className="text-sm text-gray-600">{member.email}</p>
                          {member.profile?.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {member.profile.skills.slice(0, 5).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="bg-primary-100 text-primary-800 px-2 py-0.5 rounded text-xs"
                                >
                                  {skill.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamDetails;


