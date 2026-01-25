'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteKeyword, refreshKeywordVolume } from '@/app/(dashboard)/dashboard/actions';

export function KeywordRowActions({ keywordId }: { keywordId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'refresh' | 'delete' | null>(null);

  const onRefresh = async () => {
    setBusy('refresh');
    try {
      await refreshKeywordVolume(keywordId);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const onDelete = async () => {
    const ok = window.confirm('Delete this keyword? This cannot be undone.');
    if (!ok) return;
    setBusy('delete');
    try {
      await deleteKeyword(keywordId);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={onRefresh}
        disabled={busy !== null}
        className="text-xs border border-zinc-200 bg-white hover:bg-zinc-50 rounded px-2 py-1 disabled:opacity-50"
        title="Refresh volume"
      >
        {busy === 'refresh' ? '…' : '↻'}
      </button>
      <button
        onClick={onDelete}
        disabled={busy !== null}
        className="text-xs border border-zinc-200 bg-white hover:bg-zinc-50 rounded px-2 py-1 disabled:opacity-50"
        title="Delete"
      >
        {busy === 'delete' ? '…' : '🗑'}
      </button>
    </div>
  );
}


