import { createClient } from '@/utils/supabase/server';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { SeoChecklistPanel } from '@/components/seo-checklist/seo-checklist-panel';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ProductDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div className="p-8">Please log in.</div>;
    }

    const { data: product } = await supabase
        .from('product_descriptions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (!product) {
        notFound();
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center space-x-4">
                <Link href="/product-description" className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-zinc-600" />
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">{product.name}</h2>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Image Section */}
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                    <div className="relative aspect-video w-full">
                        {product.image_url ? (
                            <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-contain"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-zinc-400">
                                No Image
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Section */}
                <div className="space-y-8">
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 mb-3">Generated Description</h3>
                        <div className="prose prose-zinc max-w-none rounded-lg bg-zinc-50 p-6 text-zinc-700 shadow-sm border border-zinc-100">
                            <p className="whitespace-pre-line">{product.description}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 mb-3">Identified Keywords</h3>
                        <div className="flex flex-wrap gap-2">
                            {product.keywords && Array.isArray(product.keywords) ? (
                                product.keywords.map((k: any, i: number) => {
                                    // Handle both simple string arrays and object arrays from DataForSEO
                                    const keywordText = typeof k === 'string' ? k : k.keyword;
                                    const volume = typeof k === 'object' && k.volume ? k.volume : null;

                                    return (
                                        <div key={i} className="inline-flex flex-col rounded-md border border-zinc-200 bg-white px-3 py-1.5 shadow-sm">
                                            <span className="text-sm font-medium text-zinc-900">{keywordText}</span>
                                            {volume !== null && (
                                                <span className="text-xs text-zinc-500">Vol: {volume}</span>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <span className="text-zinc-500">No keywords found.</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900 mb-3">SEO Checklist</h3>
                        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                            <SeoChecklistPanel seoMeta={(product as any).seo_meta} seoAudit={(product as any).seo_audit} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
