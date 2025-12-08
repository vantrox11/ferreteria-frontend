// Component for KPI stat cards in dashboards
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  colorClass?: string;
}

export function StatCard({ title, value, icon, trend, colorClass = 'text-blue-600' }: StatCardProps) {
  const isPositiveTrend = trend && trend.value >= 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn('text-2xl', colorClass)}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {isPositiveTrend ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={isPositiveTrend ? 'text-green-600' : 'text-red-600'}>
              {isPositiveTrend ? '+' : ''}{trend.value.toFixed(1)}%
            </span>
            <span>{trend.label}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
