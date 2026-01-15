'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function LanguageToggle({ currentLang }: { currentLang: 'bg' | 'en' }) {
    const router = useRouter()
    const [lang, setLang] = useState(currentLang)

    const toggle = (newLang: 'bg' | 'en') => {
        setLang(newLang)
        document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000` // 1 year
        router.refresh()
    }

    return (
        <div className="flex items-center gap-2 text-sm">
            <button
                onClick={() => toggle('bg')}
                className={`px-2 py-1 rounded ${lang === 'bg' ? 'font-bold text-black' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
                BG
            </button>
            <span className="text-zinc-300">/</span>
            <button
                onClick={() => toggle('en')}
                className={`px-2 py-1 rounded ${lang === 'en' ? 'font-bold text-black' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
                EN
            </button>
        </div>
    )
}
