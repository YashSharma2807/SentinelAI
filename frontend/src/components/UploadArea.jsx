import { UploadCloud } from "lucide-react";
import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function UploadArea({ setAnalysis }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a log file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    console.log("API_URL:", API_URL);
    console.log("Upload URL:", `${API_URL}/logs/upload`);
    console.log("Selected File:", selectedFile);

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/logs/upload`,
        formData
      );

      console.log("Backend Response:", response.data);

      setAnalysis(response.data);

    } catch (error) {

      console.error("Axios Error:", error);

      if (error.response) {
        console.log("Status:", error.response.status);
        console.log("Headers:", error.response.headers);
        console.log("Data:", error.response.data);

        alert(`Request failed with status ${error.response.status}`);
      } else if (error.request) {
        console.log("Request:", error.request);
        alert("Network Error - Request sent but no valid response received.");
      } else {
        alert(error.message);
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto mt-16 max-w-5xl">

      <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-12 backdrop-blur-xl transition duration-300 hover:border-purple-500/40 hover:shadow-[0_0_70px_rgba(168,85,247,.25)]">

        <div className="flex flex-col items-center">

          <div className="rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 p-6 shadow-[0_0_35px_rgba(168,85,247,.45)]">
            <UploadCloud size={46} />
          </div>

          <h2 className="mt-8 text-4xl font-bold">
            Upload Security Log
          </h2>

          <p className="mt-3 text-gray-400">
            Drag & Drop Linux, Windows or Web Server logs
          </p>

          <label className="mt-10 flex w-full cursor-pointer items-center justify-center rounded-2xl border border-dashed border-purple-500/30 bg-[#13131A] px-6 py-12 transition hover:border-purple-400 hover:bg-[#181822]">

            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="text-center">

              <UploadCloud
                size={42}
                className="mx-auto text-purple-400"
              />

              <p className="mt-5 text-lg font-semibold">
                {selectedFile
                  ? selectedFile.name
                  : "Click to Browse Files"}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Supported: .log .txt .evtx
              </p>

            </div>

          </label>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-10 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-12 py-4 text-lg font-bold transition duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(168,85,247,.45)] disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze Log"}
          </button>

        </div>

      </div>

    </section>
  );
}



