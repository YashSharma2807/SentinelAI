import { useState } from "react";

import Navbar from "../components/Navbar";
import UploadArea from "../components/UploadArea";
import StatsCards from "../components/StatsCards";
import DetectionCard from "../components/DetectionCard";
import AIReport from "../components/AIReport";
import DownloadReport from "../components/DownloadReport";

export default function Dashboard() {
  const [analysis, setAnalysis] = useState(null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09090B] text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-250px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-purple-700/20 blur-[180px]" />

        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-fuchsia-600/10 blur-[180px]" />

        <div className="absolute left-0 top-1/2 h-[450px] w-[450px] rounded-full bg-indigo-500/10 blur-[160px]" />
      </div>

      <Navbar />

      {/* Hero */}
      <section className="mx-auto flex max-w-7xl flex-col items-center px-8 pt-12 text-center">
        <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-5 py-2 text-sm font-medium text-purple-300">
          AI-Powered Security Log Analyzer
        </span>

        <h1 className="mt-8 text-6xl font-black leading-tight lg:text-7xl">
          Detect.
          <span className="text-purple-500"> Analyze.</span>
          <br />
          Explain.
          <span className="text-purple-500"> Respond.</span>
        </h1>

        <p className="mt-8 max-w-3xl text-lg leading-8 text-gray-400">
          Analyze Linux, Windows and Web Server logs using AI-assisted
          threat detection. SentinelAI identifies attacks, explains
          incidents, maps them to MITRE ATT&CK techniques and provides
          actionable remediation recommendations.
        </p>
      </section>

      {/* Upload */}
      <UploadArea setAnalysis={setAnalysis} />

      {/* Stats */}
      <StatsCards analysis={analysis} />

      {/* Report Section */}
      <section className="mx-auto mt-14 grid max-w-7xl grid-cols-2 gap-8 px-8 pb-10">

        <DetectionCard analysis={analysis} />

        <div className="space-y-5">

          <AIReport analysis={analysis} />

          <div className="flex justify-end">
            <DownloadReport data={analysis} />
          </div>

        </div>

      </section>
    </div>
  );
}