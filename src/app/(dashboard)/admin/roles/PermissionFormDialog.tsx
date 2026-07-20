'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createPermissionAction, updatePermissionAction } from '@/modules/admin/roles/presentation/actions'
import { Plus } from 'lucide-react'

import { permissionSchema } from '@/core/validation/schemas/permission.schema'
export function PermissionFormDialog({ mode, initialData, onSuccess, trigger }: {
  mode: 'create' | 'edit'
  initialData?: any
  onSuccess: () => void
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<z.infer<typeof permissionSchema>>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      name: initialData?.name || '',
      display_name: initialData?.display_name || '',
      module: initialData?.module || '',
      group: initialData?.group || '',
      description: initialData?.description || '',
    },
  })

  React.useEffect(() => {
    if (open && initialData) {
      form.reset({
        name: initialData.name || '',
        display_name: initialData.display_name || '',
        module: initialData.module || '',
        group: initialData.group || '',
        description: initialData.description || '',
      })
    } else if (open && !initialData) {
      form.reset({
        name: '', display_name: '', module: '', group: '', description: '',
      })
    }
  }, [open, initialData, form])

  async function onSubmit(values: z.infer<typeof permissionSchema>) {
    setIsLoading(true)
    try {
      if (mode === 'create') {
        const result = await createPermissionAction(values)
        if (result.error) throw new Error(result.error)
        toast.success('Permission created successfully')
      } else {
        const result = await updatePermissionAction(initialData.id, values)
        if (result.error) throw new Error(result.error)
        toast.success('Permission updated successfully')
      }
      setOpen(false)
      onSuccess()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Permission
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Permission' : 'Edit Permission'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Add a new granular permission to the system.' : 'Modify permission details.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permission Key</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. acquisition.approve" {...field} disabled={mode === 'edit'} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Approve Acquisition" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="module"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Admin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Users" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
