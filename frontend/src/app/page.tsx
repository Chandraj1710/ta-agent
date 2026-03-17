'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, FileCheck, Users, Settings } from 'lucide-react';

interface AlertCounts {
  stalled: number;
  scorecard: number;
  referral: number;
}

export default function Home() {
  const [counts, setCounts] = useState<AlertCounts>({ stalled: 0, scorecard: 0, referral: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const stalled = data.data.filter((a: { type: string }) => a.type === 'stalled').length;
        const scorecard = data.data.filter((a: { type: string }) => a.type === 'scorecard').length;
        const referral = data.data.filter((a: { type: string }) => a.type === 'referral').length;
        setCounts({ stalled, scorecard, referral });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts/refresh`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchCounts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="gradient-bg text-white" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
                <AlertTriangle className="w-16 h-16" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4">TA Ops Agent</h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Pipeline alerts, scorecard accountability, and referral follow-up for Talent Acquisition.
            </p>
            <p className="text-sm text-blue-100 mb-4">
              Add your Greenhouse API key in Settings to fetch jobs and alerts.
            </p>
            <div className="flex justify-center gap-6 mb-6">
              <Link
                href="/settings"
                className="bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors shadow-lg"
              >
                Add Greenhouse API Key
              </Link>
              <Link
                href="/alerts/stalled"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
              >
                Module 1: Pipeline Alerts
              </Link>
              <Link
                href="/alerts/scorecards"
                className="bg-white/90 text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-white transition-colors shadow-lg"
              >
                Module 2: Scorecards
              </Link>
              <Link
                href="/alerts/referrals"
                className="bg-white/90 text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-white transition-colors shadow-lg"
              >
                Module 3: Referrals
              </Link>
              <Link
                href="/settings"
                className="bg-white/90 text-slate-600 px-6 py-3 rounded-lg font-semibold hover:bg-white transition-colors shadow-lg"
              >
                <Settings className="w-5 h-5 inline mr-2" />
                Settings
              </Link>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors shadow-lg disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh Alerts'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/alerts/stalled" className="block">
            <div className="bg-white rounded-xl shadow-md p-6 border-2 border-transparent hover:border-amber-500 transition-colors">
              <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">Stalled Pipeline</h3>
              <p className="text-gray-600 text-sm mb-2">Candidates over SLA, stale jobs, offers no response</p>
              {loading ? (
                <span className="text-2xl font-bold text-amber-600">...</span>
              ) : (
                <span className="text-2xl font-bold text-amber-600">{counts.stalled}</span>
              )}
              <span className="text-gray-500 text-sm ml-1">alerts</span>
            </div>
          </Link>
          <Link href="/alerts/scorecards" className="block">
            <div className="bg-white rounded-xl shadow-md p-6 border-2 border-transparent hover:border-blue-500 transition-colors">
              <FileCheck className="w-10 h-10 text-blue-500 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">Scorecard Accountability</h3>
              <p className="text-gray-600 text-sm mb-2">Missing scorecards 24h+ after interview</p>
              {loading ? (
                <span className="text-2xl font-bold text-blue-600">...</span>
              ) : (
                <span className="text-2xl font-bold text-blue-600">{counts.scorecard}</span>
              )}
              <span className="text-gray-500 text-sm ml-1">alerts</span>
            </div>
          </Link>
          <Link href="/alerts/referrals" className="block">
            <div className="bg-white rounded-xl shadow-md p-6 border-2 border-transparent hover:border-green-500 transition-colors">
              <Users className="w-10 h-10 text-green-500 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">Referral Follow-up</h3>
              <p className="text-gray-600 text-sm mb-2">Referrals not reviewed or no next action</p>
              {loading ? (
                <span className="text-2xl font-bold text-green-600">...</span>
              ) : (
                <span className="text-2xl font-bold text-green-600">{counts.referral}</span>
              )}
              <span className="text-gray-500 text-sm ml-1">alerts</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
