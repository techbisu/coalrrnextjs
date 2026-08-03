import * as React from 'react'
import { DashboardView } from '@/shared/components/coalrr/views/DashboardView'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'Dashboard' })
  return {
    title: t('metadata.title'),
  }
}

export default function DashboardPage() {
  return <DashboardView />
}
