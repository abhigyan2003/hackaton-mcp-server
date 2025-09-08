'use client'

import Link from 'next/link';
import { useUser } from '@descope/react-sdk';

export default function Home() {
  const { user, isUserLoading } = useUser();
  return (
    <div className="max-w-screen-lg mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center py-6">
        <h2 className="text-2xl font-bold">Welcome Back {user.name} 👋</h2>
        <Link 
          href="/logout" 
          className="px-4 py-1 border rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
        >
          Logout
        </Link>
      </div>

      {/* Greeting */}
      <div className="text-center mt-12">
        <h1 className="text-3xl font-semibold">You're signed in successfully!</h1>
        <p className="mt-4 text-gray-600">
          Choose an action below to get started.
        </p>
      </div>

      {/* Actions */}
      <div className="mt-12 flex justify-center gap-6 flex-wrap">
        <Link 
          href="/generate" 
          className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors"
        >
          <svg 
            className="w-5 h-5" 
            fill="currentColor" 
            viewBox="0 0 20 20" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              fillRule="evenodd" 
              d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" 
              clipRule="evenodd"
            />
          </svg>
          Generate Repos
        </Link>

        <Link
          href="/claude-generation"
          className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-orange-600 text-white shadow-lg hover:bg-orange-700 hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          <svg 
            className="w-5 h-5" 
            fill="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              fill="none"
            />
          </svg>
          Claude AI
        </Link>
      </div>
    </div>
  );
}