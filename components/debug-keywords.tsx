"use client";

import { useState, useEffect } from 'react';

export function DebugKeywords() {
    const [lastPayload, setLastPayload] = useState<string[]>([]);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Read from localStorage on mount and when storage changes
        const update = () => {
            try {
                const data = localStorage.getItem('debug_last_keywords_payload');
                if (data) {
                    setLastPayload(JSON.parse(data));
                }
            } catch (e) {
                console.error(e);
            }
        };

        window.addEventListener('storage', update);
        // Also custom event support if we trigger it manually
        window.addEventListener('debug-update', update);

        // Initial load
        update();

        return () => {
            window.removeEventListener('storage', update);
            window.removeEventListener('debug-update', update);
        };
    }, []);

    if (!lastPayload.length) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
            <button
                onClick={() => setVisible(!visible)}
                className="bg-zinc-800 text-white text-xs px-3 py-1 rounded-full shadow hover:bg-zinc-700"
            >
                {visible ? 'Hide Debug' : 'Show Keyword Debug'}
            </button>

            {visible && (
                <div className="mt-2 bg-white border border-zinc-300 rounded-lg shadow-xl p-4 w-64 max-h-80 overflow-y-auto text-xs">
                    <h4 className="font-bold mb-2">Last Sent to API ({lastPayload.length})</h4>
                    <ul className="space-y-1 font-mono text-zinc-600">
                        {lastPayload.map((k, i) => (
                            <li key={i} className="border-b border-zinc-100 last:border-0 pb-1">
                                {i + 1}. {k}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
