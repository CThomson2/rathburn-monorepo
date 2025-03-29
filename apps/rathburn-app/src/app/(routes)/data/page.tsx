import {
  MetricCard,
  DrumStatusChart,
  // MaterialDistribution,
} from "@/features/data-page";

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard
          title="Pending Orders"
          value="4"
          subtitle="18 units pending delivery"
        />
        {/* Other metric cards */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* <DrumStatusChart data={drumData} /> */}
        {/* <MaterialDistribution data={materialData} /> */}
      </div>
    </div>
  );
}
