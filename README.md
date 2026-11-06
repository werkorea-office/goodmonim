# 굿모님 (goodmonim.co.kr)

매일 아침 5문제 + 세대 추억 1문제. 세대 대항전, 연속 출석(보호막·이틀 기한), 나의 아침 나무, 자랑·초대 카드.

## 구조 (모두 Cloudflare 무료 요금제)

| 부분 | 위치 | 하는 일 |
|---|---|---|
| 화면 | `public/` | 사이트 전체. `app.js`가 화면과 기록, `bank.js`가 문제 은행 |
| 서버 | `functions/api/` | 참여 기록(`play`), 오늘 집계(`stats`), 방문·공유(`event`), 관리자 숫자(`admin/stats`) |
| 데이터베이스 | Cloudflare D1 `goodmonim-db` | 표는 첫 요청 때 자동으로 만들어짐 (`sql/` 참고) |
| 배포 | GitHub `main`에 올리면 Cloudflare Pages가 자동 배포 | 배포 전 문제 은행 검사(`npm run build`) |

## 매일 운영

할 일 없음. 날짜가 바뀌면 문제가 자동으로 바뀝니다.
- 속담 28일, 맞춤법 28일, 상식 21일 주기로 돌고, 두뇌 계산은 매일 새로 만들어집니다.
- 숫자 확인: `https://goodmonim.co.kr/admin` (관리자 키 필요)

## 설정값 (Cloudflare Pages > goodmonim > 설정)

| 이름 | 종류 | 내용 |
|---|---|---|
| `DB` | D1 바인딩 | `goodmonim-db` |
| `ADMIN_KEY` | 암호(Secret) | 관리자 화면 비밀번호 |

카카오톡 공유 버튼: `public/config.js`의 `kakaoKey`에 카카오 JavaScript 키를 넣고 올리면 켜집니다. 키가 없을 때는 휴대폰 공유창으로 카드 사진을 보냅니다.

## 문제 추가

`public/bank.js`에 같은 형식으로 추가 → `npm run check`로 검사 → 올리기.
정답이 확실한 사실만 넣습니다. 정치·종교·사건사고·실존 연예인 사생활은 넣지 않습니다.

## 지키는 원칙

- "치매 예방" 등 질병 효과 표현을 쓰지 않습니다.
- 이름·연락처·나이를 받지 않습니다. 기록은 기기 저장 + 익명 집계.
- 세대 순위·문제 정답률은 30명 이상 모였을 때만 보여 줍니다.
- "오늘 놓치지 마세요"는 정부 공식 사이트(go.kr)로만 연결합니다.

## 로컬 실행

```
npm install
npm run dev    # http://localhost:8788  (관리자 키: .dev.vars 의 ADMIN_KEY)
```
`?preview=1`을 붙이면 연속 출석 상황 바꿔 보기, 나무 단계 미리보기 도구가 나옵니다.
