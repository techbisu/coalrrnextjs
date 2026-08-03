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
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { toast } from 'sonner'
import { createUserAction, updateUserAction, fetchTenantsAction } from '@/modules/admin/users/presentation/actions'
import { Plus } from 'lucide-react'

import { userSchema } from '@/core/validation/schemas/user.schema'
export function UserFormDialog({ mode, initialData, onSuccess, trigger }: { mode: 'create' | 'edit', initialData?: any, onSuccess: () => void, trigger?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [tenants, setTenants] = React.useState<{tenantId: string, tenantName: string}[]>([])

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      mobile: initialData?.mobile || '',
      tenant_id: initialData?.tenant_id || '',
      role: initialData?.role || 'VIEWER',
      designation: initialData?.designation || '',
    },
  })

  React.useEffect(() => {
    fetchTenantsAction().then(res => {
      if (res.data) {
        setTenants(res.data)
        if (mode === 'create' && res.data.length > 0 && !form.getValues('tenant_id')) {
          form.setValue('tenant_id', res.data[0].tenantId)
        }
      }
    })
  }, [mode, form])



  React.useEffect(() => {
    if (open && initialData) {
      form.reset({
        name: initialData.name || '',
        email: initialData.email || '',
        mobile: initialData.mobile || '',
        tenant_id: initialData.tenant_id || '',
        role: initialData.role || 'VIEWER',
        designation: initialData.designation || '',
      })
    } else if (open && !initialData) {
      form.reset({
        name: '', email: '', mobile: '', tenant_id: '', role: 'VIEWER', designation: ''
      })
    }
  }, [open, initialData, form])

  async function onSubmit(values: z.infer<typeof userSchema>) {
    setIsLoading(true)
    try {
      if (mode === 'create') {
        const result = await createUserAction(values)
        if (result.error) throw new Error(result.error)
        toast.success('User created successfully')
      } else {
        const result = await updateUserAction(initialData.id, values)
        if (result.error) throw new Error(result.error)
        toast.success('User updated successfully')
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
            Create User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New User' : 'Edit User'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Add a new user to the system.' : 'Modify user details.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+91..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              <FormField
                control={form.control}
                name="tenant_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant / Organization</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tenant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {tenants.map(t => (
                          <SelectItem key={t.tenantId} value={t.tenantId}>
                            {t.tenantName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Area Manager" {...field} />
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
