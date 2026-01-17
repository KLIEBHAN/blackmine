import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { LoginForm } from './login-form'
import { getAppSettings } from '@/app/actions/settings'

export default async function LoginPage() {
  const session = await getSession()
  
  if (session) {
    redirect('/')
  }

  const settings = await getAppSettings()

  return <LoginForm instanceName={settings.instanceName} />
}
