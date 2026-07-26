'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TaskDetail {
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

const ALLOWED_STATUSES = ['processing', 'completed', 'failed'];

export default function AdminTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const taskId = params.id as string;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 编辑状态
  const [newStatus, setNewStatus] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTask = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTask(data.data);
        setNewStatus(data.data.status);
      } else {
        setError(data.error || '加载失败');
      }
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [getToken, taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleUpdateStatus = async () => {
    setEditLoading(true);
    setEditError('');
    try {
      const token = getToken();
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg('状态更新成功');
        setShowConfirm(false);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchTask();
      } else {
        setEditError(data.error || '更新失败');
      }
    } catch (err: any) {
      setEditError(err.message || '更新失败');
    } finally {
      setEditLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">加载中...</div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchTask}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          重试
        </button>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div>
      {/* 返回按钮 */}
      <Link
        href="/admin/tasks"
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 mb-4"
      >
        <ArrowLeft size={16} />
        返回列表
      </Link>

      <h2 className="text-xl font-bold text-gray-800 mb-6">任务详情</h2>

      {/* 成功提示 */}
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMsg}
        </div>
      )}

      {/* 基本信息 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">任务 ID</label>
            <p className="text-sm text-gray-800 font-mono mt-1">{task.id}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">用户邮箱</label>
            <p className="text-sm text-gray-800 mt-1">{task.user.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">创建时间</label>
            <p className="text-sm text-gray-800 mt-1">{formatDate(task.createdAt)}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">当前状态</label>
            <div className="mt-1">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  statusStyles[task.status] || 'bg-gray-100 text-gray-600'
                }`}
              >
                {statusLabels[task.status] || task.status}
              </span>
            </div>
          </div>
        </div>

        {/* 编辑状态 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <label className="text-sm text-gray-500">更新状态</label>
          <div className="flex items-center gap-3 mt-2">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {ALLOWED_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setEditError('');
                setShowConfirm(true);
              }}
              disabled={newStatus === task.status}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              更新状态
            </button>
          </div>
        </div>
      </div>

      {/* 图片展示 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">人像照片</h3>
          <img
            src={task.personImageUrl}
            alt="人像照片"
            className="w-full rounded-lg border border-gray-200"
          />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">服装照片</h3>
          <img
            src={task.clothingImageUrl}
            alt="服装照片"
            className="w-full rounded-lg border border-gray-200"
          />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">结果照片</h3>
          {task.resultImageUrl ? (
            <img
              src={task.resultImageUrl}
              alt="结果照片"
              className="w-full rounded-lg border border-gray-200"
            />
          ) : (
            <div className="w-full aspect-square rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <span className="text-gray-400">暂无结果</span>
            </div>
          )}
        </div>
      </div>

      {/* 确认弹窗 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">确认操作</h3>
            <p className="text-sm text-gray-600 mb-4">
              确认将任务状态更新为{' '}
              <span className="font-medium text-gray-800">
                {statusLabels[newStatus]}
              </span>
              ？
            </p>
            {editError && (
              <p className="text-sm text-red-500 mb-4">{editError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={editLoading}
                className="px-4 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {editLoading ? '处理中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
