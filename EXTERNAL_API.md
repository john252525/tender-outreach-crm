# Внешний API: поиск тендеров → Magic → рассылка

Автоматизация полного цикла без UI: найти тендеры, прогнать анализ (документы → AI → поиск сайтов → сбор email), создать кампанию в Email Outreach и сразу запустить отправку.

## Аутентификация

Все запросы — с API-ключом в заголовке `Authorization`. Ключ создаётся в UI (раздел API-ключи) или через `POST /api/api-keys` (требует JWT). Формат ключа: `oak_…` — показывается один раз при создании.

```
Authorization: Bearer oak_xxxxxxxxxxxxxxxx...
```

API-ключ работает на всех эндпоинтах `/api/purchases/*` и `/api/outreach/*`. JWT-токены продолжают работать как раньше.

## Сценарий целиком

```bash
BASE="https://your-app.up.railway.app/api"
KEY="oak_..."

# 1. Поиск тендеров
curl -s "$BASE/purchases/search?objectInfo=обслуживание+лифтов&limit=10&sort=published_at_desc" \
  -H "Authorization: Bearer $KEY"
# → { "results": [ { "id": "...", "purchaseNumber": "...", ... } ], "searchQueryId": "..." }

# 2. Magic + кампания + запуск по нескольким тендерам (до 10 за вызов)
curl -s -X POST "$BASE/purchases/magic-approve" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{ "purchaseIds": ["id1", "id2", "id3"], "launch": true }'
```

## Эндпоинты

### `GET /purchases/search`

Параметры: `objectInfo`, `customer`, `owner`, `responsible`, `purchaseNumber`, `region`, `stage`, `publishedAfter`, `publishedBefore`, `priceGe`, `priceLe`, `sort`, `limit`, `skip`. Пустые не передавать.

Ответ: `{ results: Purchase[], debugUrl, searchQueryId }`. Из `results[].id` берутся идентификаторы для magic-approve.

### `POST /purchases/:purchaseId/magic-approve`

Серверная композиция всего пайплайна по одной закупке:

1. Подгрузка деталей закупки и списка документов (если ещё не загружены)
2. Парсинг текста всех неразобранных документов
3. AI-анализ → поисковый запрос + тема/текст письма (если AI-результат уже есть — переиспользуется, повторный вызов не тратит AI)
4. Веб-поиск сайтов поставщиков по запросу (существующие результаты переиспользуются)
5. Сбор email-адресов с каждого сайта
6. Создание списка лидов и кампании (`Тендер <номер>`) с шагом письма
7. При `launch: true` — запуск кампании и немедленная первая отправка

Тело: `{ "launch": true }` (опционально, по умолчанию `false` — кампания остаётся черновиком).

Ответ:

```json
{
  "purchaseId": "…",
  "purchaseNumber": "0123…",
  "status": "approved",          // approved | no_emails | error
  "campaignId": "…",             // присутствует при approved
  "emailsCount": 7,
  "docsParsed": 3,
  "docsTotal": 4,
  "sitesFound": 9,
  "subject": "Поставка …",
  "launched": true,
  "sent": 5,                      // писем ушло в первой отправке
  "warnings": ["Сайт https://…: Ошибка загрузки сайта…"]
}
```

Ошибки отдельных документов/сайтов не прерывают цикл — попадают в `warnings`. Жёстко падает только AI-шаг (без него нет ни поискового запроса, ни письма).

Если для кампании не выбрался почтовый аккаунт (нет дефолтного и активных больше одного), при `launch: true` кампания будет создана, но в `warnings` появится «Кампания создана, но не запущена: Выберите почтовые аккаунты» — аккаунт можно назначить в UI и запустить вручную, либо отметить аккаунт «По умолчанию» в разделе почтовых аккаунтов.

### `POST /purchases/magic-approve` (bulk)

Тело: `{ "purchaseIds": ["…", "…"], "launch": true }` — до 10 закупок за вызов, обрабатываются последовательно. Ошибка по одной закупке не валит остальные.

Ответ: `{ "results": [ MagicApproveResult, … ] }` — у упавших `status: "error"` и поле `error`.

⏱ Вызов синхронный и может идти несколько минут на пачке (AI + веб-поиск + парсинг сайтов на каждую закупку). Ставьте таймаут клиента с запасом (5–10 мин на 10 закупок).

### Управление кампанией после создания

Все под тем же ключом:

- `POST /outreach/campaigns/:id/launch` — запустить черновик
- `POST /outreach/campaigns/:id/send` — форсировать отправку очередной пачки
- `POST /outreach/campaigns/:id/pause` / `resume`
- `GET /outreach/campaigns/:id` — статус и статистика (`statsSent`, `statsReplied`, `statsBounced`)
- `GET /outreach/campaigns/:id/emails?page=1&limit=50&status=sent` — журнал писем

## Требования к настройкам

Magic-пайплайн использует настройки профиля пользователя-владельца ключа (или переменные окружения как fallback): `parserDocsUrl`/`PARSER_DOCS_URL`, `proxyUrl`/`PROXY_URL`, `aiUrl`/`AI_URL`, `aiPrompt`/`AI_PROMPT`, `searchApiUrl`/`SEARCH_API_URL`. Без них соответствующий шаг вернёт ошибку.

Чтобы кампании сразу выходили готовыми к запуску — отметьте почтовый аккаунт «По умолчанию» (или держите ровно один активный аккаунт).
