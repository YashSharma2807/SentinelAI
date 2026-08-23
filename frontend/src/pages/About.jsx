import Navbar from "../components/Navbar";

export default function About() {
  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <div className="mx-auto max-w-5xl px-8 py-12">
        <h1 className="text-5xl font-bold">
          About SentinelAI
        </h1>

        <p className="mt-6 text-lg leading-8 text-gray-300">
          SentinelAI is an AI-powered Security Log Analyzer built using
          React, FastAPI, SQLite and Groq AI.
        </p>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-8">
          <h2 className="text-2xl font-semibold">Features</h2>

          <ul className="mt-6 space-y-3 text-gray-300">
            <li>✅ Linux Log Analysis</li>
            <li>✅ Windows Log Analysis</li>
            <li>✅ Web Server Log Analysis</li>
            <li>✅ AI Incident Reports</li>
            <li>✅ Enterprise PDF Reports</li>
            <li>✅ SQLite Upload History</li>
          </ul>
        </div>
      </div>
    </div>
  );
}