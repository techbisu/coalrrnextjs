import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function AdminLocalizationPage() {
  const translations = await db.translation_value.findMany({
    include: {
      language: true,
      translation_key: {
        include: { translation_module: true }
      }
    },
    orderBy: { updt_ts: 'desc' },
    take: 50
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Localization Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Translations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>language</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {translations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No translations found in the database.
                  </TableCell>
                </TableRow>
              ) : (
                translations.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.language.name}</TableCell>
                    <TableCell>{t.translation_key.translation_module.name}</TableCell>
                    <TableCell className="font-mono text-xs">{t.translation_key.key}</TableCell>
                    <TableCell>{t.value}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === 'approved' ? 'default' : 'secondary'}>
                        {t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
