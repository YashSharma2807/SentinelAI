function StatCard({ title, value, color }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-purple-500 hover:shadow-[0_0_40px_rgba(168,85,247,.25)]">
      <p className="text-gray-400">{title}</p>

      <h2 className={`mt-4 text-5xl font-black ${color}`}>
        {value}
      </h2>
    </div>
  );
}

export default function StatsCards({ analysis }) {

  let critical = 0;
  let high = 0;
  let medium = 0;

  if (analysis) {
    analysis.detections.forEach((item) => {
      if (item.severity === "Critical") critical++;
      else if (item.severity === "High") high++;
      else if (item.severity === "Medium") medium++;
    });
  }

  const confidence = analysis ? "95%" : "0%";

  return (
    <section className="mx-auto mt-14 grid max-w-7xl grid-cols-4 gap-6 px-8">

      <StatCard
        title="Critical"
        value={critical}
        color="text-red-500"
      />

      <StatCard
        title="High"
        value={high}
        color="text-orange-400"
      />

      <StatCard
        title="Medium"
        value={medium}
        color="text-yellow-300"
      />

      <StatCard
        title="AI Confidence"
        value={confidence}
        color="text-purple-400"
      />

    </section>
  );
}