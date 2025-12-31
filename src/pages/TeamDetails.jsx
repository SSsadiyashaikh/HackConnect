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
  const [isHackathonParticipant, setIsHackathonParticipant] = useState(false);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [suggestedMembers, setSuggestedMembers] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  // Applications and quiz for this team
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  // Role-based join flow state
  const [selectedRole, setSelectedRole] = useState('frontend');
  const [roleSpecificQuestions, setRoleSpecificQuestions] = useState([]);
  const [quizResponses, setQuizResponses] = useState({}); // { [questionId]: selectedIndex }

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
      const teamData = response.data;
      setTeam(teamData);

      // After loading team, check if current user is a participant of the related hackathon
      if (user) {
        try {
          const hackathonId =
            typeof teamData.hackathon === 'object'
              ? teamData.hackathon._id
              : teamData.hackathon;

          if (hackathonId) {
            const hackathonRes = await api.get(`/hackathons/${hackathonId}`);
            const participants = hackathonRes.data?.participants || [];
            const isParticipant = participants.some(
              (p) => p._id === user.id || p === user.id
            );
            setIsHackathonParticipant(isParticipant);
          } else {
            setIsHackathonParticipant(false);
          }
        } catch (err) {
          console.error('Error checking hackathon participation:', err);
          setIsHackathonParticipant(false);
        }
      } else {
        setIsHackathonParticipant(false);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setApplicationsLoading(true);
      const response = await api.get(`/teams/${id}/applications`);
      setApplications(response.data.applications || []);
      // quizQuestions already come on team object from /teams/:id, so we only store applications here
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setApplicationsLoading(false);
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

  const buildRoleQuestions = (teamData, roleKey) => {
    const normalized = (roleKey || 'other').toLowerCase();
    const allQuestions = teamData.quizQuestions || [];
    return allQuestions.filter((q) => {
      const tag = (q.skillTag || 'other').toLowerCase();
      return tag === normalized;
    });
  };

  // Open quiz modal when joining a team (always select role first)
  const openQuizModal = () => {
    setSelectedRole('frontend');
    setRoleSpecificQuestions(buildRoleQuestions(team, 'frontend'));
    setQuizResponses({});
    setQuizModalOpen(true);
  };

  const handleSubmitQuizApplication = async () => {
    if (!team) return;

    const normalizedRole = (selectedRole || 'other').toLowerCase();
    const questionsForRole = buildRoleQuestions(team, normalizedRole);

    // If there are no role-specific questions or no quiz at all, attempt instant join for this role
    if ((!team.quizQuestions || team.quizQuestions.length === 0) || questionsForRole.length === 0) {
      try {
        await api.post(`/teams/${id}/join`, { role: normalizedRole });
        setQuizModalOpen(false);
        setQuizResponses({});
        await fetchTeam();
        alert('Successfully joined team!');
        return;
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to join team');
        return;
      }
    }

    try {
      const answers = questionsForRole.map((q) => ({
        questionId: q._id,
        selectedIndex:
          typeof quizResponses[q._id] === 'number' ? quizResponses[q._id] : 0,
      }));

      await api.post(`/teams/${id}/apply`, {
        role: normalizedRole,
        answers,
      });

      setQuizModalOpen(false);
      setQuizResponses({});
      await fetchTeam();
      await fetchApplications();
      alert('Application submitted. Team members will review your quiz.');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit application');
    }
  };

  const handleDecideApplication = async (appId, action) => {
    try {
      await api.post(`/teams/${id}/applications/${appId}/decide`, { action });
      await fetchTeam();
      await fetchApplications();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to process application');
    }
  };

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
            {team.quizQuestions && team.quizQuestions.length > 0 && (
              <span className="inline-block mb-4 px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full text-xs">
                Quiz required to join
              </span>
            )}
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
                            {msg.timestamp || msg.createdAt ? format(new Date(msg.timestamp || msg.createdAt), 'MMM dd, HH:mm') : 'Just now'}
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
            {!isMember && isHackathonParticipant && team.members?.length < team.maxSize && (
              <button
                onClick={async () => {
                  try {
                    // Always go through role selection (and quiz if configured for that role)
                    openQuizModal();
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
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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

          {/* Applications visible to all team members */}
          {isMember && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Join Applications</h2>
                <button
                  onClick={fetchApplications}
                  className="text-sm px-3 py-1 bg-primary-100 text-primary-800 rounded-md hover:bg-primary-200"
                >
                  Refresh
                </button>
              </div>
              {applicationsLoading ? (
                <p className="text-sm text-gray-500">Loading applications...</p>
              ) : applications.length === 0 ? (
                <p className="text-sm text-gray-500">No applications yet.</p>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app._id} className="border-b pb-3 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="font-semibold text-sm">
                            {typeof app.user === 'object' ? app.user.name : 'Applicant'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {typeof app.user === 'object' ? app.user.email : ''}
                          </p>
                        </div>
                        <div className="text-right text-xs space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">
                            {app.role || 'other'}
                          </span>
                          {typeof app.score === 'number' && team.quizQuestions && team.quizQuestions.length > 0 && (
                            <div className="text-gray-600">
                              Score: {app.score}/{team.quizQuestions.length}
                            </div>
                          )}
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full ${app.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : app.status === 'accepted'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              } text-[11px] capitalize`}
                          >
                            {app.status}
                          </span>
                        </div>
                      </div>
                      {team.quizQuestions && team.quizQuestions.length > 0 && (
                        <div className="mt-2 space-y-1 text-xs text-gray-700">
                          {team.quizQuestions.map((q) => {
                            const answer = (app.answers || []).find(
                              (a) => a.questionId === q._id || a.questionId === (q._id && q._id.toString())
                            );
                            return (
                              <div key={q._id}>
                                <p className="font-medium">Q: {q.question}</p>
                                {answer ? (
                                  <p>
                                    Answer: {q.options && typeof answer.selectedIndex === 'number'
                                      ? q.options[answer.selectedIndex]
                                      : 'N/A'}
                                  </p>
                                ) : (
                                  <p>Answer: N/A</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {isLeader && app.status === 'pending' && (
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDecideApplication(app._id, 'accept')}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDecideApplication(app._id, 'reject')}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Role selection + role-based quiz modal for joining this team */}
      {quizModalOpen && team && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-2">Join {team.name}</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select your role and complete the quiz (if configured) for that role.
            </p>

            {/* Role selection */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-700 mb-2">Choose your role:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'frontend', label: 'Frontend Developer' },
                  { key: 'backend', label: 'Backend Developer' },
                  { key: 'fullstack', label: 'Fullstack Developer' },
                  { key: 'designer', label: 'UI/UX Designer' },
                  { key: 'devops', label: 'DevOps' },
                  { key: 'other', label: 'Other' },
                ].map((r) => (
                  <label key={r.key} className="flex items-center gap-2 border rounded-md px-2 py-1 cursor-pointer">
                    <input
                      type="radio"
                      name="join-role-details"
                      value={r.key}
                      checked={selectedRole === r.key}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setSelectedRole(newRole);
                        const qs = buildRoleQuestions(team, newRole);
                        setRoleSpecificQuestions(qs);
                        setQuizResponses({});
                      }}
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Role-specific quiz (if any) */}
            <div className="space-y-4 mb-4">
              {roleSpecificQuestions.length > 0 ? (
                roleSpecificQuestions.map((q, idx) => (
                  <div key={q._id || idx} className="border rounded-md p-3">
                    <p className="font-medium text-sm mb-2">
                      Q{idx + 1}. {q.question}
                    </p>
                    <div className="space-y-1 text-sm">
                      {(q.options || []).map((opt, optIndex) => (
                        <label key={optIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`quiz-${q._id || idx}`}
                            checked={quizResponses[q._id] === optIndex}
                            onChange={() =>
                              setQuizResponses({
                                ...quizResponses,
                                [q._id]: optIndex,
                              })
                            }
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">
                  No quiz configured for the selected role. You may be able to join directly depending on team capacity.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setQuizModalOpen(false);
                  setSelectedRole('frontend');
                  setRoleSpecificQuestions([]);
                  setQuizResponses({});
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitQuizApplication}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetails;


