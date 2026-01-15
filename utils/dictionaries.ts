export const dictionaries = {
    bg: {
        landing: {
            title: "SEO Генератор на Статии",
            subtitle: "Съдържание, базирано на проучвания, което се класира.\nНе просто генератор. Машина за проучване, която пише.",
            ctaDashboard: "Към Таблото",
            ctaLogin: "Вход",
            footer: "MVP Версия v0.1"
        },
        onboarding: {
            title: "Настройка на вашия бизнес",
            subtitle: "Разкажете ни за вашия продукт, за да започнем проучването.",
            fields: {
                businessType: "Тип Бизнес",
                websiteUrl: "Уебсайт URL",
                targetCountry: "Целева Държава",
                language: "Език на съдържанието",
                description: "Описание на Продукта/Услугата",
                descriptionPlaceholder: "Опишете какво продавате и кои са вашите клиенти...",
                submit: "Започни Първоначално Проучване"
            },
            options: {
                saas: "SaaS",
                ecommerce: "Електронна търговия",
                agency: "Агенция",
                blog: "Блог",
                other: "Друго"
            }
        },
        dashboard: {
            title: "Табло",
            strategyFor: "Стратегия за",
            sections: {
                niche: "Нишов Анализ",
                summary: "Резюме",
                intentMix: "Микс от Намерения",
                angles: "Стратегически Ъгли",
                competitors: "Конкуренти",
                keywords: "Ключови Думи"
            },
            table: {
                keyword: "Ключова Дума",
                volume: "Обем",
                difficulty: "Трудност",
                intent: "Намерение",
                actions: "Действия",
                create: "Създай Статия",
                loading: "Проучване на ключови думи..."
            },
            empty: {
                competitors: "Все още не са намерени конкуренти.",
                angles: "Все още няма генерирани ъгли."
            }
        },
        editor: {
            back: "Обратно",
            saved: "Запазено",
            saving: "Запазване...",
            markdownInput: "Markdown Вход",
            preview: "Преглед на живо",
            export: "Експорт .md",
            generating: "AI анализира SERP и пише...",
            placeholder: "Започнете да пишете..."
        },
        common: {
            bg: "Български",
            en: "Английски"
        }
    },
    en: {
        landing: {
            title: "SEO Article Engine",
            subtitle: "Research-first AI content that can rank.\nNot a generator. A research engine that writes.",
            ctaDashboard: "Go to Dashboard",
            ctaLogin: "Login",
            footer: "MVP Release v0.1"
        },
        onboarding: {
            title: "Setup your business",
            subtitle: "Tell us about your product to let our AI engine do the research.",
            fields: {
                businessType: "Business Type",
                websiteUrl: "Website URL",
                targetCountry: "Target Country",
                language: "Content Language",
                description: "Main Product/Service Description",
                descriptionPlaceholder: "Describe what you sell and who your customers are...",
                submit: "Start Initial Research"
            },
            options: {
                saas: "SaaS",
                ecommerce: "Ecommerce",
                agency: "Agency",
                blog: "Blog",
                other: "Other"
            }
        },
        dashboard: {
            title: "Dashboard",
            strategyFor: "Strategy for",
            sections: {
                niche: "Niche Analysis",
                summary: "Summary",
                intentMix: "Intent Mix",
                angles: "Strategy Angles",
                competitors: "Competitors",
                keywords: "Keyword Opportunities"
            },
            table: {
                keyword: "Keyword",
                volume: "Volume",
                difficulty: "Difficulty",
                intent: "Intent",
                actions: "Actions",
                create: "Create Article",
                loading: "Researching keywords..."
            },
            empty: {
                competitors: "No competitors found yet.",
                angles: "No angles generated yet."
            }
        },
        editor: {
            back: "Back",
            saved: "Autosaved",
            saving: "Saving...",
            markdownInput: "Markdown Input",
            preview: "Live Preview",
            export: "Export .md",
            generating: "Analysing SERPs & Writing...",
            placeholder: "Start writing..."
        },
        common: {
            bg: "Bulgarian",
            en: "English"
        }
    }
}

export type Dictionary = typeof dictionaries.bg
export type Lang = 'bg' | 'en'
