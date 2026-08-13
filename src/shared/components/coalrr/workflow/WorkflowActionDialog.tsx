'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { MessageSquare, Paperclip, Send, Loader2, Plus, Trash2, Lightbulb, AlertTriangle } from 'lucide-react';
import type { WorkflowTransitionOption } from '@/core/workflow/types/snapshot.types';

export interface WorkflowActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transition: WorkflowTransitionOption | null;
  onSubmitTransition: (payload: {
    transition: WorkflowTransitionOption;
    comments: string;
    attachmentFile?: File;
    recommendations?: Array<{
      targetType: 'MILESTONE' | 'CHECKLIST' | 'DOCUMENT_SIGNATURE' | 'WORKFLOW_ACTION';
      targetCode: string;
      mode: 'RECOMMENDED' | 'REQUIRED';
      reason?: string;
    }>;
  }) => Promise<void>;
}

export function WorkflowActionDialog({
  open,
  onOpenChange,
  transition,
  onSubmitTransition,
}: WorkflowActionDialogProps) {
  const [comments, setComments] = React.useState('');
  const [attachmentFile, setAttachmentFile] = React.useState<File | undefined>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showRecs, setShowRecs] = React.useState(false);

  const [recommendations, setRecommendations] = React.useState<
    Array<{
      targetType: 'MILESTONE' | 'CHECKLIST' | 'DOCUMENT_SIGNATURE' | 'WORKFLOW_ACTION';
      targetCode: string;
      mode: 'RECOMMENDED' | 'REQUIRED';
      reason?: string;
    }>
  >([]);

  React.useEffect(() => {
    if (open) {
      setComments('');
      setAttachmentFile(undefined);
      setShowRecs(false);
      setRecommendations([]);
    }
  }, [open]);

  if (!transition) return null;

  const isReturn = transition.name.includes('return') || transition.name.includes('reject');

  const handleAddRec = () => {
    setRecommendations((prev) => [
      ...prev,
      {
        targetType: 'MILESTONE',
        targetCode: 'SECTION_7_PUBLICATION',
        mode: 'REQUIRED',
        reason: '',
      },
    ]);
  };

  const handleRemoveRec = (index: number) => {
    setRecommendations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRecChange = (index: number, key: string, value: any) => {
    setRecommendations((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [key]: value } : r))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReturn && !comments.trim()) {
      return; // Return requires mandatory justification
    }

    try {
      setIsSubmitting(true);
      await onSubmitTransition({
        transition,
        comments,
        attachmentFile,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
      });
      onOpenChange(false);
    } catch (err) {
      console.error('[WorkflowActionDialog] Error submitting transition:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] border shadow-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isReturn ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            {transition.label}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Transitioning workflow from{' '}
            <span className="font-semibold text-slate-700">{transition.fromState}</span> to{' '}
            <span className="font-semibold text-slate-700">{transition.toState}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="comments" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              Justification & Review Notes {isReturn && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="comments"
              placeholder={
                isReturn
                  ? 'Please provide detailed reason for returning back...'
                  : 'Enter review notes or justifications (optional)...'
              }
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              required={isReturn}
              className="text-xs focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="file" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-slate-400" />
              Attach Verification PDF / Supporting Document
            </Label>
            <input
              id="file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.docx"
              onChange={(e) => setAttachmentFile(e.target.files?.[0])}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>

          {/* Collapsible Recommendations Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs font-semibold text-slate-700 p-0 h-auto hover:bg-transparent flex items-center gap-1.5"
                onClick={() => setShowRecs(!showRecs)}
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                {showRecs ? 'Hide Recommendations' : '+ Add Recommendation / Action Item'}
                {recommendations.length > 0 && (
                  <span className="ml-1 bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {recommendations.length}
                  </span>
                )}
              </Button>
              {showRecs && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddRec}
                  className="text-[11px] h-7 gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </Button>
              )}
            </div>

            {showRecs && (
              <div className="mt-3 space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {recommendations.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-2">
                    No recommendations added yet. Click "+ Add Item" to specify a required or recommended action.
                  </p>
                ) : (
                  recommendations.map((rec, index) => (
                    <div key={index} className="bg-white p-2.5 rounded-md border border-slate-200 text-xs space-y-2 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveRec(index)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600">Target Type</label>
                          <select
                            value={rec.targetType}
                            onChange={(e) => handleRecChange(index, 'targetType', e.target.value)}
                            className="w-full text-xs p-1 rounded border border-slate-200 bg-white"
                          >
                            <option value="MILESTONE">Milestone</option>
                            <option value="CHECKLIST">Checklist Item</option>
                            <option value="DOCUMENT_SIGNATURE">Document Signature</option>
                            <option value="WORKFLOW_ACTION">Workflow Action</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600">Target Code / Key</label>
                          <Input
                            value={rec.targetCode}
                            onChange={(e) => handleRecChange(index, 'targetCode', e.target.value)}
                            placeholder="e.g. SECTION_7_PUBLICATION"
                            className="text-xs h-7"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 items-center">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600 block mb-1">Mode</label>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`mode-${index}`}
                                checked={rec.mode === 'REQUIRED'}
                                onChange={() => handleRecChange(index, 'mode', 'REQUIRED')}
                                className="text-amber-600 focus:ring-amber-500"
                              />
                              <span className="text-[11px] font-medium text-amber-700 flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3 text-amber-500" /> Required
                              </span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`mode-${index}`}
                                checked={rec.mode === 'RECOMMENDED'}
                                onChange={() => handleRecChange(index, 'mode', 'RECOMMENDED')}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-[11px] font-medium text-blue-700 flex items-center gap-0.5">
                                <Lightbulb className="w-3 h-3 text-blue-500" /> Recommended
                              </span>
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-600">Reason / Notes</label>
                          <Input
                            value={rec.reason || ''}
                            onChange={(e) => handleRecChange(index, 'reason', e.target.value)}
                            placeholder="Reason for recommendation..."
                            className="text-xs h-7"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || (isReturn && !comments.trim())}
              className={`${
                isReturn ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              } text-white text-xs font-medium gap-1.5`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Confirm & Execute
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
