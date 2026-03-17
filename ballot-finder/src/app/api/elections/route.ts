import { NextRequest, NextResponse } from "next/server";

const CIVIC_API_BASE = "https://www.googleapis.com/civicinfo/v2";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "Address is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch voter info (elections + ballot)
    const voterInfoUrl = `${CIVIC_API_BASE}/voterinfo?key=${encodeURIComponent(apiKey)}&address=${encodeURIComponent(address)}&returnAllAvailableData=true`;
    const electionsUrl = `${CIVIC_API_BASE}/elections?key=${encodeURIComponent(apiKey)}`;

    const [voterInfoRes, electionsRes] = await Promise.allSettled([
      fetch(voterInfoUrl),
      fetch(electionsUrl),
    ]);

    let voterInfo = null;
    let elections = null;

    if (voterInfoRes.status === "fulfilled" && voterInfoRes.value.ok) {
      voterInfo = await voterInfoRes.value.json();
    }

    if (electionsRes.status === "fulfilled" && electionsRes.value.ok) {
      const electionsData = await electionsRes.value.json();
      elections = electionsData.elections?.filter(
        (e: { id: string }) => e.id !== "2000"
      ); // filter out test election
    }

    // If voterInfo failed, try to return just elections list
    if (!voterInfo && !elections) {
      return NextResponse.json(
        {
          error:
            "No election data found for this address. This may mean there are no upcoming elections, or the address could not be matched.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      voterInfo,
      elections,
      address,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch election data. Please try again." },
      { status: 500 }
    );
  }
}
