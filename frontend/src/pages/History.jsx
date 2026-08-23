import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/logs/history"
      );

      setHistory(response.data);
    } catch (error) {
      console.error(error);
      alert("Failed to load history.");
    } finally {
      setLoading(false);
    }
  };

  const severityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-600";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500 text-black";
      case "low":
        return "bg-green-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-8 py-12">

        <h1 className="text-5xl font-bold">
          Analysis History
        </h1>

        <p className="mt-4 text-gray-400">
          View all previously analyzed security logs.
        </p>

        {loading ? (

          <div className="mt-12 text-center text-gray-400">
            Loading history...
          </div>

        ) : history.length === 0 ? (

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-8">
            <p className="text-gray-400">
              No analysis history found.
            </p>
          </div>

        ) : (

          <div className="mt-10 space-y-6">

            {history.map((item) => (

              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition hover:border-purple-500 hover:shadow-[0_0_25px_rgba(168,85,247,.2)]"
              >

                <div className="flex items-center justify-between">

                  <div>

                    <h2 className="text-2xl font-bold">
                      📄 {item.filename}
                    </h2>

                    <p className="mt-2 text-gray-400">
                      Threat:{" "}
                      <span className="font-medium text-white">
                        {item.threat}
                      </span>
                    </p>

                    <p className="mt-1 text-gray-400">
                      Total Detections:{" "}
                      <span className="font-medium text-white">
                        {item.total_detections}
                      </span>
                    </p>

                    <p className="mt-1 text-gray-500">
                      Uploaded:{" "}
                      {new Date(item.uploaded_at).toLocaleString()}
                    </p>

                  </div>

                  <div className="text-right">

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-bold text-white ${severityColor(
                        item.severity
                      )}`}
                    >
                      {item.severity}
                    </span>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>
    </div>
  );
}