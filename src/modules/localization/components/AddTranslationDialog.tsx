'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { addTranslationAction } from '@/app/(dashboard)/admin/localization/actions';
import { useRouter } from 'next/navigation';

interface AddTranslationDialogProps {
  modules: string[];
  languages: { id: string; name: string }[];
}

export function AddTranslationDialog({ modules, languages }: AddTranslationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [module, setModule] = useState('');
  const [newModule, setNewModule] = useState(''); // For entering a module not in the list
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [languageId, setLanguageId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalModule = module === 'new' ? newModule : module;

    if (!finalModule || !key || !value || !languageId) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addTranslationAction({
        module: finalModule,
        key,
        value,
        languageId,
      });

      if (result.success) {
        toast.success('Translation added successfully');
        setOpen(false);
        // Reset form
        setModule('');
        setNewModule('');
        setKey('');
        setValue('');
        setLanguageId('');
        router.refresh();
      } else {
        toast.error(result.message || 'Failed to add translation');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Translation Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Translation Key</DialogTitle>
          <DialogDescription>
            Create a new translation key for the platform. It will be available immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Module</Label>
            <Select value={module} onValueChange={setModule}>
              <SelectTrigger>
                <SelectValue placeholder="Select or create module" />
              </SelectTrigger>
              <SelectContent>
                {modules.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
                <SelectItem value="new">+ Create New Module</SelectItem>
              </SelectContent>
            </Select>
            {module === 'new' && (
              <Input 
                placeholder="Enter new module name" 
                value={newModule} 
                onChange={e => setNewModule(e.target.value)} 
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={languageId} onValueChange={setLanguageId}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Key</Label>
            <Input 
              placeholder="e.g. title, subtitle, error_message" 
              value={key} 
              onChange={e => setKey(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label>Value</Label>
            <Input 
              placeholder="Translation value" 
              value={value} 
              onChange={e => setValue(e.target.value)} 
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Translation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
