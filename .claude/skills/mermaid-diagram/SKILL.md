---
name: mermaid-diagram
description: src/ 디렉토리를 분석해 컴포넌트 의존성과 상태 흐름을 Mermaid로 시각화하고, docs/architecture/index.html로 저장한 뒤 브라우저로 연다. 사용자가 "아키텍처 시각화", "구조 다이어그램", "의존성 그래프", "/mermaid-diagram" 등을 요청할 때 사용.
---

# Mermaid 아키텍처 다이어그램 생성

`src/` 디렉토리를 분석해 **컴포넌트 의존성 그래프**, **데이터 흐름도**, **상태 흐름도**를 Mermaid로 그리고,
단일 HTML 파일(`docs/architecture/index.html`)로 만들어 브라우저로 연다.

## 워크플로우

아래 5단계를 순서대로 수행한다.

### 1단계 — `src/` 분석

- `src/**/*.{ts,tsx}` 파일을 모두 찾아 각 파일의 `import` 문을 읽는다.
- **내부 모듈만** 노드로 삼는다(상대경로 import). `react`, `react-dom` 등 외부 패키지 import는 엣지에서 제외한다.
- 각 파일 = 노드 1개. 파일명에서 확장자를 뺀 이름을 노드 ID로 쓴다(예: `components/NoteItem.tsx` → `NoteItem`).
- `import` 방향대로 화살표를 만든다(`A`가 `B`를 import하면 `A --> B`).
- 노드를 다음 분류로 나누고 **분류별 색상**을 입힌다:
  - **진입점**: `main`, `App`
  - **상태 계층**: Context Provider/훅을 정의하는 파일 (예: `NotesContext`)
  - **연결형 컴포넌트**: Context 훅(`useNotes` 등)을 직접 호출하는 컴포넌트
  - **프레젠테이션형 컴포넌트**: 데이터/콜백을 props로만 받는 컴포넌트
  - **API/타입 계층**: `api/*`, `types/*`
- 분류는 코드를 실제로 읽어 판단한다(훅 호출 여부, props만 받는지 등). 프로젝트에 `CLAUDE.md`가 있으면 아키텍처 설명을 참고한다.

### 2단계 — 다이어그램 정의 작성

**① 컴포넌트 의존성 그래프 (필수, 가장 중요)**

- `graph TD` 사용. 1단계에서 추출한 노드/엣지를 그대로 표현.
- 분류별로 `classDef`를 정의하고 각 노드에 `class`를 부여해 색상 구분.
- 엣지는 실제 `import` 관계. 훅을 통한 구독은 점선(`-.->`)으로 구분해도 좋다.

**② 데이터 흐름도 (가능하면 추가)**

- `flowchart TD` 또는 `LR` 사용.
- **읽기와 쓰기 양방향을 모두 표현한다**(한쪽만 그리면 절반이 누락됨):
  - _읽기(최초 로드)_: 마운트 → `useEffect` → `fetch*` → 백엔드 → 성공/실패 분기 → 상태(`setX`/`setError`) → `loading=false`.
  - _쓰기(변경)_: 사용자 액션 → Context 액션 → API 함수 → 백엔드(POST/PATCH/DELETE) → 응답 → 상태 부분 갱신.
- 마지막에 상태 → `useNotes()` 등 구독을 통한 **리렌더**로 닫는다.
- 이 다이어그램은 import 그래프가 아니라 **런타임 데이터 흐름**이므로, 코드 동작(useEffect·로딩/에러 처리·낙관적 업데이트 여부)을 읽고 의미 기반으로 작성한다.

**③ 상태 흐름도 (가능하면 추가)**

- `stateDiagram-v2` 사용.
- 컴포넌트의 **로컬 UI 상태**와 **로딩/에러 상태**의 전이를 상태 머신으로 표현한다.
- 어떤 상태 변수 조합이 어떤 화면을 의미하는지 `note`로 주석을 단다(예: `selectedNoteId`/`isCreating` 조합 → 빈화면/작성중/편집중).
- **데이터 흐름도(②)와는 별개다.** ②는 데이터가 어디로 흐르는지, ③은 화면/UI가 어떤 상태들 사이를 오가는지를 보여준다. 한쪽이 다른 쪽을 대체하지 않으므로 둘 다 그린다.

### 3단계 — HTML 조립

- 아래 "HTML 템플릿"을 기반으로, `{{DIAGRAM_1}}`/`{{DIAGRAM_2}}`/`{{DIAGRAM_3}}` 자리에 1·2·3 Mermaid 정의를 삽입한다(섹션 3개).
- Mermaid는 **CDN(ESM)**으로 불러오므로 빌드/설치가 필요 없다. 파일을 브라우저로 열기만 하면 렌더된다.
- 생성 대상 프로젝트명과 다이어그램 제목을 채운다. (타임스탬프가 필요하면 `Date.now()` 대신 시스템에서 받은 현재 날짜를 문자열로 넣는다.)

### 4단계 — 저장

- `docs/architecture/index.html` 경로로 저장한다. 디렉토리가 없으면 Write가 생성한다.

### 5단계 — 브라우저 실행

- OS를 감지해 기본 브라우저로 결과 파일을 연다.

