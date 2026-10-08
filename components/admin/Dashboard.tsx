import React from 'react'
import type { AdminViewServerProps } from 'payload'
import { Gutter, Link } from '@payloadcms/ui'
import { toPlainText } from './plainText'
import { MAIN_TEXTS, isUntranslated } from './untranslated'
import LocalTime from './LocalTime'

/**
 * /admin (replaces Payload's card grid, which only repeated the sidebar).
 * Sections with counts, the status split, what still needs doing, and the
 * last edits. Everything is counted here on each visit: 55 productions,
 * one query. ponytail: count in SQL if the catalogue grows past ~500.
 *
 * "Untranslated" = a Main text filled in RU and empty in that language
 * (CONTEXT.md › Translation). Payload's list filters can't express that,
 * so the dashboard lists those productions itself.
 */

const STATUSES = ['live', 'on-tour', 'in-development', 'archived'] as const
type Status = (typeof STATUSES)[number]

type Lang = 'ru' | 'en'
type Localized = Partial<Record<'ru' | 'en' | 'de', unknown>>

type Row = {
  id: number | string
  slug?: string
  status?: string
  updatedAt: string
  identity?: Partial<Record<(typeof MAIN_TEXTS)[number], Localized>>
  production?: { year?: number | null }
  media?: { poster?: { src?: string | null } }
}

const COPY = {
  ru: {
    site: 'Открыть сайт',
    sections: 'Разделы',
    productions: 'Спектакли',
    about: 'О режиссёре',
    contact: 'Контакты',
    add: 'Добавить',
    edited: 'Изменено',
    statusesLabel: 'Спектакли по статусу',
    status: {
      live: 'Идёт',
      'on-tour': 'На гастролях',
      'in-development': 'В работе',
      archived: 'В архиве'
    } as Record<Status, string>,
    todo: 'Нужно доделать',
    noEn: 'Без английского перевода',
    noDe: 'Без немецкого перевода',
    noYear: 'Без года',
    noPoster: 'Без постера',
    aboutEmpty: 'Пустые разделы «О режиссёре»',
    allDone: 'Всё на месте.',
    recent: 'Недавно изменённые',
    page: 'Страница',
    production: 'Спектакль',
    count: (n: number, one: string, few: string, many: string) =>
      `${n} ${pluralRu(n, one, few, many)}`
  },
  en: {
    site: 'Open site',
    sections: 'Sections',
    productions: 'Productions',
    about: 'About page',
    contact: 'Contact',
    add: 'Add',
    edited: 'Edited',
    statusesLabel: 'Productions by status',
    status: {
      live: 'Live',
      'on-tour': 'On tour',
      'in-development': 'In development',
      archived: 'Archived'
    } as Record<Status, string>,
    todo: 'Still to do',
    noEn: 'Missing English',
    noDe: 'Missing German',
    noYear: 'No year',
    noPoster: 'No poster',
    aboutEmpty: 'Empty About-page sections',
    allDone: 'Nothing missing.',
    recent: 'Recently edited',
    page: 'Page',
    production: 'Production',
    count: (n: number, one: string, _few: string, many: string) =>
      `${n} ${n === 1 ? one : many}`
  }
}

const pluralRu = (n: number, one: string, few: string, many: string) => {
  const rule = new Intl.PluralRules('ru').select(n)
  return rule === 'one' ? one : rule === 'few' ? few : many
}

const text = (v: unknown) => toPlainText(v).trim()

const titleOf = (row: Row, lang: Lang) =>
  text(row.identity?.title?.[lang]) ||
  text(row.identity?.title?.ru) ||
  row.slug ||
  String(row.id)

