import { ShieldAlert } from "lucide-react";

export default function DetectionCard({ analysis }) {

  if (!analysis) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">

        <div className="flex items-center gap-3">

          <ShieldAlert className="text-purple-400" />

          <h2 className="text-2xl font-bold">
            Detection Result
          </h2>

        </div>

        <p className="mt-6 text-gray-400">
          Upload a security log to view detected threats.
        </p>

      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">

      <div className="flex items-center gap-3">

        <ShieldAlert className="text-purple-400" />

        <h2 className="text-2xl font-bold">
          Detection Result
        </h2>

      </div>

      <div className="mt-8 space-y-5">

        {analysis.detections.length === 0 ? (

          <p className="text-green-400">
            No threats detected.
          </p>

        ) : (

          analysis.detections.map((item, index) => (

            <div
              key={index}
              className="rounded-2xl border border-purple-500/20 bg-[#13131A] p-5"
            >

              <h3 className="text-xl font-bold text-red-400">
                {item.attack}
              </h3>

              <p className="mt-3">
                <span className="font-semibold">
                  Severity:
                </span>{" "}
                {item.severity}
              </p>

              {item.source_ip && (

                <p className="mt-2">
                  <span className="font-semibold">
                    Source IP:
                  </span>{" "}
                  {item.source_ip}
                </p>

              )}

              {item.failed_attempts && (

                <p className="mt-2">
                  <span className="font-semibold">
                    Failed Attempts:
                  </span>{" "}
                  {item.failed_attempts}
                </p>

              )}

              {item.matched_pattern && (

                <p className="mt-2">
                  <span className="font-semibold">
                    Pattern:
                  </span>{" "}
                  {item.matched_pattern}
                </p>

              )}

            </div>

          ))

        )}

      </div>

    </div>
  );
}