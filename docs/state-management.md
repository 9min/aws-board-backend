# 상태 관리 전략

## 상태 분류

| 구분 | 정의 | 예시 | 관리 도구 |
|------|------|------|----------|
| 서버 상태 | 서버(Supabase)에서 가져오는 비동기 데이터 | 할 일 목록, 사용자 프로필 | fetch + useState / TanStack Query |
| 클라이언트 상태 | 클라이언트에서만 존재하는 전역 상태 | 인증 정보, 테마 설정 | React Context / Zustand |
| UI 상태 | 특정 컴포넌트의 로컬 상태 | 모달 열림, 입력값 | useState / useReducer |

## 서버 상태 관리

### 기본 패턴: fetch + useState

간단한 프로젝트에서 사용한다.

```tsx
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Todo } from "@/types/todo";

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTodos() {
      const { data, error } = await supabase
        .from("todos")
        .select("id, title, is_completed, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setTodos(data);
      }
      setIsLoading(false);
    }
    fetchTodos();
  }, []);

  return { todos, isLoading, error };
}
```

### 권장 패턴: TanStack Query

복잡한 프로젝트에서는 TanStack Query를 사용한다. 캐싱, 자동 재시도, 백그라운드 리페칭을 지원한다.

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTodos, createTodo } from "@/services/todoService";

// 조회
export function useTodos() {
  return useQuery({
    queryKey: ["todos"],
    queryFn: getTodos,
  });
}

// 생성 + 캐시 무효화
export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}
```

### 선택 기준

| 기준 | fetch + useState | TanStack Query |
|------|-----------------|----------------|
| 데이터 종류 | 1~2개 단순 조회 | 다수의 데이터 소스 |
| 캐싱 필요 | 불필요 | 필요 |
| 로딩/에러 처리 | 직접 구현 | 자동 제공 |
| 실시간 리페칭 | 불필요 | 필요 |
| 러닝 커브 | 낮음 | 중간 |

## 클라이언트 상태 관리

### React Context

전역 상태가 1~2개이고 업데이트 빈도가 낮을 때 사용한다.

```tsx
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth는 AuthProvider 내에서 사용해야 합니다");
  }
  return context;
}
```

### Zustand

전역 상태가 3개 이상이거나 업데이트가 빈번할 때 사용한다.

```ts
// src/stores/useThemeStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "light" ? "dark" : "light",
        })),
    }),
    { name: "theme-storage" }
  )
);
```

### 선택 기준

| 기준 | React Context | Zustand |
|------|-------------|---------|
| 전역 상태 수 | 1~2개 | 3개 이상 |
| 업데이트 빈도 | 낮음 (인증, 테마) | 높음 (실시간 데이터) |
| 리렌더링 최적화 | 수동 (memo, useMemo) | 자동 (selector) |
| 미들웨어 | 없음 | persist, devtools 등 |
| 설정 복잡도 | Provider 래핑 필요 | Provider 불필요 |

## UI 상태 관리

| 도구 | 사용 시점 | 예시 |
|------|----------|------|
| `useState` | 단순 토글, 단일 값 | 모달 열림, 탭 선택 |
| `useReducer` | 복잡한 상태 로직, 여러 필드 연관 | 다단계 폼, 복합 필터 |

```tsx
// useReducer 예제: 복잡한 폼 상태
interface FormState {
  values: Record<string, string>;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

type FormAction =
  | { type: "SET_FIELD"; field: string; value: string }
  | { type: "SET_ERROR"; field: string; error: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_END" };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, values: { ...state.values, [action.field]: action.value } };
    case "SET_ERROR":
      return { ...state, errors: { ...state.errors, [action.field]: action.error } };
    case "SUBMIT_START":
      return { ...state, isSubmitting: true };
    case "SUBMIT_END":
      return { ...state, isSubmitting: false };
  }
}
```

## Supabase Realtime 구독과 상태 동기화

### 기본 구독 패턴

```tsx
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useTodoSubscription(onUpdate: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel("todos-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);
}
```

### TanStack Query 연동

Realtime 이벤트 수신 시 캐시를 무효화하여 최신 데이터를 가져온다.

```tsx
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useTodoRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("todos-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["todos"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
```

## stores/ 디렉토리 구조

- **Zustand 사용 시**: `src/stores/` 디렉토리에 스토어 파일을 배치한다.
- **React Context만 사용 시**: `src/contexts/` 디렉토리에 Context 파일을 배치한다.
- 파일 네이밍: `use[도메인]Store.ts` (예: `useThemeStore.ts`, `useCartStore.ts`)

```
# Zustand 사용 시
src/stores/
├── useThemeStore.ts
├── useCartStore.ts
└── useNotificationStore.ts

# React Context만 사용 시
src/contexts/
├── AuthContext.tsx
└── ThemeContext.tsx
```

## 관련 문서

- [프로젝트 구조](project-structure.md)
- [성능 최적화 가이드](performance-guide.md)
