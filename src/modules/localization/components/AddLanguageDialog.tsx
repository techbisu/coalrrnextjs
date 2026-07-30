'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { addLanguageAction } from '@/app/(dashboard)/admin/localization/actions';
import { toast } from 'sonner';

export function AddLanguageDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    native_name: '',
    direction: 'LTR',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.native_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    const result = await addLanguageAction(formData);
    
    if (result.success) {
      toast.success('Language added successfully');
      setOpen(false);
      setFormData({ code: '', name: '', native_name: '', direction: 'LTR' });
    } else {
      toast.error(result.message || 'Failed to add language');
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Language
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Language</DialogTitle>
          <DialogDescription>
            Register a new language for the platform. You can configure translations for this language once added.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Language Code (e.g., en, hi, bn) <span className="text-red-500">*</span></Label>
            <Input 
              id="code" 
              placeholder="e.g. bn" 
              value={formData.code}
              onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toLowerCase().trim() }))}
              maxLength={5}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="name">English Name <span className="text-red-500">*</span></Label>
            <Input 
              id="name" 
              placeholder="e.g. Bengali" 
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="native_name">Native Name <span className="text-red-500">*</span></Label>
            <Input 
              id="native_name" 
              placeholder="e.g. বাংলা" 
              value={formData.native_name}
              onChange={(e) => setFormData(p => ({ ...p, native_name: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="direction">Text Direction</Label>
            <Select 
              value={formData.direction} 
              onValueChange={(val) => setFormData(p => ({ ...p, direction: val }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LTR">Left to Right (LTR)</SelectItem>
                <SelectItem value="RTL">Right to Left (RTL)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Language'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
