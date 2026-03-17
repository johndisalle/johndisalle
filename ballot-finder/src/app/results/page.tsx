"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface Candidate {
  name: string;
  party: string;
  candidateUrl?: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
  channels?: { type: string; id: string }[];
}

interface Contest {
  type: string;
  office?: string;
  district?: { name: string; scope: string };
  candidates?: Candidate[];
  referendumTitle?: string;
  referendumSubtitle?: string;
  referendumText?: string;
  referendumBallotResponses?: string[];
  numberElected?: string;
  numberVotingFor?: string;
}

interface PollingLocation {
  address: {
    locationName?: string;
    line1: string;
    city: string;
    state: string;
    zip: string;
  };
  notes?: string;
  pollingHours?: string;
  startDate?: string;
  endDate?: string;
  latitude?: number;
  longitude?: number;
}

interface Election {
  id: string;
  name: string;
  electionDay: string;
  ocdDivisionId?: string;
}

interface VoterInfo {
  election?: Election;
  contests?: Contest[];
  pollingLocations?: PollingLocation[];
  earlyVoteSites?: PollingLocation[];
  dropOffLocations?: PollingLocation[];
  state?: {
    electionAdministrationBody?: {
      electionInfoUrl?: string;
      electionRegistrationUrl?: string;
      votingLocationFinderUrl?: string;
    };
  }[];
}

