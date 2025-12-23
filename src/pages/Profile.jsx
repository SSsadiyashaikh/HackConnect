import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { FiStar, FiEdit2, FiSave, FiX } from 'react-icons/fi';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    skills: [],
    interests: [],
    experience: '',
    availability: {
      startDate: '',
      endDate: '',
      hoursPerWeek: '',
    },
    github: '',
    linkedin: '',
    portfolio: '',
  });
  const [newSkill, setNewSkill] = useState({ name: '', level: 'intermediate' });
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me/profile');
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        bio: response.data.profile?.bio || '',
        skills: response.data.profile?.skills || [],
        interests: response.data.profile?.interests || [],
        experience: response.data.profile?.experience || '',
        availability: response.data.profile?.availability || {
          startDate: '',
          endDate: '',
          hoursPerWeek: '',
        },
        github: response.data.profile?.github || '',
        linkedin: response.data.profile?.linkedin || '',
        portfolio: response.data.profile?.portfolio || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await api.put('/users/me/profile', {
        name: formData.name,
        profile: {
          bio: formData.bio,
          skills: formData.skills,
          interests: formData.interests,
          experience: formData.experience,
          availability: formData.availability,
          github: formData.github,
          linkedin: formData.linkedin,
          portfolio: formData.portfolio,
        },
      });
      setProfile(response.data);
      updateUser({ ...user, name: response.data.name });
      setEditing(false);
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  const addSkill = () => {
    if (newSkill.name.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, { ...newSkill, name: newSkill.name.trim() }],
      });
      setNewSkill({ name: '', level: 'intermediate' });
    }
  };

  const removeSkill = (index) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index),
    });
  };

  const addInterest = () => {
    if (newInterest.trim()) {
      setFormData({
        ...formData,
        interests: [...formData.interests, newInterest.trim()],
      });
      setNewInterest('');
    }
  };

  const removeInterest = (index) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {profile?.name || user?.name}
            </h1>
            <p className="text-gray-600">{profile?.email || user?.email}</p>
            {profile?.averageRating > 0 && (
              <div className="flex items-center mt-2">
                <FiStar className="text-yellow-400 mr-1" />
                <span className="font-semibold">{profile.averageRating.toFixed(1)}</span>
                <span className="text-gray-600 ml-1">
                  ({profile.ratings?.length || 0} ratings)
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            {editing ? (
              <>
                <FiSave className="mr-2" />
                Save
              </>
            ) : (
              <>
                <FiEdit2 className="mr-2" />
                Edit
              </>
            )}
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            {editing ? (
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="4"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-700">{profile?.profile?.bio || 'No bio yet'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
            {editing ? (
              <div>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Skill name"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  />
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md"
                    value={newSkill.level}
                    onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <button
                    onClick={addSkill}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                    >
                      {skill.name} ({skill.level})
                      <button
                        onClick={() => removeSkill(index)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        <FiX />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile?.profile?.skills?.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill.name} ({skill.level})
                  </span>
                ))}
                {(!profile?.profile?.skills || profile.profile.skills.length === 0) && (
                  <span className="text-gray-500">No skills added</span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
            {editing ? (
              <div>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Interest"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                  />
                  <button
                    onClick={addInterest}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="flex items-center bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                    >
                      {interest}
                      <button
                        onClick={() => removeInterest(index)}
                        className="ml-2 text-gray-600 hover:text-gray-800"
                      >
                        <FiX />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile?.profile?.interests?.map((interest, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
                {(!profile?.profile?.interests || profile.profile.interests.length === 0) && (
                  <span className="text-gray-500">No interests added</span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
              {editing ? (
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                >
                  <option value="">Select experience</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              ) : (
                <p className="text-gray-700">{profile?.profile?.experience || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hours per Week</label>
              {editing ? (
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.availability.hoursPerWeek}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      availability: { ...formData.availability, hoursPerWeek: e.target.value },
                    })
                  }
                />
              ) : (
                <p className="text-gray-700">
                  {profile?.profile?.availability?.hoursPerWeek || 'Not specified'} hours/week
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
              {editing ? (
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.github}
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                />
              ) : (
                <p className="text-gray-700">
                  {profile?.profile?.github ? (
                    <a href={profile.profile.github} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      {profile.profile.github}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
              {editing ? (
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                />
              ) : (
                <p className="text-gray-700">
                  {profile?.profile?.linkedin ? (
                    <a href={profile.profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      {profile.profile.linkedin}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio</label>
              {editing ? (
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.portfolio}
                  onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                />
              ) : (
                <p className="text-gray-700">
                  {profile?.profile?.portfolio ? (
                    <a href={profile.profile.portfolio} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      {profile.profile.portfolio}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;


