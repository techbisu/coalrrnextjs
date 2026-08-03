import { GetTranslationsUseCase } from '@/modules/localization/application/use-cases/GetTranslationsUseCase';
import { LocalizationDataTable } from '@/modules/localization/components/LocalizationDataTable';
import { LocalizationFilters } from '@/modules/localization/components/LocalizationFilters';
import { AddTranslationDialog } from '@/modules/localization/components/AddTranslationDialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { localizationConfig } from '@/core/config/localization.config';

interface TranslationsTabProps {
  currentModule: string;
  currentSearch: string;
  currentPage: number;
}

export async function TranslationsTab({ currentModule, currentSearch, currentPage }: TranslationsTabProps) {
  const useCase = new GetTranslationsUseCase();
  const result = await useCase.execute({
    module: currentModule,
    search: currentSearch,
    page: currentPage,
    limit: localizationConfig.defaultPageSize,
  });

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
            <LocalizationFilters 
              modules={result.modules} 
              currentModule={currentModule} 
              currentSearch={currentSearch} 
            />
            <div className="shrink-0">
              <AddTranslationDialog modules={result.modules} languages={result.languages} />
            </div>
          </div>
          
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
