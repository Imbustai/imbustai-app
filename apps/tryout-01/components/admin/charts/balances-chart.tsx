'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { BalanceDescriptor } from '@/lib/questionnaire';

interface BalancesChartProps {
  balances: BalanceDescriptor[];
}

interface BalancePayloadEntry {
  payload: BalanceDescriptor;
  value: number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: BalancePayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const d = entry.payload;
  const val = entry.value;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{d.label}</p>
      <p className="text-muted-foreground">
        {val > 0
          ? `+${val} toward ${d.rightLabel}`
          : val < 0
            ? `${val} toward ${d.leftLabel}`
            : 'Balanced (0)'}
      </p>
    </div>
  );
}

function CustomYTick(props: {
  x?: number | string;
  y?: number | string;
  payload?: { value: string };
  data: BalanceDescriptor[];
}) {
  const { x = 0, y = 0, payload, data } = props;
  const item = payload ? data.find((d) => d.label === payload.value) : null;
  if (!item) return null;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-4}
        y={0}
        dy={-6}
        textAnchor="end"
        className="fill-foreground text-xs font-medium"
      >
        {item.label}
      </text>
      <text
        x={-4}
        y={0}
        dy={8}
        textAnchor="end"
        className="fill-muted-foreground text-[10px]"
      >
        {item.leftLabel} / {item.rightLabel}
      </text>
    </g>
  );
}

const POSITIVE_COLOR = 'hsl(221, 83%, 53%)';
const NEGATIVE_COLOR = 'hsl(25, 95%, 53%)';

export function BalancesChart({ balances }: BalancesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={balances}
        layout="vertical"
        margin={{ top: 4, right: 24, bottom: 4, left: 140 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
        <XAxis
          type="number"
          domain={[-4, 4]}
          ticks={[-4, -3, -2, -1, 0, 1, 2, 3, 4]}
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={(props) => <CustomYTick {...props} data={balances} />}
          width={136}
        />
        <ReferenceLine x={0} stroke="hsl(var(--border))" strokeWidth={2} />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
        />
        <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={20}>
          {balances.map((entry) => (
            <Cell
              key={entry.key}
              fill={entry.value >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
