import { Metadata } from 'next';
import { searchParamsCache } from '@/modules/localization/components/search-params';
import { SearchParams } from 'nuqs/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TranslationsTab } from '@/modules/localization/components/TranslationsTab';
import { LanguagesTab } from '@/modules/localization/components/LanguagesTab';
import { Languages, Globe } from 'lucide-react';

import { BackButton } from '@/components/ui/back-button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Localization Management | COALRR',
};

interface LocalizationPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminLocalizationPage({ searchParams }: LocalizationPageProps) {
  const { module: currentModule, search: currentSearch, page: currentPage } = await searchParamsCache.parse(searchParams);

  return (
    <Tabs defaultValue="translations" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-2">
          <BackButton iconOnly />
          <div>
            <h2 className="text-xl font-bold tracking-tight">Localization Management</h2>
            <p className="text-sm text-muted-foreground mt-1">Configure supported languages and manage cross-module translations.</p>
          </div>
        </div>

        <TabsList className="bg-slate-100/50 dark:bg-slate-900/50 border shrink-0">
          <TabsTrigger value="translations" className="gap-2">
            <Globe className="h-4 w-4" />
            Translations
          </TabsTrigger>
          <TabsTrigger value="languages" className="gap-2">
            <Languages className="h-4 w-4" />
            Languages
          </TabsTrigger>
        </TabsList>
      </div>

        <TabsContent value="translations" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <TranslationsTab 
            currentModule={currentModule} 
            currentSearch={currentSearch} 
            currentPage={currentPage} 
          />
        </TabsContent>

        <TabsContent value="languages" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <LanguagesTab />
        </TabsContent>
      </Tabs>
  );
}
