"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface Contest {
  type: string;
  office?: string;
  district?: { name: string; scope: string };
  candidates?: {
    name: string;
    party: string;
    candidateUrl?: string;
    channels?: { type: string; id: string }[];
  }[];
  referendumTitle?: string;
  referendumSubtitle?: string;
  referendumText?: string;
  referendumBallotResponses?: string[];
}

interface PollingLocation {
  address: {
    locationName?: string;
    line1: string;
    city: string;
    state: string;
    zip: string;
  };
  pollingHours?: string;
  startDate?: string;
  endDate?: string;
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
            <h3 className="text-xl font-semibold text-blue-300">
              {voterInfo.election.name}
            </h3>
            <p className="text-lg text-slate-300 mt-1">
              {formatDate(voterInfo.election.electionDay)}
            </p>
          </div>
        </section>
      )}

      {/* Contests / ballot items */}
      {voterInfo?.contests && voterInfo.contests.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">
            What&apos;s on Your Ballot
          </h2>
          <div className="space-y-4">
            {voterInfo.contests.map((contest, i) => (
              <ContestCard key={i} contest={contest} />
            ))}
          </div>
        </section>
      )}

      {/* Polling locations */}
      {(voterInfo?.pollingLocations ||
        voterInfo?.earlyVoteSites ||
        voterInfo?.dropOffLocations) && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Where to Vote</h2>
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
          <h2 className="text-2xl font-bold mb-4">Voter Resources</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {admin.electionRegistrationUrl && (
              <ResourceLink
                href={admin.electionRegistrationUrl}
                label="Register to Vote"
              />
            )}
            {admin.electionInfoUrl && (
              <ResourceLink
                href={admin.electionInfoUrl}
                label="Election Information"
              />
            )}
            {admin.votingLocationFinderUrl && (
              <ResourceLink
                href={admin.votingLocationFinderUrl}
                label="Find Voting Locations"
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

function ContestCard({ contest }: { contest: Contest }) {
  const isReferendum = !!contest.referendumTitle;

  if (isReferendum) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <span className="inline-block rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium px-2.5 py-0.5 mb-2">
          Ballot Measure
        </span>
        <h3 className="text-lg font-semibold">{contest.referendumTitle}</h3>
        {contest.referendumSubtitle && (
          <p className="text-sm text-slate-400 mt-1">
            {contest.referendumSubtitle}
          </p>
        )}
        {contest.referendumText && (
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">
            {contest.referendumText.length > 300
              ? contest.referendumText.slice(0, 300) + "..."
              : contest.referendumText}
          </p>
        )}
        {contest.referendumBallotResponses && (
          <div className="mt-3 flex gap-2">
            {contest.referendumBallotResponses.map((r, i) => (
              <span
                key={i}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm"
              >
                {r}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium px-2.5 py-0.5 mb-2">
            {contest.district?.scope === "federal"
              ? "Federal"
              : contest.district?.scope === "statewide"
                ? "State"
                : "Local"}
          </span>
          <h3 className="text-lg font-semibold">{contest.office}</h3>
          {contest.district?.name && (
            <p className="text-sm text-slate-400">{contest.district.name}</p>
          )}
        </div>
      </div>
      {contest.candidates && contest.candidates.length > 0 && (
        <div className="mt-4 space-y-2">
          {contest.candidates.map((candidate, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2.5"
            >
              <span className="font-medium">{candidate.name}</span>
              {candidate.party && (
                <span className="text-sm text-slate-400">
                  {candidate.party}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <span className="inline-block rounded-full bg-green-500/20 text-green-400 text-xs font-medium px-2.5 py-0.5 mb-2">
        {type}
      </span>
      {addr.locationName && (
        <h3 className="font-semibold">{addr.locationName}</h3>
      )}
      <p className="text-sm text-slate-300">{fullAddress}</p>
      {location.pollingHours && (
        <p className="text-sm text-slate-400 mt-1">
          Hours: {location.pollingHours}
        </p>
      )}
      {location.startDate && location.endDate && (
        <p className="text-sm text-slate-400 mt-1">
          {formatDate(location.startDate)} - {formatDate(location.endDate)}
        </p>
      )}
    </div>
  );
}

function ResourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors group"
    >
      <span className="font-medium">{label}</span>
      <span className="text-slate-400 group-hover:text-white transition-colors">
        &rarr;
      </span>
    </a>
  );
}

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
