import { FiCalendar, FiClock, FiMapPin, FiUsers } from 'react-icons/fi';
import { format } from 'date-fns';

const statusStyles = {
  upcoming: 'bg-blue-50 text-blue-700',
  ongoing: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-slate-100 text-slate-700',
};

const HackathonCard = ({
  hackathon,
  variant = 'student',
  isRegistered = false,
  onViewDetails,
  onRegister,
  onViewParticipants,
  onEdit,
}) => {
  const statusKey = (hackathon.status || '').toLowerCase();
  const statusClass = statusStyles[statusKey] || statusStyles.closed;

  const start = hackathon.startDate ? new Date(hackathon.startDate) : null;
  const end = hackathon.endDate ? new Date(hackathon.endDate) : null;
  const deadline = hackathon.registrationDeadline ? new Date(hackathon.registrationDeadline) : null;

  const teamInfo = hackathon.minTeamSize || hackathon.maxTeamSize
    ? `${hackathon.minTeamSize || 1}-${hackathon.maxTeamSize || '?'} members`
    : 'Flexible team size';

  const skillTags = Array.isArray(hackathon.skillRequirements)
    ? hackathon.skillRequirements.slice(0, 3)
    : [];

  return (
    <div className="group flex h-full flex-col rounded-2xl border border-slate-100 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-100 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-slate-900" title={hackathon.title}>
            {hackathon.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
            {hackathon.description}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClass}`}>
          {hackathon.status || 'Closed'}
        </span>
      </div>

      <div className="space-y-2 text-xs text-slate-600 mb-4">
        <div className="flex items-center gap-2">
          <FiMapPin className="h-4 w-4 text-slate-400" />
          <span>{hackathon.isOnline ? 'Online' : hackathon.location || 'Location TBA'}</span>
        </div>
        <div className="flex items-center gap-2">
          <FiCalendar className="h-4 w-4 text-slate-400" />
          <span>
            {start && end
              ? `${format(start, 'MMM dd, yyyy')} - ${format(end, 'MMM dd, yyyy')}`
              : 'Dates TBA'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FiClock className="h-4 w-4 text-slate-400" />
          <span>
            Deadline:{' '}
            {deadline ? format(deadline, 'MMM dd, yyyy') : 'TBA'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FiUsers className="h-4 w-4 text-slate-400" />
          <span>
            {hackathon.participants?.length || 0} participants · {teamInfo}
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1">
        {hackathon.domain && (
          <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-medium text-primary-700">
            {hackathon.domain}
          </span>
        )}
        {skillTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onViewDetails}
          className="flex-1 rounded-lg bg-primary-600 px-3 py-2 text-center text-xs font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
        >
          View Details
        </button>

        {variant === 'student' && (
          <button
            type="button"
            disabled={isRegistered}
            onClick={isRegistered ? undefined : onRegister}
            className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-semibold border transition focus:outline-none focus:ring-2 focus:ring-offset-1 ${
              isRegistered
                ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                : 'border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-500'
            }`}
          >
            {isRegistered ? 'Registered' : 'Register'}
          </button>
        )}

        {variant === 'organizer' && (
          <>
            <button
              type="button"
              onClick={onViewParticipants}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            >
              View Participants
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            >
              Edit Event
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default HackathonCard;
