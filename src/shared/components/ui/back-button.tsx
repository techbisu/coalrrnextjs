'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  iconOnly?: boolean;
}

export function BackButton({ className, iconOnly = false, ...props }: BackButtonProps) {
  const router = useRouter();

  if (iconOnly) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("mt-0.5 shrink-0 text-muted-foreground hover:text-foreground h-8 w-8 -ml-2", className)}
        onClick={() => router.back()}
        title="Go back"
        {...props}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("gap-1.5 text-muted-foreground hover:text-foreground", className)}
      onClick={() => router.back()}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
}
