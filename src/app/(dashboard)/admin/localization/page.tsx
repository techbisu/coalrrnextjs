import { GetTranslationsUseCase } from '@/modules/localization/application/use-cases/GetTranslationsUseCase';
import { LocalizationDataTable } from '@/modules/localization/components/LocalizationDataTable';
import { LocalizationFilters } from '@/modules/localization/components/LocalizationFilters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Metadata } from 'next';
import { localizationConfig } from '@/core/config/localization.config';
import { searchParamsCache } from '@/modules/localization/components/search-params';
import { SearchParams } from 'nuqs/server';

export const metadata: Metadata = {
  title: 'Localization Management | COALRR',
};

interface LocalizationPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminLocalizationPage({ searchParams }: LocalizationPageProps) {
  const { module: currentModule, search: currentSearch, page: currentPage } = await searchParamsCache.parse(searchParams);

  const useCase = new GetTranslationsUseCase();
  const result = await useCase.execute({
    module: currentModule,
    search: currentSearch,
    page: currentPage,
    limit: localizationConfig.defaultPageSize,
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Localization Management</h1>
          <p className="text-muted-foreground mt-1">Manage cross-module translations and platform copy.</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
          <CardTitle className="text-lg">Translation Keys</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <LocalizationFilters 
            modules={result.modules} 
            currentModule={currentModule} 
            currentSearch={currentSearch} 
          />
          
          <LocalizationDataTable 
            data={result.translations} 
            total={result.total} 
            page={result.page} 
            totalPages={result.totalPages} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
