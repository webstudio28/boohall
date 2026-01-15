import { createClient } from '@/utils/supabase/server';
import { ServiceForm } from '@/components/service-description/service-form';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { cookies } from 'next/headers';
import { dictionaries, Lang } from '@/utils/dictionaries';

export default async function ServiceDescriptionPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div className="p-8">Please log in to view this page.</div>;
    }

    const { data: services } = await supabase
        .from('service_descriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    // Language logic
    const cookieStore = await cookies()
    const lang = (cookieStore.get('NEXT_LOCALE')?.value || 'en') as Lang
    const dict = dictionaries[lang] || dictionaries.en

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{dict.service.title}</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 lg:col-span-3">
                    <ServiceForm dict={dict} />
                </div>

                <div className="col-span-4">
                    <h3 className="mb-4 text-xl font-semibold">{dict.service.yourServices}</h3>
                    {!services || services.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-zinc-200 p-8 text-center text-zinc-500">
                            {dict.service.noServices}
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
                            {services.map((service) => (
                                <Link
                                    href={`/service-description/${service.id}`}
                                    key={service.id}
                                    className="block overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-zinc-900 hover:ring-offset-2"
                                >
                                    <div className="flex aspect-video w-full items-center justify-center bg-zinc-100 p-6 text-zinc-300">
                                        <FileText className="h-12 w-12" />
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-semibold text-zinc-900">{service.name}</h4>
                                        <p className="mt-1 line-clamp-3 text-sm text-zinc-500">
                                            {service.description}
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {service.keywords && Array.isArray(service.keywords) && service.keywords.slice(0, 3).map((kw: any, i: number) => (
                                                <span key={i} className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800">
                                                    {typeof kw === 'string' ? kw : kw.keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
