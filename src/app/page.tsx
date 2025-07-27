"use client";

import { trpc } from "@/lib/trpc/client";
import { useState } from "react";

type UserRole = "MEMBER" | "COACH" | "MANAGER" | "MANAGER_COACH" | "ADMIN";

export default function HomePage() {
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("MEMBER");

  // tRPC queries and mutations
  const healthQuery = trpc.health.check.useQuery({ name });
  const usersQuery = trpc.user.list.useQuery({ limit: 5 });
  const createUserMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      // Refetch users after creating a new one
      usersQuery.refetch();
      // Reset form
      setUserName("");
      setUserEmail("");
      setUserRole("MEMBER");
    },
  });

  const handleCreateUser = () => {
    if (userName && userEmail) {
      createUserMutation.mutate({
        name: userName,
        email: userEmail,
        role: userRole,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          VideoAch - tRPC Demo
        </h1>

        {/* Health Check Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Health Check</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => healthQuery.refetch()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Check Health
            </button>
          </div>
          {healthQuery.data && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800">
                <strong>Status:</strong> {healthQuery.data.status}
              </p>
              <p className="text-green-800">
                <strong>Message:</strong> {healthQuery.data.message}
              </p>
              <p className="text-green-800">
                <strong>Timestamp:</strong> {healthQuery.data.timestamp}
              </p>
            </div>
          )}
          {healthQuery.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">Error: {healthQuery.error.message}</p>
            </div>
          )}
        </div>

        {/* Users Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Users</h2>

          {/* Create User Form */}
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-medium mb-3">Create New User</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MEMBER">Member</option>
                <option value="COACH">Coach</option>
                <option value="MANAGER">Manager</option>
                <option value="MANAGER_COACH">Manager Coach</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </button>
          </div>

          {/* Users List */}
          <div>
            <h3 className="text-lg font-medium mb-3">User List</h3>
            {usersQuery.isLoading && (
              <p className="text-gray-600">Loading users...</p>
            )}
            {usersQuery.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">
                  Error: {usersQuery.error.message}
                </p>
              </div>
            )}
            {usersQuery.data && (
              <div className="space-y-2">
                {usersQuery.data.map(
                  (user: {
                    id: string;
                    name: string;
                    email: string;
                    role: string;
                  }) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {user.role}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">API Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Health Check</p>
              <p
                className={`text-lg font-medium ${
                  healthQuery.isLoading
                    ? "text-yellow-600"
                    : healthQuery.error
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {healthQuery.isLoading
                  ? "Loading..."
                  : healthQuery.error
                  ? "Error"
                  : "Ready"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Users Query</p>
              <p
                className={`text-lg font-medium ${
                  usersQuery.isLoading
                    ? "text-yellow-600"
                    : usersQuery.error
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {usersQuery.isLoading
                  ? "Loading..."
                  : usersQuery.error
                  ? "Error"
                  : "Ready"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Create User</p>
              <p
                className={`text-lg font-medium ${
                  createUserMutation.isPending
                    ? "text-yellow-600"
                    : createUserMutation.error
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {createUserMutation.isPending
                  ? "Creating..."
                  : createUserMutation.error
                  ? "Error"
                  : "Ready"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
