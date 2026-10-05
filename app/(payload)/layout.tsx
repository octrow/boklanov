/* eslint-disable */
/**
 * Payload admin root layout. Standard boilerplate from
 * @payloadcms/next/layouts — owns the Payload-only subtree of routes:
 *   /admin/**  (UI)
 *   /api/**    (REST + GraphQL)
 *
 * Site routes live under /app/[locale]/** and are unaffected.
 */
import type { ServerFunctionClient } from 'payload'
import config from '@payload-config'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap'
import React from 'react'

import '@payloadcms/next/css'
import '../typography.css'
import './custom.scss'

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap
  })
}

const Layout = ({ children }: { children: React.ReactNode }) => (
  <RootLayout
    config={config}
    importMap={importMap}
    serverFunction={serverFunction}
  >
    {children}
  </RootLayout>
)

export default Layout

export { metadata } from '@payloadcms/next/layouts'
