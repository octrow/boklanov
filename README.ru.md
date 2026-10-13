# boklanov.com

[![Build](https://github.com/octrow/boklanov/actions/workflows/build.yml/badge.svg)](https://github.com/octrow/boklanov/actions/workflows/build.yml)
[![License: MIT (code)](<https://img.shields.io/badge/license-MIT%20(code)-blue.svg>)](license)

[English version](README.md)

Исходники [boklanov.com](https://boklanov.com), сайта-портфолио театрального режиссёра Романа Бокланова. Сайт
рассчитан на куратора фестиваля или худрука театра, который открывает его с телефона и у которого полторы минуты:
что Роман поставил, где спектакли гастролировали, какие у них награды и как спросить о гастролях.

Next.js 15 (App Router) и Payload CMS 3 в одном процессе, база Postgres, картинки на Cloudflare R2. Три языка
(EN, RU, DE), 56 спектаклей, Lighthouse 100/100/100/100 на проде (замер 2026-05-04).

![Главная на десктопе и на телефоне 390 px: градиентный логотип, бегущая строка городов, избранные спектакли](.github/assets/hero.webp)

## Что внутри

- **Админка Payload на `/admin`** для одного редактора без технического бэкграунда: под полями EN/DE виден русский
  оригинал, на главной админки список «Нужно доделать» (нет перевода, года или афиши), у каждого спектакля статус.
  Сохранение вызывает `revalidateTag`, страница обновляется через несколько секунд без пересборки.
- **Сначала афиша.** Карточки и страницы спектаклей начинаются с афиши, фото идут после.
- **Кнопка записи зависит от статуса**: «спросить о гастролях», «о новой постановке» или «о премьере». Она ведёт на
  страницу контактов, где ссылка в Telegram уже содержит первое сообщение про этот спектакль.
- **Картинки**: загрузка идёт через `/api/r2-asset`, который кладёт исходник в R2 и сразу печёт четыре размера AVIF.
  Сохранённые ширина и высота не дают галерее прыгать; LQIP-заглушки лежат рядом с каждым спектаклем.
- **Open Graph картинка на каждый спектакль** через `@vercel/og`.
- **SEO**: `hreflang`, sitemap с настоящим `lastmod` по каждому спектаклю, RSS на русском и английском.
- **Обслуживание в CI**: ночной зашифрованный бэкап базы, раз в квартал проверка битых ссылок на живом сайте.
- Свои шрифты (Lora, Inter, JetBrains Mono, Unbounded), две темы (тёмная по умолчанию и светлая «paper»).

![Страница спектакля: сначала афиша, потом название, стикер награды и таблица фактов](.github/assets/production.webp)

## Запуск локально

Нужны Node 22 и Docker. Так сайт поднимается на пустой базе, так же его собирает CI.

```bash
git clone https://github.com/octrow/boklanov.git && cd boklanov
npm install
cp .env.example .env              # задай PAYLOAD_SECRET: openssl rand -base64 48
docker compose up -d db           # Postgres 17 на localhost:5433
npm run payload -- migrate        # создать схему
npm run dev                       # http://localhost:3000, админка на /admin
```

При первом заходе на `/admin` Payload попросит создать пользователя. Для загрузки картинок нужны переменные R2/S3
из `.env.example`, остальной сайт работает без них.

```bash
npm test                          # eslint + prettier
npm run build                     # prebuild перегенерирует payload-types.ts и import map админки
```

## Структура

```
app/[locale]/        страницы: главная, спектакли, о Романе, награды, пресса, контакты, архив
app/(payload)/admin  админка Payload
app/api/             og-картинки, загрузка в r2-asset, revalidate
collections/ globals/ схемы Payload (Productions, About, Contact)
components/          React-компоненты + CSS-модули
lib/                 доступ к данным (Payload Local API), CDN, варианты картинок
messages/            строки интерфейса: en, ru, de
migrations/          миграции схемы Payload
scripts/ ops/        разовые скрипты для данных и обслуживания
```

Подробные заметки для разработчика (переменные окружения, модель контента, картинки, деплой, ограничения):
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md), на английском. Дизайн-система: [DESIGN.md](DESIGN.md).

## Лицензия

Код распространяется по [лицензии MIT](license). Фотографии, афиши, тексты и прочий контент принадлежат Роману
Бокланову и их авторам и под неё не попадают; не используйте их без разрешения.

Проект начинался как форк [nextjs-notion-starter-kit](https://github.com/transitive-bullshit/nextjs-notion-starter-kit)
Трэвиса Фишера, потом был переписан на Payload.
