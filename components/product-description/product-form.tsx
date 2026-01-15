'use client';

import { useState } from 'react';
import { Upload, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { analyzeProduct, createProductDescription } from '@/app/actions/product';
import { KeywordSelector, Keyword } from '@/components/keyword-selector';
import { Dictionary } from '@/utils/dictionaries';

interface ProductFormProps {
    dict: Dictionary;
}

export function ProductForm({ dict }: ProductFormProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // Analysis Data
    const [analysisData, setAnalysisData] = useState<{
        name: string;
        imageUrl: string;
        keywords: Keyword[];
    } | null>(null);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleFileSelect = (file: File) => {
        if (!file || !file.type.startsWith('image/')) return;
        setPreviewUrl(URL.createObjectURL(file));
        setSelectedImage(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedImage) {
            alert('Please select an image');
            return;
        }

        setIsLoading(true);

        try {
            console.log('Compressing image...', selectedImage.size);
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1024,
                useWebWorker: true
            };

            const compressedFile = await imageCompression(selectedImage, options);
            const formData = new FormData();
            formData.append('name', description);
            formData.append('image', compressedFile);

            const result = await analyzeProduct(formData);

            if (result.success && result.data) {
                setAnalysisData(result.data);
                setStep(2);
            }

        } catch (error) {
            console.error('Error analyzing product:', error);
            alert('Analysis failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalSubmit = async (selectedKeywords: Keyword[]) => {
        if (!analysisData) return;
        setIsLoading(true);
        try {
            await createProductDescription(
                analysisData.name,
                analysisData.imageUrl,
                analysisData.keywords,
                selectedKeywords
            );

            // Success & Reset
            setStep(1);
            setSelectedImage(null);
            setPreviewUrl(null);
            setDescription('');
            setAnalysisData(null);
            alert(dict.product.success);

        } catch (error) {
            console.error('Error creating product:', error);
            alert(dict.product.error);
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
                    <ArrowLeft className="mr-1 h-4 w-4" /> {dict.product.backBtn}
                </button>

                <h3 className="text-lg font-semibold text-zinc-900 mb-6">{dict.product.step2Title}</h3>

                <div className="mb-6 flex gap-4 rounded-lg bg-zinc-50 p-4">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-white">
                        <img src={analysisData.imageUrl} className="h-full w-full object-cover" />
                    </div>
                    <div>
                        <p className="font-medium text-zinc-900">{analysisData.name}</p>
                        <p className="text-sm text-zinc-500">{analysisData.keywords.length} {dict.product.keywordsFound}</p>
                    </div>
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
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">{dict.product.addTitle}</h3>
            <form onSubmit={handleAnalyze} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                        {dict.product.contextLabel}
                    </label>
                    <textarea
                        rows={3}
                        className="w-full rounded-md border border-zinc-300 p-3 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        placeholder={dict.product.contextPlaceholder}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                        {dict.product.imageLabel}
                    </label>
                    <div
                        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${isDragging
                                ? 'border-zinc-900 bg-zinc-100'
                                : 'border-zinc-300 bg-zinc-50 hover:bg-zinc-100'
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {previewUrl ? (
                            <div className="relative w-full aspect-video">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="h-full w-full object-contain rounded-md"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPreviewUrl(null);
                                        setSelectedImage(null);
                                    }}
                                    className="absolute top-2 right-2 rounded-full bg-white p-1 shadow-md hover:bg-zinc-100"
                                >
                                    <span className="sr-only">Remove</span>
                                    <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <label className="flex cursor-pointer flex-col items-center justify-center w-full h-full">
                                <Upload className="mb-2 h-8 w-8 text-zinc-400" />
                                <span className="text-sm text-zinc-500">{dict.product.uploadText}</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </label>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !description || !selectedImage}
                    className="flex w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {dict.product.analyzingBtn}
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            {dict.product.nextBtn}
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
