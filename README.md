# Notes App

React 19 + TypeScript + Vite 기반 노트 앱 실습 프로젝트.

## 시작하기

```bash
# 저장소 클론
git clone git@github.com:frongt/ccwork.git
cd ccwork

# 의존성 설치
npm install

# 개발 서버 실행 (프론트 + JSON Server 동시 실행)
npm run dev
```

- 앱: http://localhost:5173
- API: http://localhost:3001/notes

## 스크립트

| 명령어           | 설명           |
| ---------------- | -------------- |
| `npm run dev`    | 개발 서버 실행 |
| `npm run build`  | 프로덕션 빌드  |
| `npm run lint`   | ESLint 검사    |
| `npm run format` | Prettier 포맷  |
| `npm test`       | 테스트 실행    |

## 프로젝트 구조

```
src/
├── api/          # JSON Server API 호출
├── components/   # UI 컴포넌트
├── context/      # React Context (전역 상태)
└── types/        # TypeScript 타입 정의
```

## Git 훅 (husky + lint-staged + commitlint)

커밋 시 코드 품질과 메시지 형식을 자동으로 검사합니다. `npm install` 시
`prepare` 스크립트로 훅이 자동 설치되므로 별도 설정은 필요 없습니다.

### pre-commit — 코드 검사

스테이징된 파일만 검사·자동 수정합니다 (`package.json`의 `lint-staged` 설정).

| 대상 파일              | 실행                                |
| ---------------------- | ----------------------------------- |
| `*.{ts,tsx}`           | `eslint --fix` → `prettier --write` |
| `*.{json,css,md,html}` | `prettier --write`                  |

### commit-msg — 커밋 메시지 컨벤션

`commitlint`가 [Conventional Commits](https://www.conventionalcommits.org/) 형식을 검증합니다.

```
type: 설명            # 예) feat: 노트 검색 기능 추가
type(scope): 설명     # 예) fix(editor): 저장 실패 처리
```

- **허용 type**: `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert` `init`
- 설명은 한국어로 작성, 제목 끝 마침표 금지, 최대 100자
- 규칙은 `commitlint.config.mjs`에서 수정

> 긴급 시 `git commit --no-verify`로 훅을 우회할 수 있으나 상시 사용은 지양합니다.
