'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth, useConfig } from '@payloadcms/ui'

/**
 * Who is signed in and «Выйти», top right next to the avatar
 * (`admin.components.actions`). Replaces the lone logout icon at the
 * bottom of the sidebar, which custom.scss hides: signing out belongs
 * with the session, not with navigation.
 */
const AccountActions: React.FC = () => {
  const { user } = useAuth()
  const { config } = useConfig()
  const logout = `${config.routes.admin}${config.admin.routes.logout}`

  if (!user) return null

  return (
    <div className='account-actions'>
      <span className='account-actions__who'>{user.email as string}</span>
      <Link href={logout} className='account-actions__logout'>
        Выйти
      </Link>
    </div>
  )
}

export default AccountActions
