import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

interface UserGrowthChartProps {
  data: { month: string; users: number }[];
}

const UserGrowthChart: React.FC<UserGrowthChartProps> = ({ data }) => {
  return (
    <div className="bg-msgr-surface-container p-6 rounded-4xl border border-white/5 shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-ur-background text-xl font-bold">نمو مستخدمي أوركيو</h3>
          <p className="text-ur-secondary text-sm mt-1">تتبع نمو قاعدة المستخدمين شهرياً</p>
        </div>
        <div className="bg-ur-primary/10 px-3 py-1 rounded-full">
          <span className="text-ur-primary text-xs font-medium">Monthly Stats</span>
        </div>
      </div>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--ur-primary)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--ur-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="var(--ur-outline)" 
              vertical={false} 
              opacity={0.3}
            />
            
            <XAxis 
              dataKey="month" 
              stroke="var(--ur-secondary)" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: 'var(--ur-secondary)' }}
              dy={10}
            />
            
            <YAxis 
              stroke="var(--ur-secondary)" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: 'var(--ur-secondary)' }}
              tickFormatter={(value) => `${value}`} 
            />
            
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--ur-on-surface)', 
                border: '1px solid var(--ur-primary)',
                borderRadius: '12px',
                padding: '12px'
              }}
              itemStyle={{ color: 'var(--ur-primary)', fontWeight: 'bold' }}
              labelStyle={{ color: 'var(--ur-background)', marginBottom: '4px' }}
              cursor={{ stroke: 'var(--ur-primary)', strokeWidth: 1 }}
            />

            <Area 
              type="monotone" 
              dataKey="users" 
              stroke="var(--ur-primary)" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorUsers)"
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UserGrowthChart;
