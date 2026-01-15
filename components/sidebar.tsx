"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Settings } from 'lucide-react';
import { cn } from '@/utils/cn'; // Assuming cn utility exists, otherwise I'll use simple string checks

// If cn doesn't exist, I'll fallback to simple joining or implement it inline? 
// I'll check utils first in next step if needed, but clsx/tailwind-merge is standard. 
// I'll use standard template literal for now to be safe.

const navigation = [
    { name: 'Processes', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Articles', href: '/articles', icon: FileText },
    // { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col fixed inset-y-0 z-50">
            <div className="flex flex-1 flex-col border-r border-zinc-200 bg-white">
                <div className="flex h-16 flex-shrink-0 items-center px-6 border-b border-zinc-200">
                    <span className="text-xl font-bold tracking-tight">Article Engine</span>
                </div>
                <nav className="flex-1 space-y-1 px-4 py-4">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                    group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                                    ${isActive
                                        ? 'bg-zinc-100 text-zinc-900'
                                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}
                                `}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-500'}`}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="flex flex-shrink-0 border-t border-zinc-200 p-4">
                    {/* User profile or other footer items can go here */}
                    <span className="text-xs text-zinc-400">v0.1.0</span>
                </div>
            </div>
        </div>
    );
}
