"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [address, setAddress] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (address.trim()) {
      router.push(`/results?address=${encodeURIComponent(address.trim())}`);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          What&apos;s on{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            your ballot?
          </span>
        </h2>
        <p className="text-lg text-slate-300 max-w-xl mx-auto">
          Enter your home address to find upcoming elections, see candidates and
          measures on your ballot, and find your polling place.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
        <div className="relative">
          <label htmlFor="address" className="sr-only">
            Your home address
          </label>
          <input
            id="address"
            type="text"
            placeholder="Enter your full home address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 backdrop-blur-sm text-lg"
          />
        </div>
        <button
          type="submit"
          disabled={!address.trim()}
          className="mt-4 w-full rounded-xl bg-blue-600 px-5 py-4 text-lg font-semibold text-white transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Find My Elections
        </button>
      </form>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        <InfoCard
          title="Upcoming Elections"
          description="See the next federal, state, and local elections you can vote in."
        />
        <InfoCard
          title="Your Ballot"
          description="Preview candidates, ballot measures, and referendums for your district."
        />
        <InfoCard
          title="Polling Places"
          description="Find where to vote, including early voting and drop-off locations."
        />
      </div>
    </div>
  );
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}
