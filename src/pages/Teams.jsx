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
  const [allUsers, setAllUsers] = useState([]);
  const [allUsersLoading, setAllUsersLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    lookingFor: '',
  });
  // Quiz questions defined by team leader when creating team (MCQ)
  const [quizQuestions, setQuizQuestions] = useState([]);
  // Optional per-role seat capacities when creating a team
  const [roleCapacities, setRoleCapacities] = useState({
    frontend: '',
    backend: '',
    fullstack: '',
    designer: '',
    devops: '',
    other: '',
  });

  // State for role-based quiz application when joining a team
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedRole, setSelectedRole] = useState('frontend');
  const [roleSpecificQuestions, setRoleSpecificQuestions] = useState([]);
  const [quizResponses, setQuizResponses] = useState({}); // { [questionId]: selectedIndex }

  useEffect(() => {
    if (hackathonId) {
      fetchTeams(hackathonId);
    }
  }, [hackathonId]);

  // Fetch all users once so everyone can discover each other from Teams section
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setAllUsersLoading(true);
        const res = await api.get('/users');
        setAllUsers(res.data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setAllUsersLoading(false);
      }
    };

    fetchUsers();
  }, []);

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

      // Prepare quiz questions payload (MCQ)
      const formattedQuizQuestions = quizQuestions
        .map((q) => {
          const question = q.question?.trim();
          if (!question) return null;
          const options = (q.options || []).map((opt) => opt.trim()).filter(Boolean);
          if (options.length < 2) return null; // need at least 2 options
          let correctOptionIndex = typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0;
          if (correctOptionIndex < 0 || correctOptionIndex >= options.length) correctOptionIndex = 0;
          const skillTag = q.skillTag || 'other';
          return { question, options, correctOptionIndex, skillTag };
        })
        .filter(Boolean);

      const payload = {
        name: formData.name,
        hackathonId,
        description: formData.description,
        lookingFor,
      };

      if (formattedQuizQuestions.length > 0) {
        payload.quizQuestions = formattedQuizQuestions;
      }

      // Attach role capacities if any numeric value is provided
      const numericRoleCaps = {};
      Object.entries(roleCapacities).forEach(([key, value]) => {
        const num = Number(value);
        if (!Number.isNaN(num) && num > 0) {
          numericRoleCaps[key] = num;
        }
      });
      if (Object.keys(numericRoleCaps).length > 0) {
        payload.roleCapacities = numericRoleCaps;
      }

      await api.post('/teams', payload);

      setShowCreateForm(false);
      setFormData({ name: '', description: '', lookingFor: '' });
      setQuizQuestions([]);
      setRoleCapacities({
        frontend: '',
        backend: '',
        fullstack: '',
        designer: '',
        devops: '',
        other: '',
      });
      fetchTeams(hackathonId);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create team');
    }
  };

  const openQuizModalForTeam = (team) => {
    setSelectedTeam(team);
    // Default to frontend role for convenience
    setSelectedRole('frontend');
    setRoleSpecificQuestions([]);
    setQuizResponses({});
    setShowQuizModal(true);
  };

  const buildRoleQuestions = (team, roleKey) => {
    const normalized = (roleKey || 'other').toLowerCase();
    const allQuestions = team.quizQuestions || [];
    return allQuestions.filter((q) => {
      const tag = (q.skillTag || 'other').toLowerCase();
      return tag === normalized;
    });
  };

  const handleJoinTeam = async (teamId) => {
    const team = teams.find((t) => t._id === teamId);
    if (!team) return;

    // Always start with role selection modal (even if no quiz configured)
    openQuizModalForTeam(team);
  };

  const handleSubmitQuizApplication = async () => {
    if (!selectedTeam) return;

    const normalizedRole = (selectedRole || 'other').toLowerCase();
    const questionsForRole = buildRoleQuestions(selectedTeam, normalizedRole);

    // If there are no role-specific questions but team has no quiz at all, fallback to instant join
    if ((!selectedTeam.quizQuestions || selectedTeam.quizQuestions.length === 0) || questionsForRole.length === 0) {
      try {
        await api.post(`/teams/${selectedTeam._id}/join`, { role: normalizedRole });
        alert('Successfully joined team!');
        setShowQuizModal(false);
        setSelectedTeam(null);
        setQuizResponses({});
        fetchTeams(hackathonId);
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

      await api.post(`/teams/${selectedTeam._id}/apply`, {
        role: normalizedRole,
        answers,
      });

      alert('Application submitted. Team members will review your quiz.');
      setShowQuizModal(false);
      setSelectedTeam(null);
      setQuizResponses({});
      fetchTeams(hackathonId);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit application');
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
            {/* Quiz configuration (MCQ) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Quiz (MCQ) – optional & role-based
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Only team leader can define this quiz. New members will see only the quiz for the role they select (e.g. frontend, backend).
              </p>
              <div className="space-y-4">
                {quizQuestions.map((q, qIndex) => (
                  <div key={qIndex} className="border rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Question {qIndex + 1}</span>
                      <button
                        type="button"
                        onClick={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== qIndex))}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    {/* Target role for this question */}
                    <div className="mb-2 flex items-center gap-2 text-xs">
                      <span className="font-medium text-gray-600">Target role:</span>
                      <select
                        className="border border-gray-300 rounded-md px-2 py-1 text-xs"
                        value={q.skillTag || 'other'}
                        onChange={(e) => {
                          const updated = [...quizQuestions];
                          updated[qIndex] = { ...updated[qIndex], skillTag: e.target.value };
                          setQuizQuestions(updated);
                        }}
                      >
                        <option value="frontend">Frontend Developer</option>
                        <option value="backend">Backend Developer</option>
                        <option value="fullstack">Fullstack Developer</option>
                        <option value="designer">UI/UX Designer</option>
                        <option value="devops">DevOps</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
                      placeholder="Enter question text"
                      value={q.question}
                      onChange={(e) => {
                        const updated = [...quizQuestions];
                        updated[qIndex] = { ...updated[qIndex], question: e.target.value };
                        setQuizQuestions(updated);
                      }}
                    />
                    <div className="space-y-2">
                      {(q.options || []).map((opt, optIndex) => (
                        <label key={optIndex} className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={q.correctOptionIndex === optIndex}
                            onChange={() => {
                              const updated = [...quizQuestions];
                              updated[qIndex] = { ...updated[qIndex], correctOptionIndex: optIndex };
                              setQuizQuestions(updated);
                            }}
                          />
                          <input
                            type="text"
                            className="flex-1 px-3 py-1 border border-gray-300 rounded-md"
                            placeholder={`Option ${optIndex + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const updated = [...quizQuestions];
                              const opts = [...(updated[qIndex].options || [])];
                              opts[optIndex] = e.target.value;
                              updated[qIndex] = { ...updated[qIndex], options: opts };
                              setQuizQuestions(updated);
                            }}
                          />
                        </label>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...quizQuestions];
                          const opts = [...(updated[qIndex].options || [])];
                          if (opts.length >= 6) return;
                          opts.push('');
                          updated[qIndex] = { ...updated[qIndex], options: opts };
                          setQuizQuestions(updated);
                        }}
                        className="mt-1 text-xs text-primary-700 hover:underline"
                      >
                        + Add option
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    if (quizQuestions.length >= 5) return;
                    setQuizQuestions([
                      ...quizQuestions,
                      { question: '', options: ['', ''], correctOptionIndex: 0, skillTag: 'other' },
                    ]);
                  }}
                  className="text-sm text-primary-700 hover:underline"
                >
                  + Add quiz question
                </button>
              </div>
            </div>
            {/* Optional per-role seats */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role seats (optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Set maximum members per role. Leave blank for roles you dont want to limit. Overall team size is still controlled separately.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'frontend', label: 'Frontend Dev' },
                  { key: 'backend', label: 'Backend Dev' },
                  { key: 'fullstack', label: 'Fullstack Dev' },
                  { key: 'designer', label: 'UI/UX Designer' },
                  { key: 'devops', label: 'DevOps' },
                  { key: 'other', label: 'Other' },
                ].map((role) => (
                  <div key={role.key} className="flex flex-col text-xs">
                    <span className="mb-1 text-gray-700">{role.label}</span>
                    <input
                      type="number"
                      min="0"
                      className="px-2 py-1 border border-gray-300 rounded-md text-xs"
                      value={roleCapacities[role.key]}
                      onChange={(e) =>
                        setRoleCapacities({
                          ...roleCapacities,
                          [role.key]: e.target.value,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
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
                  {team.quizQuestions && team.quizQuestions.length > 0 && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full text-xs">
                      Quiz required
                    </span>
                  )}
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

      {/* People directory: everyone can see everyone */}
      <div className="mt-10 bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">People on HackConnect</h2>
          <p className="text-xs text-gray-500 max-w-md text-right">
            Browse all users (participants and non-participants). You can open their profile to
            learn more and connect via social links or invite them to teams.
          </p>
        </div>
        {allUsersLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : allUsers.length === 0 ? (
          <p className="text-sm text-gray-500">No users found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allUsers.map((u) => (
              <div key={u._id} className="border border-gray-200 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5">{u.name}</h3>
                  <p className="text-xs text-gray-500 mb-1">{u.email}</p>
                  {u.role && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 capitalize mb-2">
                      {u.role}
                    </span>
                  )}
                  {u.profile?.skills && u.profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {u.profile.skills.slice(0, 4).map((s, idx) => (
                        <span
                          key={idx}
                          className="bg-primary-50 text-primary-800 px-2 py-0.5 rounded-full text-[11px]"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {u.profile?.interests && u.profile.interests.length > 0 && (
                    <p className="text-[11px] text-gray-500 truncate">
                      Interests: {u.profile.interests.slice(0, 3).join(', ')}
                      {u.profile.interests.length > 3 && ' ...'}
                    </p>
                  )}
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <Link
                    to={`/users/${u._id}`}
                    className="text-xs px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    View profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Role selection + role-based quiz modal for joining teams */}
      {showQuizModal && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-2">Join {selectedTeam.name}</h2>
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
                      name="join-role"
                      value={r.key}
                      checked={selectedRole === r.key}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setSelectedRole(newRole);
                        const qs = buildRoleQuestions(selectedTeam, newRole);
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
                  setShowQuizModal(false);
                  setSelectedTeam(null);
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

export default Teams;


