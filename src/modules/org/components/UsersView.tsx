'use client'

import { useState } from 'react'
import { TransferUserDialog } from './TransferUserDialog'
import { Button } from '@/shared/components/ui/button'

// In a real app this data comes from a hook/API
const dummyUsers = [
  { id: '1', name: 'John Doe', role: 'admin', scope: 'HQ' },
  { id: '2', name: 'Jane Smith', role: 'clerk', scope: 'UNIT (M01)' }
]

export function UsersView() {
  const [transferUserId, setTransferUserId] = useState<string | null>(null)

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">User Organization Scopes</h2>
      
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Name</th>
            <th className="py-2">Role</th>
            <th className="py-2">Current Scope</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {dummyUsers.map(u => (
            <tr key={u.id} className="border-b">
              <td className="py-2">{u.name}</td>
              <td className="py-2">{u.role}</td>
              <td className="py-2">{u.scope}</td>
              <td className="py-2">
                <Button variant="outline" size="sm" onClick={() => setTransferUserId(u.id)}>
                  Transfer / Assign
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <TransferUserDialog 
        open={!!transferUserId} 
        onOpenChange={(open) => !open && setTransferUserId(null)} 
        userId={transferUserId}
        onSuccess={() => {
          // reload users
        }}
      />
    </div>
  )
}
