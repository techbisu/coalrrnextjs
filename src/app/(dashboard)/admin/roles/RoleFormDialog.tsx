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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { createRoleAction, updateRoleAction } from '@/modules/admin/roles/presentation/actions'
import { Plus } from 'lucide-react'

import { roleSchema } from '@/core/validation/schemas/role.schema'
export function RoleFormDialog({ mode, initialData, onSuccess, trigger }: {
  mode: 'create' | 'edit'
  initialData?: any
  onSuccess: () => void
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: initialData?.name || '',
      display_name: initialData?.display_name || '',
      description: initialData?.description || '',
      is_system: initialData?.is_system || false,
    },
  })

  React.useEffect(() => {
    if (open && initialData) {
      form.reset({
        name: initialData.name || '',
        display_name: initialData.display_name || '',
        description: initialData.description || '',
        is_system: initialData.is_system || false,
      })
    } else if (open && !initialData) {
      form.reset({
        name: '', display_name: '', description: '', is_system: false,
      })
    }
  }, [open, initialData, form])

  async function onSubmit(values: z.infer<typeof roleSchema>) {
    setIsLoading(true)
    try {
      if (mode === 'create') {
        const result = await createRoleAction(values)
        if (result.error) throw new Error(result.error)
        toast.success('Role created successfully')
      } else {
        const result = await updateRoleAction(initialData.id, values)
        if (result.error) throw new Error(result.error)
        toast.success('Role updated successfully')
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
            Create Role
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Role' : 'Edit Role'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Add a new RBAC role to the system.' : 'Modify role details.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Key</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. system_admin" {...field} disabled={mode === 'edit'} />
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
                    <Input placeholder="e.g. System Administrator" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of the role..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {mode === 'create' && (
              <FormField
                control={form.control}
                name="is_system"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>System Role</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        System roles cannot be deleted.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            )}
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
