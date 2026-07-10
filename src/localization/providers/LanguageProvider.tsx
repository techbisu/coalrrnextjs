'use client';

import { NextIntlClientProvider } from 'next-intl';
import React from 'react';

type Props = {
  messages: any;
  locale: string;
  children: React.ReactNode;
};

export function LanguageProvider({ messages, locale, children }: Props) {
  return (
    <NextIntlClientProvider 
      messages={messages} 
      locale={locale} 
      timeZone="Asia/Kolkata"
      getMessageFallback={({namespace, key}) => key ? `${namespace}.${key}` : namespace!}
      onError={(error) => {
        if (error.code === 'MISSING_MESSAGE') return;
        console.error(error);
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}
