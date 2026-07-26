'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Shield, ShieldOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UserItem {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 搜索和筛选
  const [search, setSearch] = useState('');
  const [isAdminFilter, setIsAdminFilter] = useState('all');
  const [page, setPage] = useState(1);

  // 编辑弹窗
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        search,
        isAdmin: isAdminFilter,
      });
      const response = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.error || '加载失败');
      }
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [getToken, page, search, isAdminFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setEditLoading(true);
    setEditError('');
    try {
      const token = getToken();
      const response = await fetch(`/api/admin/users/${editUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAdmin: !editUser.isAdmin }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg(`已${!editUser.isAdmin ? '设置' : '取消'} ${editUser.email} 的管理员权限`);
        setEditUser(null);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchUsers();
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
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">用户管理</h2>

      {/* 成功提示 */}
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {successMsg}
        </div>
      )}

      {/* 搜索和筛选区域 */}
      <form onSubmit={handleSearch} className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索 email..."
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <select
          value={isAdminFilter}
          onChange={(e) => {
            setIsAdminFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">全部</option>
          <option value="true">管理员</option>
          <option value="false">普通用户</option>
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
            onClick={fetchUsers}
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">注册时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">角色</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                        {user.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.isAdmin
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {user.isAdmin ? '管理员' : '普通用户'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setEditUser(user);
                            setEditError('');
                          }}
                          className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                            user.isAdmin
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          {user.isAdmin ? (
                            <>
                              <ShieldOff size={14} />
                              取消管理员
                            </>
                          ) : (
                            <>
                              <Shield size={14} />
                              设置管理员
                            </>
                          )}
                        </button>
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

      {/* 编辑确认弹窗 */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">确认操作</h3>
            <p className="text-sm text-gray-600 mb-4">
              确认将 <span className="font-medium text-gray-800">{editUser.email}</span>{' '}
              {editUser.isAdmin ? '取消' : '设置为'}管理员权限？
            </p>
            {editError && (
              <p className="text-sm text-red-500 mb-4">{editError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditUser(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleEdit}
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
