import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUsers, FiCalendar, FiAward, FiZap } from 'react-icons/fi';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">HackConnect</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link
                    to={user.role === 'organizer' ? '/organizer/dashboard' : '/dashboard'}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Connect. Collaborate. Create.
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            The ultimate platform for hackathon organizers and participants
          </p>
          {!user && (
            <div className="flex justify-center space-x-4">
              <Link
                to="/register"
                className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-lg font-medium"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 bg-white text-primary-600 rounded-lg hover:bg-gray-50 text-lg font-medium border-2 border-primary-600"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <FiCalendar className="mx-auto text-4xl text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Discover Hackathons</h3>
            <p className="text-gray-600">
              Browse and filter hackathons by domain, location, and skills
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <FiUsers className="mx-auto text-4xl text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Form Teams</h3>
            <p className="text-gray-600">
              Find teammates with complementary skills and build amazing projects
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <FiZap className="mx-auto text-4xl text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Real-time Chat</h3>
            <p className="text-gray-600">
              Communicate with your team members in real-time
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <FiAward className="mx-auto text-4xl text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
            <p className="text-gray-600">
              Stay updated with notifications and deadlines
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to start your hackathon journey?
          </h2>
          <p className="text-gray-600 mb-8">
            Join thousands of developers and organizers on HackConnect
          </p>
          {!user && (
            <Link
              to="/register"
              className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-lg font-medium"
            >
              Create Your Account
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;


