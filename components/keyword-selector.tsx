'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Dictionary } from '@/utils/dictionaries';

export interface Keyword {
    keyword: string;
    volume: number;
    difficulty?: string;
}

interface KeywordSelectorProps {
    keywords: Keyword[];
    onConfirm: (selected: Keyword[]) => void;
    maxSelection?: number;
    isLoading?: boolean;
    dict: Dictionary;
}

export function KeywordSelector({ keywords, onConfirm, maxSelection = 3, isLoading = false, dict }: KeywordSelectorProps) {
    const [selected, setSelected] = useState<Keyword[]>([]);

    const toggleKeyword = (kw: Keyword) => {
        if (selected.find(s => s.keyword === kw.keyword)) {
            setSelected(selected.filter(s => s.keyword !== kw.keyword));
        } else {
            if (selected.length >= maxSelection) return;
            setSelected([...selected, kw]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h3 className="text-lg font-semibold text-zinc-900">{dict.keywords.title}</h3>
                <p className="text-sm text-zinc-500">
                    {dict.keywords.subtitle.replace('{max}', String(maxSelection))}
                </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                {keywords.map((kw, i) => {
                    const isSelected = !!selected.find(s => s.keyword === kw.keyword);
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => toggleKeyword(kw)}
                            disabled={!isSelected && selected.length >= maxSelection}
                            className={cn(
                                "relative flex items-center justify-between rounded-lg border p-4 text-left transition-all",
                                isSelected
                                    ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
                                    : "border-zinc-200 hover:border-zinc-300 bg-white",
                                !isSelected && selected.length >= maxSelection && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <div>
                                <p className="font-medium text-zinc-900">{kw.keyword}</p>
                                <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                                    <span>{dict.keywords.vol}: {kw.volume ?? 'N/A'}</span>
                                    {kw.difficulty && <span>{dict.keywords.diff}: {kw.difficulty}</span>}
                                </div>
                            </div>
                            {isSelected && (
                                <div className="absolute top-4 right-4 text-zinc-900">
                                    <Check className="h-5 w-5" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <button
                onClick={() => onConfirm(selected)}
                disabled={selected.length === 0 || isLoading}
                className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
                {isLoading ? dict.keywords.generatingBtn : dict.keywords.continueBtn.replace('{count}', String(selected.length))}
            </button>
        </div>
    );
}
