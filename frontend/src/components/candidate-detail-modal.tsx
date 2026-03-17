'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
}

interface CandidateDetailModalProps {
  candidateId: number | null;
  alertPayload: Record<string, unknown>;
  onClose: () => void;
}

export function CandidateDetailModal({ candidateId, alertPayload, onClose }: CandidateDetailModalProps) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId || candidateId < 1) return;
    setLoading(true);
    setError(null);
    setCandidate(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    fetch(`${apiUrl}/api/greenhouse/candidates/${candidateId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success && data.data) setCandidate(data.data);
        else setError(data.details || data.error || 'Failed to load candidate');
      })
      .catch((err) => setError(err.message || 'Failed to load candidate'))
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (candidateId == null || candidateId < 1) return null;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        className="relative z-10 w-full max-w-md rounded-lg bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Candidate Details</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {loading && (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        )}
        {error && (
          <div className="py-4 text-sm text-destructive">{error}</div>
        )}
        {!loading && !error && candidate && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Name</p>
              <p className="text-base font-medium">
                {[candidate.first_name, candidate.last_name].filter(Boolean).join(' ') || '—'}
              </p>
            </div>
            {candidate.email && (
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Email</p>
                <a
                  href={`mailto:${candidate.email}`}
                  className="text-base text-primary hover:underline"
                >
                  {candidate.email}
                </a>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Job</p>
              <p className="text-base">{String(alertPayload.jobTitle || '—')}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Stage</p>
              <p className="text-base">{String(alertPayload.currentStage || '—')}</p>
            </div>
            {alertPayload.daysInStage != null && (
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Days in stage</p>
                <p className="text-base">{String(alertPayload.daysInStage)}</p>
              </div>
            )}
            {alertPayload.daysSinceOffer != null && (
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Days since offer</p>
                <p className="text-base">{String(alertPayload.daysSinceOffer)}</p>
              </div>
            )}
            {alertPayload.daysSinceReferral != null && (
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Days since referral</p>
                <p className="text-base">{String(alertPayload.daysSinceReferral)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
}
