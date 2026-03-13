# ESLint + Prettier 설정 가이드

## 사용 도구

| 도구 | 버전 | 역할 |
|------|------|------|
| ESLint | 9.x | 코드 품질 검사 (TypeScript 규칙 포함) |
| Prettier | 3.x | 코드 포매팅 |
| typescript-eslint | 8.x | TypeScript 전용 ESLint 규칙 |
| eslint-plugin-prettier | 5.x | ESLint와 Prettier 통합 |

---

## ESLint 설정 (`eslint.config.mjs`)

```javascript
// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['eslint.config.mjs'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',   // any 타입 사용 금지
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
);
```

### 핵심 규칙
- **`@typescript-eslint/no-explicit-any`: `'error'`** — `any` 타입 사용 시 빌드 오류 발생. `unknown` + 타입 가드를 사용한다.
- `@typescript-eslint/no-floating-promises` — 처리되지 않은 Promise 경고
- `@typescript-eslint/no-unsafe-argument` — `any` 타입 인자 전달 경고

---

## Prettier 설정 (`.prettierrc`)

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 100
}
```

---

## TypeScript 설정 (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "target": "ES2023",
    "module": "nodenext",
    "moduleResolution": "nodenext"
  }
}
```

- **`"noImplicitAny": true`** — 타입을 명시하지 않은 암묵적 `any` 금지
- `"strictNullChecks": true` — null/undefined 안전 처리 강제

---

## 린트 실행 명령어

```bash
# 검사 + 자동 수정
pnpm lint

# Prettier 포매팅
pnpm format
```

---

## VS Code 통합

### 저장 시 자동 수정 (`.vscode/settings.json`)

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

### 권장 확장
- `dbaeumer.vscode-eslint` — ESLint 확장
- `esbenp.prettier-vscode` — Prettier 확장

---

## 자주 발생하는 오류 해결

### `no-explicit-any` 오류
```typescript
// ❌ 오류
function process(data: any) { ... }

// ✅ 해결: unknown + 타입 가드
function process(data: unknown) {
  if (typeof data === 'string') { ... }
}
```

### `no-floating-promises` 경고
```typescript
// ❌ 경고
app.listen(3000);

// ✅ 해결: await 또는 void
await app.listen(3000);
// 또는
void app.listen(3000);
```
