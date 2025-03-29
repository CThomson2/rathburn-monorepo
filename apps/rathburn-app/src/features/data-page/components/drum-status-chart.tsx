import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface DrumStatusChartProps {
  data: {
    status: string;
    color: string;
    value: number;
  }[];
}
/**
 * DrumStatusChart component
 * @param {Object} data - The data for the chart
 * @param {Array} data.status - The status of the drums
 * @param {Array} data.color - The color of the drums
 * @param {Array} data.value - The value of the drums
 * @returns {JSX.Element} The DrumStatusChart component
 */
export function DrumStatusChart({ data }: DrumStatusChartProps) {
  return (
    <div className="bg-navy-800 rounded-lg p-6">
      <h3 className="text-white text-lg mb-4">Drum Status</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={0}
              dataKey="value"
            >
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
