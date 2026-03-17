'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

interface Alert {
  id: string;
  type: string;
  severity: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export default function StalledAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts?type=stalled`);
      const data = await res.json();
      setAlerts(data.success ? data.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
          <h1 className="text-3xl font-bold text-slate-900">Module 1: Stalled Pipeline Alerts</h1>
        </div>
        <p className="text-slate-600 mb-8">
          Candidates over SLA, stale jobs, offers with no response
        </p>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            <p className="mt-4 text-slate-600">Loading...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-slate-600">No stalled pipeline alerts. Run a refresh to sync.</p>
            <Link href="/" className="inline-block mt-4 text-amber-600 font-medium hover:underline">
              Refresh alerts from dashboard
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {alerts.map((a) => (
                  <tr key={a.id}>
                    <td className="px-6 py-4 text-sm text-slate-900">{String(a.payload.candidateName || '-')}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{String(a.payload.jobTitle || '-')}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{String(a.payload.currentStage || '-' )}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{String(a.payload.daysInStage ?? a.payload.daysSinceOffer ?? a.payload.daysSinceActivity ?? '-')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${a.payload.subType === 'stale_job' ? 'bg-slate-200' : a.payload.subType === 'offer_no_response' ? 'bg-orange-200' : 'bg-amber-200'}`}>
                        {String(a.payload.subType || 'stage_sla')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
