import Link from "next/link";
import { dictionaries } from "@/utils/dictionaries";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get('NEXT_LOCALE')?.value as 'bg' | 'en') || 'bg';
  const dict = dictionaries[lang];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-20 font-sans">
      <main className="flex flex-col gap-8 items-center text-center max-w-2xl">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground whitespace-pre-line">
          {dict.landing.title}
        </h1>
        <p className="text-lg sm:text-xl text-zinc-600 whitespace-pre-line">
          {dict.landing.subtitle}
        </p>

        <div className="flex gap-4 items-center flex-col sm:flex-row mt-4">
          <Link
            href="/dashboard"
            className="rounded-full bg-foreground text-background px-8 py-3 text-sm sm:text-base font-medium hover:opacity-90 transition-opacity"
          >
            {dict.landing.ctaDashboard}
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-zinc-200 px-8 py-3 text-sm sm:text-base font-medium hover:bg-zinc-50 transition-colors text-zinc-600"
          >
            {dict.landing.ctaLogin}
          </Link>
        </div>
      </main>

      <footer className="absolute bottom-8 text-sm text-zinc-400">
        {dict.landing.footer}
      </footer>
    </div>
  );
}
