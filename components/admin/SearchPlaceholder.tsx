'use client'

import { useEffect } from 'react'
import { useTranslation } from '@payloadcms/ui'

/**
 * Productions list (`beforeListTable`). Payload builds the search
 * placeholder from listSearchableFields but can't resolve the nested
 * `identity.title`, so it read «Поиск по URL-слаг». ponytail: sets the
 * DOM attribute once; React leaves it alone because its own prop never
 * changes. Drop when Payload resolves nested searchable fields.
 */
const SearchPlaceholder = () => {
  const { i18n } = useTranslation()
  useEffect(() => {
    document
      .querySelector('.collection-list--productions .search-filter__input')
      ?.setAttribute(
        'placeholder',
        i18n.language === 'ru'
          ? 'Поиск по названию или слагу'
          : 'Search by title or slug'
      )
  }, [i18n.language])
  return null
}

export default SearchPlaceholder
