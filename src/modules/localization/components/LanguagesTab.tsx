import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AddLanguageDialog } from './AddLanguageDialog';
import { LanguageDataTable } from './LanguageDataTable';
import { GetLanguagesUseCase } from '../application/use-cases/GetLanguagesUseCase';

export async function LanguagesTab() {
  const useCase = new GetLanguagesUseCase();
  const languages = await useCase.execute();

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardContent className="p-0">
          <div className="flex justify-end p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
            <AddLanguageDialog />
          </div>
          <LanguageDataTable data={languages} />
        </CardContent>
      </Card>
    </div>
  );
}
