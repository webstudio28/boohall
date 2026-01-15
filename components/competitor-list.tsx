'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Competitor {
    id: string;
    domain: string;
    content_type: string | null;
    weakness_summary: string | null;
}

interface CompetitorListProps {
    competitors: Competitor[];
    emptyMessage: string;
}

export function CompetitorList({ competitors, emptyMessage }: CompetitorListProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const displayedCompetitors = isExpanded ? competitors : competitors.slice(0, 3);
    const hiddenCount = competitors.length - 3;
    const hasMore = hiddenCount > 0;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence initial={false} mode='popLayout'>
                    {displayedCompetitors.map((comp) => (
                        <motion.div
                            layout
                            key={comp.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-lg border border-zinc-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start">
                                <h4 className="font-medium text-zinc-900 truncate" title={comp.domain}>
                                    {comp.domain}
                                </h4>
                                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200 shrink-0 ml-2">
                                    {comp.content_type || 'Unknown'}
                                </span>
                            </div>
                            <p className="mt-2 text-xs text-zinc-500 line-clamp-3">
                                {comp.weakness_summary || 'No weakness analysis available.'}
                            </p>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {competitors.length === 0 && (
                    <div className="col-span-full text-center py-8 bg-zinc-50 rounded-lg border border-dashed border-zinc-300">
                        <p className="text-zinc-500">{emptyMessage}</p>
                    </div>
                )}
            </div>

            {hasMore && (
                <div className="flex justify-center mt-4">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-black transition-colors px-4 py-2 rounded-full hover:bg-zinc-100"
                    >
                        {isExpanded ? (
                            <>Show Less <ChevronDown className="w-4 h-4 rotate-180 transition-transform" /></>
                        ) : (
                            <>Show {hiddenCount} More <ChevronDown className="w-4 h-4 transition-transform" /></>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