| OS      | 명령                                         |
| ------- | -------------------------------------------- |
| Windows | `Start-Process docs\architecture\index.html` |
| macOS   | `open docs/architecture/index.html`          |
| Linux   | `xdg-open docs/architecture/index.html`      |

- 현재 셸이 PowerShell(Windows)이면 `Start-Process`를 사용한다.

## HTML 템플릿

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{PROJECT_NAME}} — 아키텍처</title>
    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        font-family: system-ui, 'Pretendard Variable', sans-serif;
        margin: 0;
        padding: 2rem;
        line-height: 1.6;
        background: #f5f5f5;
        color: #1a2233;
      }
      h1 {
        font-size: 1.6rem;
        margin-bottom: 0.25rem;
      }
      .meta {
        color: #6b7280;
        font-size: 0.85rem;
        margin-bottom: 2rem;
      }
      section {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 1.5rem 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      }
      h2 {
        font-size: 1.1rem;
        margin-top: 0;
      }
      .desc {
        color: #6b7280;
        font-size: 0.9rem;
        margin-bottom: 1rem;
      }
      .mermaid {
        display: flex;
        justify-content: center;
      }
    </style>
  </head>
  <body>
    <h1>📐 {{PROJECT_NAME}} 아키텍처</h1>
    <p class="meta">생성: {{GENERATED_AT}} · 대상: src/</p>

    <section>
      <h2>① 컴포넌트 의존성 그래프</h2>
      <p class="desc">
        파일 간 import 관계. 색상은 계층(진입점·상태·연결형·프레젠테이션형·API/타입)을 나타냅니다.
      </p>
      <pre class="mermaid">
{{DIAGRAM_1}}
    </pre
      >
    </section>

    <section>
      <h2>② 데이터 흐름도</h2>
      <p class="desc">
        읽기(최초 로드)·쓰기(생성/수정/삭제) 양방향 데이터 흐름과 상태 갱신·리렌더.
      </p>
      <pre class="mermaid">
{{DIAGRAM_2}}
    </pre
      >
    </section>

    <section>
      <h2>③ 상태 흐름도</h2>
      <p class="desc">로딩/에러 및 에디터 화면(빈화면·작성중·편집중)의 UI 상태 전이.</p>
      <pre class="mermaid">
{{DIAGRAM_3}}
    </pre
      >
    </section>

    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
      mermaid.initialize({ startOnLoad: true, theme: 'default' });
    </script>
  </body>
</html>
```

## 참고용 예시 (이 프로젝트 기준)

컴포넌트 의존성 그래프 예:

```
graph TD
    main[main.tsx] --> App[App.tsx]
    App --> NotesContext[NotesContext]
    App --> Layout[Layout]
    App --> NoteList[NoteList]
    App --> NoteEditor[NoteEditor]
    NoteList --> NoteItem[NoteItem]
    NoteList -.useNotes.-> NotesContext
    NoteEditor -.useNotes.-> NotesContext
    NotesContext --> api[api/notes]
    NotesContext --> types[types/note]
    api --> types
    NoteItem --> types

    classDef entry fill:#dbeafe,stroke:#2563eb;
    classDef state fill:#fef3c7,stroke:#d97706;
    classDef connected fill:#dcfce7,stroke:#16a34a;
    classDef presentational fill:#f3e8ff,stroke:#9333ea;
    classDef data fill:#f1f5f9,stroke:#64748b;
    class main,App entry;
    class NotesContext state;
    class NoteList,NoteEditor connected;
    class NoteItem,Layout presentational;
    class api,types data;
```

데이터 흐름도 예:

```
flowchart LR
    user([사용자 액션]) --> editor[NoteEditor / NoteList]
    editor -->|createNote/updateNote/deleteNote| ctx[NotesContext]
    ctx -->|fetch| api[api/notes]
    api -->|HTTP :3001| server[(json-server / db.json)]
    server -->|응답| ctx
    ctx -->|setNotes| state[(notes 상태)]
    state -->|useNotes 구독| editor
```

상태 흐름도 예:

```
stateDiagram-v2
    [*] --> 로딩중
    로딩중 --> 오류: fetchNotes 실패
    로딩중 --> 빈화면: fetchNotes 성공
    빈화면 --> 작성중: + 새 노트
    빈화면 --> 편집중: 노트 선택
    작성중 --> 빈화면: 저장(생성) / 취소
    편집중 --> 작성중: + 새 노트
    편집중 --> 편집중: 저장(수정) / 다른 노트 선택
    편집중 --> 빈화면: 선택 노트 삭제
```

## 주의사항

- 자동 분석 결과이므로 컴포넌트를 추가/이동하면 스킬을 **다시 실행**해 갱신한다(수동 동기화).
- 외부 라이브러리 import는 노드에 넣지 않는다.
- 데이터 흐름도·상태 흐름도는 import 그래프가 아니라 런타임 동작이다 — 코드를 읽고 작성한다.
- **데이터 흐름도와 상태 흐름도는 서로 다른 관점이다.** 데이터가 흐르는 경로(②)와 UI가 머무는 상태(③)를 혼동하거나 한쪽으로 대체하지 않는다.
- 디렉토리 구조가 다른 프로젝트에서도 동작하도록, 노드 분류는 하드코딩하지 말고 실제 코드(훅 호출·props 사용)를 보고 판단한다.
