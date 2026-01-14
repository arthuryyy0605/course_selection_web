# course-selection-frontend

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

## API 環境配置

在本地開發時，可以透過環境變數來切換 API 端點：

### 使用本地 API（預設）

不設定任何環境變數，或建立 `.env.local` 檔案：

```bash
# .env.local（此檔案不會被 git 追蹤）
VITE_API_BASE_URL=http://localhost:8000/api
```

### 使用線上 API 進行測試

建立 `.env.local` 檔案並設定：

```bash
# .env.local
VITE_API_BASE_URL=https://140.120.3.145/api
```

**注意：**
- 環境變數 `VITE_API_BASE_URL` 只在開發環境（`npm run dev`）生效
- 生產環境（`npm run build`）固定使用 `https://140.120.3.145/api`
- `.env.local` 檔案不會被 git 追蹤，可以安全地儲存個人配置

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
