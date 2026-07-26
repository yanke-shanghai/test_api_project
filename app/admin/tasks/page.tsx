'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TaskItem {
  id: string;
  userId: string;
  personImageUrl: string;
  clothingImageUrl: string;
  resultImageUrl: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusLabels: Record<string, string> = {
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
};

const statusStyles: Record<string, string> = {
  processing: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export default function AdminTasksPage() {
  const { getToken } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        search,
        status: statusFilter,
      });
      const response = await fetch(`/api/admin/tasks?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTasks(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.error || '加载失败');
      }
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [getToken, page, search, statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTasks();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">任务管理</h2>

      {/* 搜索和筛选区域 */}
      <form onSubmit={handleSearch} className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索用户 email..."
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">全部状态</option>
          <option value="processing">处理中</option>
          <option value="completed">已完成</option>
          <option value="failed">失败</option>
        </select>
        <button
          type="submit"
          className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
        >
          <Search size={16} />
          搜索
        </button>
      </form>

      {/* 加载态 */}
      {loading && (
        <div className="py-12 text-center text-gray-500">加载中...</div>
      )}

      {/* 错误态 */}
      {error && !loading && (
        <div className="py-12 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchTasks}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            重试
          </button>
        </div>
      )}

      {/* 表格 */}
      {!loading && !error && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">用户</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">人像图</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">结果图</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">创建时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                        {task.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{task.user.email}</td>
                      <td className="px-4 py-3">
                        <img
                          src={task.personImageUrl}
                          alt="人像图"
                          className="w-12 h-12 rounded object-cover border border-gray-200"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {task.resultImageUrl ? (
                          <img
                            src={task.resultImageUrl}
                            alt="结果图"
                            className="w-12 h-12 rounded object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-400">无结果</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            statusStyles[task.status] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {statusLabels[task.status] || task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(task.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/tasks/${task.id}`}
                          className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium"
                        >
                          <Eye size={14} />
                          查看
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {pagination && pagination.total > 0 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-500">
                共 {pagination.total} 条，第 {pagination.page}/{pagination.totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                  上一页
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
