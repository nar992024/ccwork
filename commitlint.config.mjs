// 커밋 메시지 컨벤션 검증 설정 (Conventional Commits 기반)
// 형식: `type: 설명` 또는 `type(scope): 설명`  (예: feat: 검색 기능 추가)
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 허용할 type 목록 — 표준 type에 이 프로젝트에서 쓰는 init을 추가
    'type-enum': [
      2,
      'always',
      [
        'feat', // 새 기능
        'fix', // 버그 수정
        'docs', // 문서
        'style', // 포맷 (코드 동작 변화 없음)
        'refactor', // 리팩터링
        'perf', // 성능 개선
        'test', // 테스트
        'build', // 빌드 시스템/의존성
        'ci', // CI 설정
        'chore', // 기타 잡무
        'revert', // 되돌리기
        'init', // 초기 셋업
      ],
    ],
    // 제목 길이 제한 (한글은 글자당 폭이 넓으므로 100자로 여유 있게)
    'header-max-length': [2, 'always', 100],
    // 제목 끝에 마침표 금지
    'subject-full-stop': [2, 'never', '.'],
    // 제목 대소문자 규칙 비활성화 — 한글 설명을 허용하기 위함
    'subject-case': [0],
  },
};
