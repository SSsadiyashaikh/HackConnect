import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { FiStar } from 'react-icons/fi';

const UserProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get(`/users/${id}`);
        setProfile(response.data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Unable to load this profile. It may have been removed.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Profile not available</h1>
          <p className="text-sm text-slate-500">{error || 'This profile could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-1">
              {profile.name}
            </h1>
            <p className="text-sm text-slate-500 mb-1">{profile.email}</p>
            {profile.role && (
              <p className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 capitalize mt-2">
                {profile.role}
              </p>
            )}
            {profile.averageRating > 0 && (
              <div className="flex items-center mt-3 text-sm">
                <FiStar className="text-yellow-400 mr-1" />
                <span className="font-semibold">{profile.averageRating.toFixed(1)}</span>
                <span className="text-slate-500 ml-1">
                  ({profile.ratings?.length || 0} ratings)
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 text-sm">
          {/* Bio */}
          <section>
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Bio</h2>
            <p className="text-slate-700">
              {profile.profile?.bio || 'No bio provided yet.'}
            </p>
          </section>

          {/* Skills */}
          <section>
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Skills</h2>
            {profile.profile?.skills && profile.profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.profile.skills.map((skill, index) => (
                  <span
                    key={`${skill.name}-${index}`}
                    className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-800"
                  >
                    {skill.name}
                    {skill.level && (
                      <span className="ml-1 text-[10px] uppercase tracking-wide text-primary-600">
                        {skill.level}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No skills added yet.</p>
            )}
          </section>

          {/* Interests */}
          <section>
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Interests</h2>
            {profile.profile?.interests && profile.profile.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.profile.interests.map((interest, index) => (
                  <span
                    key={`${interest}-${index}`}
                    className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No interests added yet.</p>
            )}
          </section>

          {/* Experience & availability */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-2">Experience Level</h2>
              <p className="text-slate-700">
                {profile.profile?.experience || 'Not specified'}
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-2">Availability</h2>
              <p className="text-slate-700">
                {profile.profile?.availability?.hoursPerWeek
                  ? `${profile.profile.availability.hoursPerWeek} hours / week`
                  : 'Not specified'}
              </p>
            </div>
          </section>

          {/* Links */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-1">GitHub</h2>
              {profile.profile?.github ? (
                <a
                  href={profile.profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline break-all"
                >
                  {profile.profile.github}
                </a>
              ) : (
                <p className="text-slate-500 text-sm">Not provided</p>
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-1">LinkedIn</h2>
              {profile.profile?.linkedin ? (
                <a
                  href={profile.profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline break-all"
                >
                  {profile.profile.linkedin}
                </a>
              ) : (
                <p className="text-slate-500 text-sm">Not provided</p>
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-1">Portfolio</h2>
              {profile.profile?.portfolio ? (
                <a
                  href={profile.profile.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline break-all"
                >
                  {profile.profile.portfolio}
                </a>
              ) : (
                <p className="text-slate-500 text-sm">Not provided</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
