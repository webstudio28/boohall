"use client";

import { useEffect } from 'react';

// This component merely listens to server actions updating localStorage?
// No, Server Actions run on server. We cannot write to localStorage from server directly.
// We need a way to pass the debug info back to the client.
// Since we are not using a client component for the form submission, we can't easily intercept the return value in the form action prop.

// ALTERNATIVE: We can't easily push from Server Action to LocalStorage without a client intermediary.
// Simpler approach: 
// 1. Modify the server action to return the expanded keyword list.
// 2. But the server action is void in the current implementation <form action={...}>.

// Let's create a Client Component wrapper for the "Refresh Keywords" button.
// This wrapper will call the server action, get the result (we need to update the server action to return data), 
// and then save it to localStorage.

import { regenerateKeywords } from '@/app/(dashboard)/dashboard/actions';

export function RefreshKeywordsButton() {
    const handleRefresh = async () => {
        try {
            // We need to modify regenerateKeywords to return the payload
            // This requires changing the server action signature temporarily or permanently
            const result = await regenerateKeywords();

            if (result?.debugPayload) {
                localStorage.setItem('debug_last_keywords_payload', JSON.stringify(result.debugPayload));
                // Dispatch event to update the debug UI instantly
                window.dispatchEvent(new Event('debug-update'));
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <button
            onClick={handleRefresh}
            className="text-xs text-zinc-500 hover:text-black border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded px-2 py-1 transition-colors"
        >
            ↻ Refresh Keywords (Debug)
        </button>
    );
}
