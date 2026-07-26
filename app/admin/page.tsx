'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, ClipboardList, TrendingUp, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface StatsData {
  totalUsers: number;
  newUsers7d: number;
  totalTasks: number;
  newTasks7d: number;
  taskStatusDistribution: Array<{ status: string; count: number }>;
}

const statusLabels: Record<string, string> = {
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
};

const statusColors: Record<string, string> = {
  processing: 'bg-yellow-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
};

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const response = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || '加载失败');
      }
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          重试
        </button>
      </div>
    );
  }

  if (!stats) return null;

  // 计算状态分布总数
  const totalTasksInDist = stats.taskStatusDistribution.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const cards = [
    { label: '用户总数', value: stats.totalUsers, icon: Users, color: 'text-blue-600' },
    { label: '新增用户（近7天）', value: stats.newUsers7d, icon: TrendingUp, color: 'text-green-600' },
    { label: '任务总数', value: stats.totalTasks, icon: ClipboardList, color: 'text-purple-600' },
    { label: '新增任务（近7天）', value: stats.newTasks7d, icon: Activity, color: 'text-orange-600' },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">概览</h2>

      {/* 指标卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-lg border border-gray-200 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{card.label}</span>
                <Icon size={20} className={card.color} />
              </div>
              <p className="text-3xl font-bold text-gray-800">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* 任务状态分布 */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-4">任务状态分布</h3>
        {totalTasksInDist === 0 ? (
          <p className="text-gray-400 text-sm">暂无数据</p>
        ) : (
          <div className="space-y-3">
            {stats.taskStatusDistribution.map((item) => {
              const percentage =
                totalTasksInDist > 0
                  ? Math.round((item.count / totalTasksInDist) * 100)
                  : 0;
              return (
                <div key={item.status} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-gray-600">
                    {statusLabels[item.status] || item.status}
                  </span>
                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                    <div
                      className={`h-full ${statusColors[item.status] || 'bg-gray-400'} flex items-center justify-end px-2 transition-all`}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    >
                      {percentage > 10 && (
                        <span className="text-xs text-white font-medium">
                          {percentage}%
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="w-12 text-sm text-gray-600 text-right">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
