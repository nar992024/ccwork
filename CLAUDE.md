# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 목적

React 19 + TypeScript + Vite 기반의 **노트 앱 실습(강의용) 프로젝트**다. 노트의 생성/조회/수정/삭제(CRUD)를 다루며, 백엔드는 `json-server`로 대체한다. 학습 과정에서 기능을 점진적으로 확장하는 것이 의도다 — 예를 들어 `src/types/note.ts`에는 "강의에서 추가할 것"으로 표시된 `tags` 필드 자리표시 주석이 있다. 미완성으로 보이는 부분은 의도된 실습 여백일 수 있으니 임의로 채우기 전에 확인할 것.

## 명령어

| 명령어               | 설명                                     |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Vite(5173) + json-server(3001) 동시 실행 |
| `npm run server`     | json-server 단독 실행                    |
| `npm run build`      | `tsc` 타입 검사 후 Vite 프로덕션 빌드    |
| `npm run lint`       | ESLint 검사 + 자동 수정(`--fix`)         |
| `npm run format`     | Prettier 포맷                            |
| `npm test`           | Vitest 1회 실행                          |
| `npm run test:watch` | Vitest 워치 모드                         |

- 단일 테스트 실행: `npx vitest run <파일경로>` 또는 `npx vitest run -t "<테스트명>"`
- **앱은 API 서버(3001)가 떠 있어야 동작한다.** UI만 띄우면 노트 로딩이 실패하므로 항상 `npm run dev`로 둘 다 실행할 것.
- 테스트 파일은 아직 없다(`*.test.tsx` 패턴으로 추가). Vitest 설정은 `vite.config.ts`에 통합되어 있고 jsdom + `@testing-library` + `jest-dom`(`src/test-setup.ts`)을 사용한다.

### Git 훅 (커밋 전 자동 검사)

- **husky + lint-staged**로 커밋 시 pre-commit 훅이 자동 실행된다(`.husky/pre-commit` → `npx lint-staged`).
- **스테이징된 파일만** 처리한다(`package.json`의 `lint-staged` 설정): `*.{ts,tsx}`는 `eslint --fix` + `prettier --write`, `*.{json,css,md,html}`는 `prettier --write`.
- 린트 오류로 수정이 불가능하면 커밋이 중단된다. 고친 뒤 다시 커밋할 것.
- 훅은 `npm install` 시 `prepare` 스크립트(`husky`)로 자동 설치되므로 별도 설정이 필요 없다.
- 긴급 시 `git commit --no-verify`로 우회할 수 있으나 상시 사용은 지양한다.

### 커밋 메시지 규칙 (commitlint)

- **commit-msg 훅**(`.husky/commit-msg`)이 `commitlint`로 메시지 형식을 검증한다. 규칙 위반 시 커밋이 거부된다.
- 형식: **`type: 설명`** 또는 `type(scope): 설명` (예: `feat: 노트 검색 기능 추가`). 설명은 한국어로 쓴다.
- 허용 type: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert` `init` (`commitlint.config.mjs`에서 관리).
- 제목 끝 마침표 금지, 최대 100자. 제목 대소문자 규칙은 한국어 허용을 위해 비활성화됨.
- 규칙 수정은 `commitlint.config.mjs`에서 한다.

## 아키텍처

데이터 흐름은 단방향 3계층이다:

```
컴포넌트 ── useNotes() ──> NotesContext ── api 함수 ──> json-server(db.json)
```

1. **API 계층 (`src/api/notes.ts`)** — `fetch` 기반 CRUD 함수(`fetchNotes`/`createNote`/`updateNote`/`deleteNote`). `API_URL`은 `http://localhost:3001` 하드코딩. `createdAt`/`updatedAt` 타임스탬프는 **여기서** 서버 전송 직전에 채운다(컴포넌트가 아님).

2. **상태 계층 (`src/context/NotesContext.tsx`)** — 유일한 전역 상태 소스. `notes`/`loading`/`error`를 보유하고 `createNote`/`updateNote`/`deleteNote`를 노출한다. 핵심 패턴: **API 호출 성공 후 서버 응답으로 로컬 `notes` 배열을 갱신**한다(낙관적 업데이트 아님). 모든 컴포넌트는 `useNotes()` 훅으로 접근하며, 이 훅은 Provider 밖에서 쓰면 throw 한다.

3. **UI 계층 (`src/components/`)** — `App.tsx`가 "어떤 노트가 선택/생성 중인지"를 로컬 state(`selectedNoteId`, `isCreating`)로 관리하고 `Layout`에 사이드바/메인을 슬롯으로 주입한다. 컴포넌트는 데이터를 props로 받지 않고 대부분 `useNotes()`로 직접 가져온다. `NoteEditor`는 선택 노트 변경 시 `useEffect`로 폼을 동기화한다.

### 상태 관리 규칙

- **새 상태는 `NotesContext`에 추가**한다. props drilling 대신 `useNotes()` 사용.
- "선택/편집 모드" 같은 **UI 전이 상태는 `App.tsx`의 로컬 state**로 둔다(Context에 넣지 않음).
- 노트 변경은 반드시 Context의 `createNote`/`updateNote`/`deleteNote`를 거친다. 컴포넌트에서 `api/notes.ts`를 직접 호출하지 말 것.
- **낙관적 업데이트(optimistic update)는 쓰지 않는다.** 항상 API 응답을 받은 뒤 로컬 배열을 갱신한다.

