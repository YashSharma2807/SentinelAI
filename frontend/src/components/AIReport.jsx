import { Sparkles } from "lucide-react";

export default function AIReport({ analysis }) {

  if (!analysis) {
    return (
      <div className="rounded-3xl border border-purple-500/20 bg-white/[0.04] p-8 backdrop-blur-xl">

        <div className="flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-purple-400" />

          <h2 className="text-2xl font-bold tracking-wide">
            AI Security Report
          </h2>
        </div>

        <div className="mt-6 space-y-4 text-gray-400">

          <p>Upload a security log to generate an AI incident report.</p>

          <ul className="list-disc pl-5 space-y-2">
            <li>Executive Summary</li>
            <li>MITRE ATT&CK Mapping</li>
            <li>Technical Analysis</li>
            <li>Recommendations</li>
            <li>Confidence Score</li>
          </ul>

        </div>

      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-purple-500/20 bg-white/[0.04] p-8 backdrop-blur-xl">

      <div className="flex items-center gap-3">
        <Sparkles className="h-7 w-7 text-purple-400" />

        <h2 className="text-2xl font-bold tracking-wide">
          AI Security Report
        </h2>
      </div>

      <div className="mt-6">

        <pre className="whitespace-pre-wrap text-sm leading-7 text-gray-300">
          {analysis.ai_report}
        </pre>

      </div>

    </div>
  );
}