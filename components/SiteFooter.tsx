import { getTranslations } from 'next-intl/server'
import * as React from 'react'

import { Link } from '@/i18n/navigation'

import { SiteWordmark } from './SiteWordmark'
import styles from './SiteFooter.module.css'

const TELEGRAM_URL = 'https://t.me/roman7593'
const INSTAGRAM_URL = 'https://instagram.com/boklanovroman'

export async function SiteFooter() {
  const t = await getTranslations('nav')
  const tFooter = await getTranslations('footer')
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Col 1: Nav */}
        <nav className={styles.col} aria-label="Footer navigation">
          <Link href="/productions" className={styles.footerLink}>{t('productions')}</Link>
          <Link href="/about" className={styles.footerLink}>{t('about')}</Link>
          <Link href="/awards" className={styles.footerLink}>{t('awards')}</Link>
          <Link href="/press" className={styles.footerLink}>{t('press')}</Link>
          <Link href="/contact" className={styles.footerLink}>{t('contact')}</Link>
          <Link href="/archive" className={styles.footerLink}>{t('archive')}</Link>
        </nav>

        {/* Col 2: Social */}
        <div className={styles.col}>
          <a
            href={`mailto:boklanov.roman@mail.ru`}
            className={styles.footerLink}
          >
            boklanov.roman@mail.ru
          </a>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            Telegram
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            Instagram
          </a>
        </div>

        {/* Col 3: Copyright */}
        <div className={styles.col}>
          <span className={styles.copyright}>
            <SiteWordmark variant="footer" text={t('wordmark')} />
            {` · ${year}`}
          </span>
        </div>
      </div>

      {/* DA-1.C — Edition stamp (§3.H). Year-only colophon — no cities, no
          version mark. Static; changes only when the edition rolls over. */}
      <small className={styles.colophon}>
        {tFooter('colophon')}
      </small>
    </footer>
  )
}
