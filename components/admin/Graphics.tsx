import React from 'react'

/**
 * `admin.components.graphics`: the name in type is the mark (PRODUCT.md ›
 * Brand Commitments), lowercase Lora as in the site header. Logo on the
 * login screen, Icon in the admin header.
 */
export const Logo = () => <span className='bk-wordmark'>роман бокланов</span>

export const Icon = () => (
  <span className='bk-wordmark bk-wordmark--icon' aria-label='роман бокланов'>
    рб
  </span>
)
