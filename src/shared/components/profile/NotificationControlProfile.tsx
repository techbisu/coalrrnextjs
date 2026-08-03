'use client'

import { useState, useTransition } from 'react'
import { toggleNotificationPreference, toggleOtpPreference } from '@/app/actions/notification.actions'

interface NotificationControlProps {
  userId: string;
  initialPreferences: { channel: string; is_enabled: boolean }[];
  initialOtpEnabled: boolean;
  globalOtpEnabled: boolean;
}

export function NotificationControlProfile({ 
  userId, 
  initialPreferences, 
  initialOtpEnabled,
  globalOtpEnabled
}: NotificationControlProps) {
  const [isPending, startTransition] = useTransition()
  
  // Local state for optimistic UI
  const [prefs, setPrefs] = useState(initialPreferences)
  const [otpEnabled, setOtpEnabled] = useState(initialOtpEnabled)

  const handleToggle = (channel: string) => {
    const existing = prefs.find(p => p.channel === channel)
    const currentStatus = existing ? existing.is_enabled : true // default true
    const newStatus = !currentStatus

    // Optimistic update
    setPrefs(prev => {
      const idx = prev.findIndex(p => p.channel === channel)
      if (idx >= 0) {
        const next = [...prev]
        next[idx].is_enabled = newStatus
        return next
      }
      return [...prev, { channel, is_enabled: newStatus }]
    })

    startTransition(async () => {
      await toggleNotificationPreference(userId, channel, newStatus)
    })
  }

  const handleOtpToggle = () => {
    const newStatus = !otpEnabled
    setOtpEnabled(newStatus)
    startTransition(async () => {
      await toggleOtpPreference(userId, newStatus)
    })
  }

  const getStatus = (channel: string) => {
    const pref = prefs.find(p => p.channel === channel)
    return pref ? pref.is_enabled : true // Default is true if no record exists
  }

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Security & Notifications</h3>
        <p className="text-sm text-gray-500 mt-1">Manage how you receive alerts and login.</p>
      </div>

      <div className="space-y-4">
        {/* OTP Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Two-Factor Authentication (OTP)</p>
            <p className="text-sm text-gray-500">Require an SMS OTP when logging in.</p>
            {!globalOtpEnabled && (
              <p className="text-xs text-amber-600 mt-1">Note: OTP is currently disabled globally by administrators.</p>
            )}
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={otpEnabled}
              onChange={handleOtpToggle}
              disabled={isPending}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* SMS Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">SMS Alerts</p>
            <p className="text-sm text-gray-500">Receive important updates via SMS.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={getStatus('SMS')}
              onChange={() => handleToggle('SMS')}
              disabled={isPending}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Email Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Email Alerts</p>
            <p className="text-sm text-gray-500">Receive reports and summaries via Email.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={getStatus('EMAIL')}
              onChange={() => handleToggle('EMAIL')}
              disabled={isPending}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

      </div>
    </div>
  )
}
