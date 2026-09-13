import { getBoxStyles } from '@/lib/data/boxes'

import { ConsultationForm } from './consultation-form'

export default async function ConsultationPage() {
  const boxStyles = await getBoxStyles()
  return <ConsultationForm boxStyles={boxStyles} />
}