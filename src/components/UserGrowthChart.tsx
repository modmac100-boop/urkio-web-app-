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
    <div className="bg-[#1A2127] p-6 rounded-2xl border border-gray-800 shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-[#EDE8E4] text-xl font-bold">نمو مستخدمي أوركيو</h3>
          <p className="text-[#6B8E7D] text-sm mt-1">تتبع نمو قاعدة المستخدمين شهرياً</p>
        </div>
        <div className="bg-[#30B0D0]/10 px-3 py-1 rounded-full">
          <span className="text-[#30B0D0] text-xs font-medium">Monthly Stats</span>
        </div>
      </div>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#30B0D0" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#30B0D0" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#2D3748" 
              vertical={false} 
              opacity={0.5}
            />
            
            <XAxis 
              dataKey="month" 
              stroke="#6B8E7D" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: '#6B8E7D' }}
              dy={10}
            />
            
            <YAxis 
              stroke="#6B8E7D" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#6B8E7D' }}
              tickFormatter={(value) => `${value}`} 
            />
            
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#050A0F', 
                border: '1px solid #30B0D0',
                borderRadius: '12px',
                padding: '12px'
              }}
              itemStyle={{ color: '#30B0D0', fontWeight: 'bold' }}
              labelStyle={{ color: '#EDE8E4', marginBottom: '4px' }}
              cursor={{ stroke: '#30B0D0', strokeWidth: 1 }}
            />

            <Area 
              type="monotone" 
              dataKey="users" 
              stroke="#30B0D0" 
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
