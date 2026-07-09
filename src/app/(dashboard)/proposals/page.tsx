import * as React from 'react'
import { AcquisitionView } from '@/modules/land-acquisition/components/AcquisitionView'
import { authorizeApi } from '@/core/authorization/middleware/authorize'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Land Acquisition - COALRR',
}

export default async function ProposalsPage() {
  const auth = await authorizeApi('acquisition.view')
  
  if (auth.error) {
    redirect('/')
  }

  return <AcquisitionView />
}
