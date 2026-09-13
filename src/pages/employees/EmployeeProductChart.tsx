import React from 'react';
import { Card } from 'antd';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { IProductSummary } from '../../types/employee-details.types';

interface EmployeeProductChartProps {
  data: IProductSummary[];
}

const COLORS = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

export const EmployeeProductChart: React.FC<EmployeeProductChartProps> = ({ data }) => {
  // Map data for Pie chart
  const chartData = data.map((item) => ({
    name: item.productName,
    value: item.contributionPercentage,
    qty: item.quantityProduced,
  }));

  // Custom label renderer with pointer line
  const renderCustomizedLabel = (props: any) => {
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      value,
      name,
    } = props;

    if (!value || value === 0) return null;

    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);

    // Start point outside the outer edge of the slice
    const sx = cx + (outerRadius + 6) * cos;
    const sy = cy + (outerRadius + 6) * sin;

    // Mid point where the line bends
    const mx = cx + (outerRadius + 18) * cos;
    const my = cy + (outerRadius + 18) * sin;

    // End point (horizontal extension)
    const ex = mx + (cos >= 0 ? 1 : -1) * 16;
    const ey = my;

    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        {/* Pointer Line */}
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke="#94A3B8"
          fill="none"
          strokeWidth={1.5}
        />
        {/* Small indicator circle at starting point */}
        <circle cx={sx} cy={sy} r={3} fill="#94A3B8" />
        {/* Text showing name and contribution percentage */}
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 6}
          y={ey}
          textAnchor={textAnchor}
          fill="#1E293B"
          dominantBaseline="middle"
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'capitalize',
          }}
        >
          {`${name} (${value}%)`}
        </text>
      </g>
    );
  };

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #E2E8F0',
            padding: '8px 12px',
            borderRadius: 8,
            boxShadow: '0px 4px 6px -1px rgba(15, 23, 42, 0.1)',
          }}
        >
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
            {dataPoint.name}
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: payload[0].color }}>
            Contribution: {dataPoint.value}%
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>
            Qty Produced: {dataPoint.qty} Pcs
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title={<span style={{ color: '#0F172A', fontWeight: 700, fontSize: '1.1rem' }}>Product Contribution %</span>}
      style={{
        borderRadius: 12,
        boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
        border: '1px solid #E2E8F0',
        height: '100%',
      }}
      bodyStyle={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
    >
      <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {data.length === 0 ? (
          <div style={{ color: '#94A3B8', fontSize: '0.95rem' }}>
            No data available for the selected range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
                label={renderCustomizedLabel}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={8}
                formatter={(value, entry: any, index) => {
                  const percent = chartData[index]?.value || 0;
                  return (
                    <span style={{ color: '#475569', fontWeight: 500, fontSize: '0.85rem' }}>
                      {value} ({percent}%)
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
