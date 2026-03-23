---
name: react-vite-spa
description: React 18 + Vite + TanStack Query + React Router + Tailwind. Frontend SPA that consumes an external API.
---

# Stack Template: React SPA

## CLAUDE.md Tech Stack Section

```markdown
| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| Build | Vite 5 |
| Routing | React Router v6 |
| Data Fetching | TanStack Query v5 |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS 3 |
| HTTP Client | Axios |
| Testing | Vitest + Testing Library + Playwright |
| CI/CD | GitHub Actions → Vercel / Netlify |
```

## Folder Structure

```
src/
├── pages/              # Route-level page components
├── components/
│   ├── ui/             # Reusable primitives (Button, Input, etc.)
│   └── features/       # Feature-specific composite components
├── hooks/              # Custom hooks (useAuth, usePosts, etc.)
├── store/              # Zustand stores
├── lib/
│   ├── api.ts          # Axios instance with interceptors
│   ├── queryClient.ts  # TanStack Query config
│   └── utils.ts
├── types/              # TypeScript interfaces
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   └── dashboard/
└── main.tsx
```

## Required Environment Variables

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=MyApp
```

## Initial Setup Commands

```bash
npm create vite@latest . -- --template react-ts
npm install react-router-dom @tanstack/react-query axios zustand
npm install react-hook-form @hookform/resolvers zod
npm install tailwindcss @tailwindcss/forms lucide-react
npm install -D vitest @testing-library/react @testing-library/jest-dom playwright
npx tailwindcss init -p
```

## API Client Pattern

```typescript
// src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## Data Fetching Pattern

```typescript
// src/hooks/usePosts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: () => api.get('/posts').then(r => r.data.data),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostData) => api.post('/posts', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });
}
```

## Auth Store Pattern

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'auth' }
  )
);
```

## Performance Budget

- Total bundle: < 500KB
- Initial JS: < 200KB
- Use `React.lazy()` for route-level code splitting
- `loading="lazy"` on all images below the fold
