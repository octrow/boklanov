# Навыки с рынка: что добавить (2026-11-05)

Источник: `~/dev/jobs/data/corpus_roadmap.md` (11.5k вакансий, 2026-11-05) против [system-design](system-design.md) и [logic-map](logic-map.md). Берём только то, что нужно самому проекту; чего проект не требует — в «Отвергнуто». Сводка по всем репо: `~/dev/docs/skills-roadmap-report-2026-11-05.md`.

## Предложения

- [ ] **[typescript, playwright, github actions]** Ужесточить `strict`, добавить bundle-size budget в `build.yml` (уже в «Идеях», §8) и Playwright e2e на 3 локали (публичная страница + /admin). Главный TS-репо. Усилие M.
- [ ] **[postgresql, github actions]** Репетиция Neon PITR и проверка restore в `backup-db.yml` (уже в плане) — оформить как CI-джоб. Усилие S.

## Отвергнуто

- AWS/Terraform/Kafka: Vercel+Neon+R2, нагрузка 0.1 req/s.
- До всего этого — HIGH: `/api/r2-asset` POST/DELETE без auth.
