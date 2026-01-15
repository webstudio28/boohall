"use client";

import { useState } from 'react';
import { User, CreditCard, Bell, Shield, X } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const tabs = [
    { name: 'Profile', icon: User, id: 'profile' },
    { name: 'Account', icon: Shield, id: 'account' },
    { name: 'Billing', icon: CreditCard, id: 'billing' },
    { name: 'Notifications', icon: Bell, id: 'notifications' },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState('profile');
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Window */}
            <div className="relative flex h-full max-h-[700px] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-zinc-900/5 transition-all transform scale-100">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 z-10 p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Sidebar */}
                <div className="w-64 flex-shrink-0 border-r border-zinc-200 bg-zinc-50 flex flex-col">
                    <div className="p-6 border-b border-zinc-200">
                        <h2 className="text-lg font-semibold text-zinc-900">Settings</h2>
                    </div>
                    <nav className="flex-1 space-y-1 p-4">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all
                                        ${isActive
                                            ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200'
                                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                                        }
                                    `}
                                >
                                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`} />
                                    {tab.name}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-white p-8">
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-zinc-900">Profile Settings</h3>
                                <p className="mt-1 text-sm text-zinc-500">Update your personal information.</p>
                            </div>
                            <div className="grid gap-6 max-w-lg">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700">Display Name</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                                        placeholder="Your Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700">Email Address</label>
                                    <input
                                        type="email"
                                        className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-zinc-900">Account Security</h3>
                                <p className="mt-1 text-sm text-zinc-500">Manage your password and security settings.</p>
                            </div>
                            <div className="max-w-lg">
                                <button className="inline-flex items-center px-4 py-2 border border-zinc-300 shadow-sm text-sm font-medium rounded-md text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none">
                                    Change Password
                                </button>

                                <div className="border-t border-zinc-200 pt-6 mt-6">
                                    <h4 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h4>
                                    <p className="text-sm text-zinc-500 mb-4">
                                        Permanently delete your account and all of your content. This action cannot be undone.
                                    </p>
                                    <button
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to delete your account? This will wipe ALL your data including articles, keywords, and business settings. This cannot be undone.")) {
                                                setIsDeleting(true);
                                                try {
                                                    const { deleteAccount } = await import('@/app/actions/account');
                                                    const result = await deleteAccount();
                                                    if (result.success) {
                                                        const { createClient } = await import('@/utils/supabase/client');
                                                        const supabase = createClient();
                                                        await supabase.auth.signOut();
                                                        window.location.href = '/login';
                                                    } else {
                                                        alert("Failed to delete account. Please try again.");
                                                    }
                                                } catch (e) {
                                                    console.error(e);
                                                    alert("An error occurred.");
                                                } finally {
                                                    setIsDeleting(false);
                                                }
                                            }
                                        }}
                                        disabled={isDeleting}
                                        className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none disabled:opacity-50"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete Account'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-zinc-900">Billing & Plans</h3>
                                <p className="mt-1 text-sm text-zinc-500">Manage your subscription and payment methods.</p>
                            </div>
                            <div className="rounded-lg border border-zinc-200 p-6 bg-zinc-50/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-zinc-900">Current Plan: Pro</p>
                                        <p className="text-sm text-zinc-500">$29/month, billed monthly</p>
                                    </div>
                                    <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                        Manage Subscription
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-zinc-900">Notifications</h3>
                                <p className="mt-1 text-sm text-zinc-500">Choose what you want to be notified about.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input type="checkbox" className="h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500" />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label className="font-medium text-zinc-700">Email Updates</label>
                                        <p className="text-zinc-500">Receive news and updates about new features.</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500" />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label className="font-medium text-zinc-700">Article Alerts</label>
                                        <p className="text-zinc-500">Get notified when article generation is complete.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