const Dashboard = async ({ initPageResult, i18n }: AdminViewServerProps) => {
  const { req } = initPageResult
  const { payload, user } = req
  const lang: Lang = i18n.language === 'ru' ? 'ru' : 'en'
  const t = COPY[lang]
  const admin = payload.config.routes.admin
  const list = `${admin}/collections/productions`
  const doc = (id: Row['id']) => `${list}/${encodeURIComponent(String(id))}`

  const [productions, about, contact] = await Promise.all([
    payload.find({
      collection: 'productions',
      locale: 'all',
      depth: 0,
      pagination: false,
      overrideAccess: false,
      user,
      select: {
        slug: true,
        status: true,
        updatedAt: true,
        identity: Object.fromEntries(MAIN_TEXTS.map((k) => [k, true])),
        production: { year: true },
        media: { poster: { src: true } }
      }
    }),
    payload.findGlobal({
      slug: 'about',
      depth: 0,
      overrideAccess: false,
      user
    }),
    payload.findGlobal({
      slug: 'contact',
      depth: 0,
      overrideAccess: false,
      user
    })
  ])
  const rows = productions.docs as unknown as Row[]

  const byStatus = Object.fromEntries(
    STATUSES.map((s) => [s, rows.filter((r) => r.status === s).length])
  ) as Record<Status, number>
  const noEn = rows.filter((r) => isUntranslated(r, 'en'))
  const noDe = rows.filter((r) => isUntranslated(r, 'de'))
  const noYear = rows.filter((r) => r.production?.year == null).length
  const noPoster = rows.filter((r) => !r.media?.poster?.src).length
  // Rendered on the site only when filled, so an empty one is invisible.
  const aboutEmpty = [
    about.photos,
    about.milestones,
    about.lineage,
    about.marginalia
  ].filter((v) => !v?.length).length

  const recent = [
    ...rows.map((r) => ({
      key: `p-${r.id}`,
      href: doc(r.id),
      title: titleOf(r, lang),
      kind: t.production,
      at: r.updatedAt
    })),
    {
      key: 'about',
      href: `${admin}/globals/about`,
      title: t.about,
      kind: t.page,
      at: (about as { updatedAt?: string }).updatedAt
    },
    {
      key: 'contact',
      href: `${admin}/globals/contact`,
      title: t.contact,
      kind: t.page,
      at: (contact as { updatedAt?: string }).updatedAt
    }
  ]
    .filter((e): e is typeof e & { at: string } => Boolean(e.at))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5)

  const sections = [
    {
      key: 'productions',
      name: t.productions,
      href: list,
      meta: t.count(rows.length, 'спектакль', 'спектакля', 'спектаклей'),
      add: `${list}/create`
    },
    {
      key: 'about',
      name: t.about,
      href: `${admin}/globals/about`,
      meta: about.updatedAt ? (
        <>
          {t.edited} <LocalTime iso={about.updatedAt as string} lang={lang} />
        </>
      ) : null
    },
    {
      key: 'contact',
      name: t.contact,
      href: `${admin}/globals/contact`,
      meta: contact.updatedAt ? (
        <>
          {t.edited} <LocalTime iso={contact.updatedAt as string} lang={lang} />
        </>
      ) : null
    }
  ]

  const untranslated = [
    { key: 'en', label: t.noEn, docs: noEn, locale: 'en' },
    { key: 'de', label: t.noDe, docs: noDe, locale: 'de' }
  ]
  const filtered = [
    {
      key: 'year',
      label: t.noYear,
      n: noYear,
      href: `${list}?where[production.year][exists]=false`
    },
    {
      key: 'poster',
      label: t.noPoster,
      n: noPoster,
      href: `${list}?where[media.poster.src][exists]=false`
    },
    {
      key: 'about',
      label: t.aboutEmpty,
      n: aboutEmpty,
      href: `${admin}/globals/about`
    }
  ]
  const nothingToDo =
    noEn.length + noDe.length + noYear + noPoster + aboutEmpty === 0

  return (
    <Gutter className='bk-dash'>
      <header className='bk-dash__head'>
        <h1 className='bk-dash__title'>boklanov.com</h1>
        <a className='bk-dash__site' href='/' target='_blank' rel='noreferrer'>
          {t.site} <span aria-hidden>↗</span>
        </a>
      </header>

      <section aria-labelledby='bk-sections'>
        <h2 id='bk-sections' className='bk-dash__h2'>
          {t.sections}
        </h2>
        <ul className='bk-dash__sections'>
          {sections.map((s) => (
            <li key={s.key} className={`bk-section bk-section--${s.key}`}>
              <Link href={s.href} className='bk-section__link'>
                {s.name}
              </Link>
              {s.meta && <span className='bk-section__meta'>{s.meta}</span>}
              {s.add && (
                <Link
                  href={s.add}
                  className='bk-section__add'
                  aria-label={`${t.add}: ${s.name}`}
                >
                  + {t.add}
                </Link>
              )}
            </li>
          ))}
        </ul>
        <h3 id='bk-statuses' className='bk-dash__h3'>
          {t.statusesLabel}
        </h3>
        <ul className='bk-dash__statuses' aria-labelledby='bk-statuses'>
          {STATUSES.map((s) => (
            <li
              key={s}
              className={byStatus[s] ? undefined : 'bk-dash__status--zero'}
            >
              <Link href={`${list}?where[status][equals]=${s}`}>
                <span className={`status-badge status-badge--${s}`}>
                  {t.status[s]}
                </span>
                <span className='bk-dash__num'>{byStatus[s]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className='bk-dash__cols'>
        <section aria-labelledby='bk-todo'>
          <h2 id='bk-todo' className='bk-dash__h2'>
            {t.todo}
          </h2>
          {nothingToDo ? (
            <p className='bk-dash__empty'>{t.allDone}</p>
          ) : (
            <ul className='bk-todo'>
              {untranslated.map((u) =>
                u.docs.length === 0 ? null : (
                  <li key={u.key}>
                    <details className='bk-todo__details'>
                      <summary className='bk-todo__row'>
                        <span>{u.label}</span>
                        <span className='bk-dash__num'>{u.docs.length}</span>
                      </summary>
                      <ul className='bk-todo__docs'>
                        {u.docs.map((r) => (
                          <li key={r.id}>
                            <Link href={`${doc(r.id)}?locale=${u.locale}`}>
                              {titleOf(r, lang)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                )
              )}
              {filtered.map((f) =>
                f.n === 0 ? null : (
                  <li key={f.key}>
                    <Link href={f.href} className='bk-todo__row'>
                      <span>{f.label}</span>
                      <span className='bk-dash__num'>{f.n}</span>
                    </Link>
                  </li>
                )
              )}
            </ul>
          )}
        </section>

        <section aria-labelledby='bk-recent'>
          <h2 id='bk-recent' className='bk-dash__h2'>
            {t.recent}
          </h2>
          <ol className='bk-recent'>
            {recent.map((e) => (
              <li key={e.key}>
                <Link href={e.href} className='bk-recent__row'>
                  <span className='bk-recent__title'>{e.title}</span>
                  <span className='bk-recent__meta'>
                    {e.kind} · <LocalTime iso={e.at} lang={lang} />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Gutter>
  )
}

export default Dashboard