interface ApiResponse {
  voterInfo: VoterInfo | null;
  elections: Election[] | null;
  address: string;
  error?: string;
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const address = searchParams.get("address");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setError("No address provided.");
      setLoading(false);
      return;
    }

    fetch(`/api/elections?address=${encodeURIComponent(address)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to fetch election data");
        }
        setData(json);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [address]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="mt-4 text-slate-300">
          Looking up election data for your address...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">
            No Results Found
          </h2>
          <p className="text-slate-300 mb-4">{error}</p>
          <a
            href="/"
            className="inline-block rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-500"
          >
            Try Another Address
          </a>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { voterInfo, elections } = data;
  const admin =
    voterInfo?.state?.[0]?.electionAdministrationBody;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Address banner */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Showing results for</p>
          <p className="text-lg font-medium">{address}</p>
        </div>
        <a
          href="/"
          className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10 transition-colors"
        >
          Change Address
        </a>
      </div>

      {/* Current/next election */}
      {voterInfo?.election && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Your Next Election</h2>
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-6">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <h3 className="text-xl font-semibold text-blue-300">
                {voterInfo.election.name}
              </h3>
            </div>
            <p className="text-lg text-slate-300">
              {formatDate(voterInfo.election.electionDay)}
            </p>
            {getDaysUntil(voterInfo.election.electionDay) > 0 && (
              <p className="text-sm text-blue-400 mt-1">
                {getDaysUntil(voterInfo.election.electionDay)} days away
              </p>
            )}
          </div>
        </section>
      )}

      {/* Contests / ballot items */}
      {voterInfo?.contests && voterInfo.contests.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
            <h2 className="text-2xl font-bold">
              What&apos;s on Your Ballot
            </h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            {voterInfo.contests.filter(c => !c.referendumTitle).length} race{voterInfo.contests.filter(c => !c.referendumTitle).length !== 1 ? "s" : ""} and{" "}
            {voterInfo.contests.filter(c => c.referendumTitle).length} ballot measure{voterInfo.contests.filter(c => c.referendumTitle).length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-4">
            {voterInfo.contests.map((contest, i) => (
              <ContestCard key={i} contest={contest} />
            ))}
          </div>
        </section>
      )}

      {/* Polling locations with maps */}
      {(voterInfo?.pollingLocations ||
        voterInfo?.earlyVoteSites ||
        voterInfo?.dropOffLocations) && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <h2 className="text-2xl font-bold">Where to Vote</h2>
          </div>
          <div className="space-y-4">
            {voterInfo.pollingLocations?.map((loc, i) => (
              <LocationCard key={`poll-${i}`} location={loc} type="Polling Place" />
            ))}
            {voterInfo.earlyVoteSites?.map((loc, i) => (
              <LocationCard
                key={`early-${i}`}
                location={loc}
                type="Early Voting"
              />
            ))}
            {voterInfo.dropOffLocations?.map((loc, i) => (
              <LocationCard
                key={`drop-${i}`}
                location={loc}
                type="Drop-off Location"
              />
            ))}
          </div>
        </section>
      )}

      {/* Helpful links */}
      {admin && (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-7 h-7 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            <h2 className="text-2xl font-bold">Voter Resources</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {admin.electionRegistrationUrl && (
              <ResourceLink
                href={admin.electionRegistrationUrl}
                label="Register to Vote"
                icon="register"
              />
            )}
            {admin.electionInfoUrl && (
              <ResourceLink
                href={admin.electionInfoUrl}
                label="Election Information"
                icon="info"
              />
            )}
            {admin.votingLocationFinderUrl && (
              <ResourceLink
                href={admin.votingLocationFinderUrl}
                label="Find Voting Locations"
                icon="location"
              />
            )}
          </div>
        </section>
      )}

      {/* Other upcoming elections */}
      {elections && elections.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">
            Other Upcoming Elections Nationwide
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {elections.map((election) => (
              <div
                key={election.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <p className="font-medium">{election.name}</p>
                <p className="text-sm text-slate-400">
                  {formatDate(election.electionDay)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}

/* ─── Candidate Detail Card ─── */

function CandidateCard({ candidate }: { candidate: Candidate }) {
  const [expanded, setExpanded] = useState(false);
  const initials = candidate.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const partyColor = getPartyColor(candidate.party);
  const socialLinks = candidate.channels?.filter((ch) =>
    ["Facebook", "Twitter", "YouTube"].includes(ch.type)
  );
  const hasSocials = socialLinks && socialLinks.length > 0;
  const hasDetails = candidate.candidateUrl || candidate.email || candidate.phone || hasSocials;

  return (
    <div className="rounded-lg bg-white/5 border border-white/10 overflow-hidden transition-all">
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`w-full flex items-center gap-4 px-4 py-3 text-left ${hasDetails ? "cursor-pointer hover:bg-white/5" : "cursor-default"} transition-colors`}
      >
        {/* Avatar */}
        {candidate.photoUrl ? (
          <img
            src={candidate.photoUrl}
            alt={candidate.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white/20 flex-shrink-0"
          />
        ) : (
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${partyColor.bg} ${partyColor.text}`}
          >
            {initials}
          </div>
        )}

        {/* Name & Party */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{candidate.name}</p>
          {candidate.party && (
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${partyColor.badge}`}>
              {candidate.party}
            </span>
          )}
        </div>

        {/* Expand indicator */}
        {hasDetails && (
          <svg
            className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        )}
      </button>

      {/* Expanded details */}
      {expanded && hasDetails && (
        <div className="border-t border-white/10 px-4 py-3 bg-white/[0.02] space-y-2">
          {candidate.candidateUrl && (
            <a
              href={candidate.candidateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              Campaign Website
            </a>
          )}

          {candidate.email && (
            <a
              href={`mailto:${candidate.email}`}
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              {candidate.email}
            </a>
          )}

          {candidate.phone && (
            <a
              href={`tel:${candidate.phone}`}
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
              {candidate.phone}
            </a>
          )}

          {/* Social media links */}
          {hasSocials && (
            <div className="flex items-center gap-3 pt-1">
              {socialLinks.map((ch, i) => (
                <a
                  key={i}
                  href={getSocialUrl(ch.type, ch.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                  title={ch.type}
                >
                  <SocialIcon type={ch.type} />
                  <span className="text-xs">{ch.type}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Contest Card (Race or Referendum) ─── */

function ContestCard({ contest }: { contest: Contest }) {
  const isReferendum = !!contest.referendumTitle;
  const [showFullText, setShowFullText] = useState(false);

  if (isReferendum) {
    const text = contest.referendumText || "";
    const isLong = text.length > 300;

    return (
      <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium px-2.5 py-0.5 mb-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          Ballot Measure
        </span>
        <h3 className="text-lg font-semibold">{contest.referendumTitle}</h3>
        {contest.referendumSubtitle && (
          <p className="text-sm text-slate-400 mt-1">
            {contest.referendumSubtitle}
          </p>
        )}
        {text && (
          <div className="mt-3">
            <p className="text-sm text-slate-300 leading-relaxed">
              {isLong && !showFullText ? text.slice(0, 300) + "..." : text}
            </p>
            {isLong && (
              <button
                onClick={() => setShowFullText(!showFullText)}
                className="text-sm text-blue-400 hover:text-blue-300 mt-1 transition-colors"
              >
                {showFullText ? "Show less" : "Read full text"}
              </button>
            )}
          </div>
        )}
        {contest.referendumBallotResponses && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {contest.referendumBallotResponses.map((r, i) => (
              <span
                key={i}
                className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-300"
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  const scopeLabel =
    contest.district?.scope === "federal"
      ? "Federal"
      : contest.district?.scope === "statewide"
        ? "State"
        : "Local";

  const scopeColor =
    contest.district?.scope === "federal"
      ? "bg-purple-500/20 text-purple-400 border-purple-500/20"
      : contest.district?.scope === "statewide"
        ? "bg-blue-500/20 text-blue-400 border-blue-500/20"
        : "bg-teal-500/20 text-teal-400 border-teal-500/20";

  const borderColor =
    contest.district?.scope === "federal"
      ? "border-purple-500/20"
      : contest.district?.scope === "statewide"
        ? "border-blue-500/20"
        : "border-white/10";

  return (
    <div className={`rounded-xl border ${borderColor} bg-gradient-to-br from-white/5 to-transparent p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className={`inline-flex items-center gap-1.5 rounded-full text-xs font-medium px-2.5 py-0.5 mb-2 ${scopeColor}`}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
            {scopeLabel}
          </span>
          <h3 className="text-lg font-semibold">{contest.office}</h3>
          {contest.district?.name && (
            <p className="text-sm text-slate-400">{contest.district.name}</p>
          )}
          {contest.numberVotingFor && Number(contest.numberVotingFor) > 1 && (
            <p className="text-xs text-slate-500 mt-1">
              Vote for up to {contest.numberVotingFor}
            </p>
          )}
        </div>
        {contest.candidates && (
          <span className="text-xs text-slate-500 bg-white/5 rounded-full px-2.5 py-1 flex-shrink-0">
            {contest.candidates.length} candidate{contest.candidates.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      {contest.candidates && contest.candidates.length > 0 && (
        <div className="mt-4 space-y-2">
          {contest.candidates.map((candidate, i) => (
            <CandidateCard key={i} candidate={candidate} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Location Card with Map ─── */

function LocationCard({
  location,
  type,
}: {
  location: PollingLocation;
  type: string;
}) {
  const addr = location.address;
  const fullAddress = [addr.line1, addr.city, addr.state, addr.zip]
    .filter(Boolean)
    .join(", ");

  const encodedAddress = encodeURIComponent(fullAddress);
  const mapSearchUrl = `https://www.openstreetmap.org/search?query=${encodedAddress}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

  const typeConfig: Record<string, { badge: string; border: string; icon: React.ReactNode }> = {
    "Polling Place": {
      badge: "bg-green-500/20 text-green-400",
      border: "border-green-500/20",
      icon: (
        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
      ),
    },
    "Early Voting": {
      badge: "bg-cyan-500/20 text-cyan-400",
      border: "border-cyan-500/20",
      icon: (
        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    "Drop-off Location": {
      badge: "bg-indigo-500/20 text-indigo-400",
      border: "border-indigo-500/20",
      icon: (
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      ),
    },
  };

  const config = typeConfig[type] || typeConfig["Polling Place"];

  return (
    <div className={`rounded-xl border ${config.border} bg-gradient-to-br from-white/5 to-transparent overflow-hidden`}>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0">{config.icon}</div>
          <div className="flex-1 min-w-0">
            <span className={`inline-block rounded-full text-xs font-medium px-2.5 py-0.5 mb-2 ${config.badge}`}>
              {type}
            </span>
            {addr.locationName && (
              <h3 className="font-semibold text-white">{addr.locationName}</h3>
            )}
            <p className="text-sm text-slate-300">{fullAddress}</p>
            {location.pollingHours && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-400">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                {location.pollingHours}
              </div>
            )}
            {location.startDate && location.endDate && (
              <p className="text-sm text-slate-400 mt-1">
                {formatDate(location.startDate)} &ndash; {formatDate(location.endDate)}
              </p>
            )}
            {location.notes && (
              <p className="text-xs text-slate-500 mt-2 italic">{location.notes}</p>
            )}
          </div>
        </div>

        {/* Map action buttons */}
        <div className="flex gap-2 mt-4 ml-8">
          <a
            href={mapSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m0 0-3-3m3 3 3-3m6 3V6.75M15 15l3-3m-3 3-3-3M3.375 20.25h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v14.25c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
            View Map
          </a>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
            Get Directions
          </a>
        </div>
      </div>

      {/* Embedded map preview */}
      <div className="border-t border-white/10 bg-white/[0.02]">
        <a
          href={mapSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative group"
        >
          <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
            {/* Static map tile from OSM */}
            <img
              src={`https://staticmap.openstreetmap.de/staticmap.php?center=${encodedAddress}&zoom=15&size=600x200&maptype=osmarenderer`}
              alt={`Map showing ${fullAddress}`}
              className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = "flex";
              }}
            />
            {/* Fallback if map image fails */}
            <div className="absolute inset-0 items-center justify-center hidden" style={{ display: "none" }}>
              <div className="text-center">
                <svg className="w-10 h-10 text-slate-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                </svg>
                <p className="text-sm text-slate-500">Click to view on map</p>
              </div>
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
            <div className="absolute bottom-2 right-2 bg-black/50 rounded-md px-2 py-1 text-xs text-slate-300 backdrop-blur-sm">
              Click to open map
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}

/* ─── Resource Link ─── */

function ResourceLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    register: (
      <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
      </svg>
    ),
    location: (
      <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors group"
    >
      {icons[icon] || icons.info}
      <span className="font-medium flex-1">{label}</span>
      <span className="text-slate-400 group-hover:text-white transition-colors">
        &rarr;
      </span>
    </a>
  );
}

/* ─── Helper Functions ─── */

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getDaysUntil(dateStr: string): number {
  try {
    const target = new Date(dateStr + "T00:00:00");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return -1;
  }
}

function getPartyColor(party: string): { bg: string; text: string; badge: string } {
  const p = party?.toLowerCase() || "";
  if (p.includes("democrat")) {
    return { bg: "bg-blue-500/30", text: "text-blue-300", badge: "bg-blue-500/20 text-blue-400" };
  }
  if (p.includes("republican")) {
    return { bg: "bg-red-500/30", text: "text-red-300", badge: "bg-red-500/20 text-red-400" };
  }
  if (p.includes("libertarian")) {
    return { bg: "bg-yellow-500/30", text: "text-yellow-300", badge: "bg-yellow-500/20 text-yellow-400" };
  }
  if (p.includes("green")) {
    return { bg: "bg-green-500/30", text: "text-green-300", badge: "bg-green-500/20 text-green-400" };
  }
  if (p.includes("nonpartisan") || p.includes("independent")) {
    return { bg: "bg-slate-500/30", text: "text-slate-300", badge: "bg-slate-500/20 text-slate-400" };
  }
  return { bg: "bg-white/10", text: "text-white", badge: "bg-white/10 text-slate-300" };
}

function getSocialUrl(type: string, id: string): string {
  switch (type) {
    case "Facebook":
      return `https://www.facebook.com/${id}`;
    case "Twitter":
      return `https://twitter.com/${id}`;
    case "YouTube":
      return `https://www.youtube.com/${id}`;
    default:
      return "#";
  }
}

function SocialIcon({ type }: { type: string }) {
  switch (type) {
    case "Facebook":
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "Twitter":
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "YouTube":
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
          <path fill="#000" d="M9.545 15.568V8.432L15.818 12z" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
        </svg>
      );
  }
}
