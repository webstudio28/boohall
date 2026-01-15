'use client';

import { useState } from 'react';
import { Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { analyzeService, createServiceDescription } from '@/app/actions/service';
import { KeywordSelector, Keyword } from '@/components/keyword-selector';
import { Dictionary } from '@/utils/dictionaries';

interface ServiceFormProps {
    dict: Dictionary;
}

export function ServiceForm({ dict }: ServiceFormProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [description, setDescription] = useState('');

    // Analysis Data
    const [analysisData, setAnalysisData] = useState<{
        name: string;
        keywords: Keyword[];
    } | null>(null);

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', description);

            const result = await analyzeService(formData);

            if (result.success && result.data) {
                setAnalysisData(result.data);
                setStep(2);
            }

        } catch (error) {
            console.error('Error analyzing service:', error);
            alert(dict.service.error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalSubmit = async (selectedKeywords: Keyword[]) => {
        if (!analysisData) return;
        setIsLoading(true);
        try {
            await createServiceDescription(
                analysisData.name,
                analysisData.keywords,
                selectedKeywords
            );

            // Success & Reset
            setStep(1);
            setDescription('');
            setAnalysisData(null);
            alert(dict.service.success);

        } catch (error) {
            console.error('Error creating service:', error);
            alert(dict.service.error);
        } finally {
            setIsLoading(false);
        }
    };

    if (step === 2 && analysisData) {
        return (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm animate-in fade-in slide-in-from-right-4">
                <button
                    onClick={() => setStep(1)}
                    className="mb-4 flex items-center text-sm text-zinc-500 hover:text-zinc-900"
                >
                    <ArrowLeft className="mr-1 h-4 w-4" /> {dict.service.backBtn}
                </button>

                <h3 className="text-lg font-semibold text-zinc-900 mb-6">{dict.service.step2Title}</h3>

                <div className="mb-6 rounded-lg bg-zinc-50 p-4">
                    <p className="font-medium text-zinc-900">Service: {analysisData.name}</p>
                    <p className="text-sm text-zinc-500 mt-1">{analysisData.keywords.length} {dict.service.keywordsFound}</p>
                </div>

                <KeywordSelector
                    keywords={analysisData.keywords}
                    onConfirm={handleFinalSubmit}
                    isLoading={isLoading}
                    dict={dict}
                />
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">{dict.service.addTitle}</h3>
            <form onSubmit={handleAnalyze} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                        {dict.service.descriptionLabel}
                    </label>
                    <textarea
                        rows={5}
                        className="w-full rounded-md border border-zinc-300 p-3 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        placeholder={dict.service.descriptionPlaceholder}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !description}
                    className="flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {dict.service.analyzingBtn}
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            {dict.service.nextBtn}
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
