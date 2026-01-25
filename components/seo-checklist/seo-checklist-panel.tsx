'use client';

import React from 'react';
import { validateSeoMeta } from '@/utils/seo/validate';

type Status = 'pass' | 'warn' | 'fail' | 'na';

function StatusPill({ status }: { status: Status }) {
  const cls =
    status === 'pass'
      ? 'bg-green-50 text-green-700 border-green-200'
      : status === 'warn'
        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
        : status === 'fail'
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-zinc-50 text-zinc-600 border-zinc-200';

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cls}`}>
      {status}
    </span>
  );
}

function FieldRow({
  label,
  value,
  status,
  message,
  length,
  hardMax,
}: {
  label: string;
  value: string;
  status: Exclude<Status, 'na'>;
  message: string;
  length: number;
  hardMax?: number;
}) {
  const border =
    status === 'pass'
      ? 'border-green-200'
      : status === 'warn'
        ? 'border-yellow-200'
        : 'border-red-200';

  return (
    <div className={`rounded-lg border ${border} bg-white p-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-zinc-700">{label}</div>
          <div className="mt-1 text-sm text-zinc-900 break-words">{value || <span className="text-zinc-400">—</span>}</div>
          <div className="mt-1 text-xs text-zinc-500">{message}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill status={status} />
          <div className="text-xs text-zinc-500 tabular-nums">
            {hardMax ? `${length}/${hardMax}` : `${length}`}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SeoChecklistPanel({
  seoMeta,
  seoAudit,
}: {
  seoMeta?: any;
  seoAudit?: any;
}) {
  if (!seoMeta && !seoAudit) {
    return (
      <div className="h-full p-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          No SEO checklist yet. Generate an article to see the audit.
        </div>
      </div>
    );
  }

  const meta = seoMeta || seoAudit?.meta || {};
  const v = validateSeoMeta(meta);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Meta checks</h3>
            <p className="mt-1 text-xs text-zinc-500">Auto-validates character limits and shows safer alternatives.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <FieldRow
            label="Meta title"
            value={v.metaTitle.value}
            status={v.metaTitle.status}
            message={v.metaTitle.message}
            length={v.metaTitle.length}
            hardMax={v.metaTitle.hardMax}
          />
          {Array.isArray(meta?.title_alternatives) && meta.title_alternatives.length > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="text-xs font-semibold text-zinc-700">Title alternatives (all within limit)</div>
              <ul className="mt-2 space-y-1 text-sm text-zinc-800">
                {meta.title_alternatives.slice(0, 3).map((t: string, i: number) => (
                  <li key={i} className="break-words">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <FieldRow
            label="Meta description"
            value={v.metaDescription.value}
            status={v.metaDescription.status}
            message={v.metaDescription.message}
            length={v.metaDescription.length}
            hardMax={v.metaDescription.hardMax}
          />
          {Array.isArray(meta?.description_alternatives) && meta.description_alternatives.length > 0 && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="text-xs font-semibold text-zinc-700">Description alternatives (all within limit)</div>
              <ul className="mt-2 space-y-1 text-sm text-zinc-800">
                {meta.description_alternatives.slice(0, 3).map((t: string, i: number) => (
                  <li key={i} className="break-words">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <FieldRow
            label="URL slug"
            value={v.slug.value}
            status={v.slug.status}
            message={v.slug.message}
            length={v.slug.length}
            hardMax={v.slug.hardMax}
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-900">SEO checklist</h3>
        <p className="mt-1 text-xs text-zinc-500">12 sections. Each item is pass/warn/fail with quick fixes.</p>

        <div className="mt-4 space-y-3">
          {(seoAudit?.sections || []).map((section: any) => (
            <details key={section.id} className="group rounded-lg border border-zinc-200 bg-white p-3">
              <summary className="cursor-pointer list-none select-none flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-zinc-900 truncate">{section.title}</div>
                  <div className="text-xs text-zinc-500">{section.items?.length || 0} checks</div>
                </div>
                <span className="text-xs text-zinc-500 group-open:hidden">Expand</span>
                <span className="text-xs text-zinc-500 hidden group-open:inline">Collapse</span>
              </summary>

              <div className="mt-3 space-y-2">
                {(section.items || []).map((item: any) => (
                  <div key={item.id} className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-900">{item.title}</div>
                        {item.notes && <div className="mt-1 text-xs text-zinc-600">{item.notes}</div>}
                        {item.how_to_fix && <div className="mt-1 text-xs text-zinc-600"><span className="font-semibold">Fix:</span> {item.how_to_fix}</div>}
                      </div>
                      <StatusPill status={(item.status || 'na') as Status} />
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}