## 접근 주소

| 대상             | 주소                          |
| ---------------- | ----------------------------- |
| 앱(Vite dev)     | `http://localhost:5173`       |
| API(json-server) | `http://localhost:3001/notes` |

- API 베이스 URL은 `src/api/notes.ts`의 `API_URL` 상수에 하드코딩되어 있다(환경변수 미사용). 주소 변경 시 이 한 곳만 수정.

## 컴포넌트 구현 패턴

- **선언 방식**: `export function Xxx(props: XxxProps)` 형태의 named function export. props 인터페이스는 컴포넌트 파일 상단에 `<컴포넌트명>Props`로 정의한다.
- **두 가지 컴포넌트 종류가 공존한다**:
  - _Context 연결형_ — `useNotes()`로 데이터를 직접 가져온다 (`NoteList`, `NoteEditor`).
  - _순수 프레젠테이션형_ — 데이터와 콜백을 props로만 받는다 (`NoteItem`, `Layout`).
  - 새 컴포넌트를 만들 때 어느 쪽인지 먼저 정할 것. 재사용·테스트가 중요하면 프레젠테이션형, 화면 단위면 연결형.
- **합성(슬롯) 패턴**: `Layout`은 `sidebar`/`main`을 `ReactNode` props로 받아 배치만 담당한다.
- **상태 분기는 early return**으로 처리한다 — 로딩/에러/빈 목록/미선택 상태를 각각 조기 반환 (`NoteList`, `NoteEditor`).
- **폼 동기화**: `NoteEditor`는 로컬 `useState`로 입력을 관리하고, `selectedNoteId`/`isCreating` 변경 시 `useEffect`로 폼을 채운다(`exhaustive-deps`는 의도적으로 비활성화됨).

## API 호출 패턴

- 모든 함수는 `async`이며 `Promise<T>`를 반환한다.
- 실패 처리: `if (!res.ok) throw new Error(...)` — 호출부(Context)에서 try/catch로 잡는다.
- 쓰기 요청은 `headers: { 'Content-Type': 'application/json' }` + `body: JSON.stringify(...)`.
- **타임스탬프는 API 계층에서 주입한다** — `createNote`는 `createdAt`/`updatedAt`을, `updateNote`는 `updatedAt`을 전송 직전에 채운다.
- `deleteNote`는 `Promise<void>`(본문 없음), 나머지는 갱신된 `Note`를 반환한다.

## 네이밍 규칙

- **컴포넌트·타입**: PascalCase. 컴포넌트 파일도 PascalCase(`NoteItem.tsx`), 그 외 파일은 camelCase(`notes.ts`, `note.ts`).
- **CRUD 동사는 `create`/`update`/`delete`로 통일**한다(`add`/`edit`/`remove` 금지). API·Context 양쪽 모두 동일.
- **API 함수**: `동사+Note(s)` (`fetchNotes`, `createNote`, `updateNote`, `deleteNote`).
- **Context 액션**: API와 같은 동사 (`createNote`, `updateNote`, `deleteNote`).
- **이벤트 핸들러**: `handleXxx` (`handleSave`, `handleSelectNote`).
- **props 인터페이스**: `<컴포넌트명>Props`.

## 일관성 없는 패턴 (주의)

기존 코드에 혼재하는 부분 — 새 코드는 다수 패턴을 따르되, 손대는 김에 통일해도 좋다.

1. **export 방식**: `App.tsx`만 `export default`, 나머지 컴포넌트는 모두 named export. → 새 컴포넌트는 **named export** 권장.
2. **에러 메시지 언어**: API 계층은 영문(`'Failed to fetch notes'`), UI 계층은 한국어(`'저장에 실패했습니다'`)로 섞여 있다.
3. **데이터 접근 혼재**: `NoteList`는 `useNotes()`로 `deleteNote`를 꺼내 `NoteItem`에 `onDelete` props로 내려준다 — Context 직접 접근과 props 전달이 한 흐름에 섞여 있다.

## 스타일링

- **Tailwind CSS v4** — `@tailwindcss/vite` 플러그인 사용, `tailwind.config.js` 없음.
- 색상/폰트/반경 토큰은 `src/index.css`의 `@theme` 블록에 CSS 변수로 정의된다. `bg-card`, `text-muted-foreground`, `text-destructive`, `border-border` 등의 시맨틱 클래스는 **이 토큰에서 생성**된다. 새 색상이 필요하면 임의 값 대신 `@theme`에 토큰을 추가할 것.
- 디스플레이 폰트(`Boogaloo`), 본문 폰트(`Pretendard Variable`)는 외부 로드 가정.

## 규약

- 코드 주석·문서·커밋 메시지는 **한국어**, 변수/함수명은 **영어**.
- 들여쓰기 2칸, 세미콜론 사용, 작은따옴표 — `.prettierrc` 및 기존 코드 스타일을 따른다.
- 에러 처리는 **`console.error()`로만** 한다. `alert()`는 사용하지 않는다.
