# tasks-db

Google Apps Script для работы с Google Sheets файлом **Tasks**. Разработка на TypeScript,
сборка одним файлом через `bun build`, публикация через `clasp`.

## Стек

- **TypeScript** (строгий режим) + типы `@types/google-apps-script`
- **bun build** — бандл всех модулей `src/` в один `dist/Code.gs`
- **clasp** — пуш/деплой в проект Apps Script

## Структура

```
src/            исходники TS
build.ts        скрипт сборки (bun/esbuild) → dist/Code.gs + appsscript.json
dist/           результат сборки (в .gitignore)
appsscript.json манифест проекта (источник)
.clasp.json     конфиг clasp (rootDir=dist, scriptId — заполнить)
```

## Как это собирается

GAS не понимает ES-модули: все функции живут в одной глобальной области.
`bun build --format esm` даёт плоский вывод без обёртки, поэтому объявления
вроде `function onEdit(){}` попадают в глобал как есть — GAS их видит и цепляет
на триггеры. Строка `globalThis.onEdit = onEdit` в `src/main.ts` не даёт
tree-shaking выкинуть точку входа (внутри бандла её никто не зовёт).

**Новая точка входа** (триггер / пункт меню): объяви `function` в `src/main.ts`
и добавь `(globalThis as ...).<имя> = <имя>` в конце файла.

## Первый запуск

```sh
bun install
bun run login          # clasp login (OAuth в браузере, один раз)
```

Далее либо привязать существующий скрипт, либо создать новый:

```sh
# существующий: вписать scriptId в .clasp.json, затем
bunx clasp pull        # (опционально) забрать текущий код

# или новый контейнер-баунд скрипт под таблицу:
bunx clasp create-script --type sheets --title tasks-db --rootDir dist
```

`scriptId` берётся из URL редактора Apps Script (`.../projects/<scriptId>/edit`)
или из меню таблицы **Extensions → Apps Script → Project Settings**.

## Команды

| Команда             | Что делает                                |
|---------------------|-------------------------------------------|
| `bun run build`     | бандл `src/` → `dist/Code.gs` + манифест  |
| `bun run push`      | build + `clasp push -f` (публикация кода) |
| `bun run deploy`    | push + `clasp deploy` (версия/деплой)     |
| `bun run pull`      | забрать код из проекта                    |
| `bun run logs`      | логи выполнения                           |
| `bun run open`      | открыть проект в браузере                 |
```