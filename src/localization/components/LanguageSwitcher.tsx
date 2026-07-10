'use client';

import { useTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

type language = { code: string; name: string; native_name: string };

export function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [languages, setLanguages] = useState<language[]>([]);
  const [currentLocale, setCurrentLocale] = useState('en');

  useEffect(() => {
    // Fetch supported languages from API
    fetch('/api/localization/languages')
      .then((res) => res.json())
      .then((data) => {
        if (data.languages) setLanguages(data.languages);
      })
      .catch(console.error);

    // Read initial locale from cookie
    const match = document.cookie.match(new RegExp('(^| )' + LOCALE_COOKIE_NAME + '=([^;]+)'));
    if (match) {
      setCurrentLocale(match[2]);
    }
  }, []);

  const onSelectChange = (nextLocale: string) => {
    startTransition(() => {
      document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale};path=/;max-age=31536000`;
      setCurrentLocale(nextLocale);
      // Refresh the route to apply the new locale server-side
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currentLocale} onValueChange={onSelectChange} disabled={isPending}>
        <SelectTrigger className="w-[120px] h-8 text-xs">
          <SelectValue placeholder="language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.native_name}
            </SelectItem>
          ))}
          {languages.length === 0 && (
            <SelectItem value="en">English</SelectItem>
          )}
        </SelectContent>
      </Select>
      {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
    </div>
  );
}
