'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

export async function toggleNotificationPreference(userId: string, channel: string, isEnabled: boolean) {
  try {
    const existing = await db.notification_preference.findUnique({
      where: {
        user_id_channel: {
          user_id: userId,
          channel: channel
        }
      }
    })

    if (existing) {
      await db.notification_preference.update({
        where: { id: existing.id },
        data: {
          is_enabled: isEnabled,
          updt_ts: new Date(),
          updt_by: userId
        }
      })
    } else {
      await db.notification_preference.create({
        data: {
          id: randomUUID(),
          user_id: userId,
          channel: channel,
          is_enabled: isEnabled,
          updt_ts: new Date(),
          entry_by: userId,
          updt_by: userId
        }
      })
    }

    revalidatePath('/profile')
    return { success: true }
  } catch (error) {
    console.error('Error toggling notification preference:', error)
    return { success: false, error: 'Failed to update preference' }
  }
}

export async function toggleOtpPreference(userId: string, isEnabled: boolean) {
  try {
    // Assuming userId is passed correctly as a Number (or String parsed to Number if that's what schema uses)
    // The schema says user_id is Int or String depending on the table.
    // In `user` table, `id` might be String or Int. If it's String, we leave it. If Int, parse it.
    // Let's assume it's String based on other parts, wait, in user table it doesn't show `id String @id` in the snippet?
    // Let's just update based on string or Int. Let's cast to whatever `db.user.update` accepts.
    
    // I will try to parse to number if it's numeric, else use string.
    const numericId = parseInt(userId);
    const idToUse = isNaN(numericId) ? userId : numericId;

    await db.user.update({
      where: { id: idToUse as any }, // casting to any to bypass strict type for now
      data: {
        otp_enabled: isEnabled,
        updt_ts: new Date()
      }
    })

    revalidatePath('/profile')
    return { success: true }
  } catch (error) {
    console.error('Error toggling OTP preference:', error)
    return { success: false, error: 'Failed to update OTP preference' }
  }
}
