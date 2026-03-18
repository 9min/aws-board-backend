import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// 댓글 풀 - 주제별로 그럴듯한 댓글 모음
const commentPools: Record<number, string[]> = {
  // NestJS RESTful API
  2: [
    '정말 유익한 글이네요! NestJS 처음 배우는 중인데 많은 도움이 됐습니다.',
    '모듈 구조 설명이 너무 명확해요. 실제 프로젝트에 바로 적용해봤는데 잘 됩니다.',
    '가드(Guard)나 인터셉터 관련 내용도 다뤄주실 수 있나요?',
    'Express에서 NestJS로 마이그레이션 고민 중인데 이 글 덕분에 결심했어요.',
    'DI 개념이 처음엔 헷갈렸는데 이 글 보고 이해했습니다. 감사해요!',
  ],
  // Prisma ORM
  3: [
    'Prisma Studio도 정말 편하더라고요. DB 내용 시각적으로 확인할 수 있어서 좋아요.',
    'TypeORM에서 Prisma로 바꿨는데 체감 생산성이 2배는 올라간 것 같아요.',
    'relation 쿼리 할 때 include 옵션이 특히 편리하네요.',
    'Prisma의 타입 자동완성 덕분에 오타 실수가 확 줄었습니다.',
  ],
  // AWS S3 Presigned URL
  4: [
    'Presigned URL 만료 시간 설정도 같이 설명해주시면 좋겠어요!',
    '서버를 안 거치는 방식이라 대용량 파일도 문제없이 올라가네요. 좋은 방법이에요.',
    '멀티파트 업로드는 어떻게 구현하나요? 이어서 글 써주시면 감사하겠습니다.',
    'PUT 방식으로 올리니까 Content-Type 헤더 설정 꼭 해야 한다는 거 주의하세요!',
    'CloudFront와 같이 쓰면 CDN까지 붙일 수 있어서 금상첨화예요.',
  ],
  // JWT
  5: [
    'Refresh Token 전략도 같이 다뤄주시면 더 완성도 있는 글이 될 것 같아요.',
    'JWT payload에 민감한 정보는 절대 넣으면 안 된다는 것 꼭 명심해야죠.',
    '토큰 만료 시간을 너무 길게 잡으면 보안 취약점이 될 수 있어요.',
    '저는 access token 15분, refresh token 7일로 설정해서 쓰고 있어요.',
  ],
  // Docker Compose
  6: [
    'healthcheck 설정 추가하면 DB 준비 전에 앱이 실행되는 문제도 해결되더라고요.',
    '팀 프로젝트에서 이 방식 쓰니까 "내 컴엔 됐는데?" 소리가 사라졌어요 ㅋㅋ',
    'Redis 캐시 서버도 같이 compose에 넣어서 쓰고 있습니다. 정말 편해요.',
    'volumes 설정 안 하면 컨테이너 재시작 시 데이터 다 날아가니까 주의하세요!',
    'depends_on 옵션으로 서비스 실행 순서도 제어할 수 있어요.',
  ],
  // TypeScript strict
  7: [
    '처음에 strict 켜면 에러가 쏟아져서 당황했는데, 고치고 나니 훨씬 안정적이에요.',
    'noUncheckedIndexedAccess 옵션도 함께 켜면 배열 접근도 안전해져요.',
    '회사 레거시 프로젝트에 strict 적용하려다 포기했어요... 새 프로젝트엔 꼭 켜겠습니다.',
    'any 쓰고 싶을 때마다 unknown + 타입가드로 해결하는 습관 들이는 중이에요.',
  ],
  // class-validator
  8: [
    '@Transform 데코레이터와 같이 쓰면 입력값 변환도 한 번에 처리할 수 있어요.',
    '커스텀 validator 만드는 방법도 다뤄주시면 좋겠어요. 사용 케이스가 꽤 많더라고요.',
    'whitelist: true 옵션 꼭 켜야 불필요한 필드 주입을 막을 수 있어요.',
    '중첩 객체 검증할 때 @ValidateNested() + @Type() 콤보 필수입니다!',
    'DTO 재사용할 때 PickType, OmitType 유틸리티 클래스도 활용해보세요.',
  ],
  // GitHub Actions CI/CD
  9: [
    'pnpm cache 설정 추가했더니 빌드 시간이 절반으로 줄었어요.',
    'environment secrets 관리가 처음엔 헷갈렸는데 익숙해지니 편하네요.',
    'PR 올릴 때마다 자동으로 테스트 돌아가니까 코드 리뷰가 훨씬 수월해졌어요.',
    'matrix strategy 써서 여러 Node.js 버전에서 동시에 테스트하고 있어요.',
  ],
  // OWASP
  10: [
    'SQL Injection은 Prisma 쓰면 대부분 방어되는데, Raw query 쓸 때 조심해야 해요.',
    'rate limiting이 생각보다 중요한데 놓치기 쉽죠. 항상 적용하는 습관 들여야겠어요.',
    'A01 Broken Access Control이 요즘 1위더라고요. 인가 로직 꼼꼼히 챙겨야겠습니다.',
    'OWASP ZAP으로 자동 취약점 스캔도 CI에 포함시키면 더 좋아요.',
    '보안 헤더 설정도 Helmet으로 한 번에 처리하면 편합니다.',
  ],
  // PostgreSQL 인덱스
  11: [
    'EXPLAIN ANALYZE 써서 실행 계획 확인하는 습관이 정말 중요하더라고요.',
    '인덱스 너무 많이 만들면 INSERT/UPDATE 성능 저하된다는 것도 기억해야 해요.',
    'Partial Index 활용하면 특정 조건의 쿼리 성능을 크게 올릴 수 있어요.',
    '복합 인덱스 컬럼 순서가 쿼리 성능에 미치는 영향이 생각보다 크더라고요.',
  ],
  // React Query
  12: [
    'Zustand랑 조합해서 클라이언트 상태는 Zustand, 서버 상태는 React Query로 분리했어요.',
    'invalidateQueries 패턴 익히고 나서 캐시 관리가 정말 편해졌어요.',
    'Optimistic Update 구현했더니 UX가 눈에 띄게 좋아졌습니다.',
    'staleTime, cacheTime 개념 처음엔 헷갈렸는데 문서 꼼꼼히 읽으니 이해됐어요.',
    'React Query DevTools 개발할 때 정말 유용해요. 캐시 상태 한눈에 보여요.',
  ],
  // 페이지네이션
  13: [
    '무한스크롤 구현할 때는 Cursor 방식이 확실히 낫더라고요.',
    'Offset 방식은 페이지 중간에 데이터 추가되면 중복/누락 문제가 생기죠.',
    '저희 서비스는 데이터가 많지 않아서 Offset으로도 충분해요.',
    'Cursor 기반은 총 페이지 수 계산이 어렵다는 단점이 있죠.',
  ],
  // Swagger
  14: [
    '@ApiResponse 데코레이터로 에러 케이스도 문서화하면 더 완성도 높아져요.',
    'Bearer Auth 설정 추가하면 Swagger UI에서 바로 테스트할 수 있어서 편해요.',
    '프론트 개발자들이 Swagger 문서 보고 바로 개발하니까 협업 효율이 올라갔어요.',
    '@ApiTags로 API 그룹화하면 가독성이 많이 좋아지더라고요.',
    'openapi-generator로 타입 자동 생성해서 프론트에서 쓰고 있어요.',
  ],
  // ESLint Prettier
  15: [
    'husky + lint-staged 조합으로 커밋 전 자동 포맷팅 적용하고 있어요.',
    '팀에서 탭 vs 스페이스 논쟁이 Prettier 도입하고 완전히 사라졌어요 ㅋㅋ',
    'ESLint rule을 너무 많이 켜면 오히려 개발 흐름을 방해하더라고요. 적당히.',
    '코드 리뷰에서 스타일 관련 지적이 사라지니까 로직에만 집중할 수 있어요.',
  ],
  // Throttler
  16: [
    '로그인 API에는 더 엄격한 제한 걸어두는 게 좋더라고요. Brute Force 방지.',
    'Redis 기반 Throttler 쓰면 분산 서버 환경에서도 정확히 제한할 수 있어요.',
    '특정 IP에서 이상한 요청 폭탄이 왔는데 Rate Limit으로 바로 막혔어요.',
    '@SkipThrottle 데코레이터로 내부 API는 제외할 수 있어서 유연해요.',
    '응답 헤더에 남은 요청 횟수 넣어주면 클라이언트에서 핸들링하기 좋아요.',
  ],
  // EC2 배포
  17: [
    'PM2 ecosystem 파일로 환경별 설정 분리하니까 관리가 편해졌어요.',
    'Nginx에서 gzip 압축 켜두니까 응답 크기가 확 줄더라고요.',
    'ECS Fargate로 가면 EC2 관리 부담이 없어져서 좋다고 하던데 도전해봐야겠네요.',
    'SSL 인증서는 AWS Certificate Manager + ALB 조합이 제일 편했어요.',
  ],
  // Prisma Migrate
  18: [
    'shadow database 개념 처음 알았을 때 신기했어요. 개발 DB 따로 두는 이유가 있었군요.',
    '운영 DB migrate deploy 전에 항상 백업부터 하는 습관 들이세요. 정말 중요해요.',
    'Squash migration 기능으로 마이그레이션 파일 정리하는 거 편하더라고요.',
    'CI에 migrate deploy 자동화해두니까 배포 과정이 훨씬 깔끔해졌어요.',
    '실수로 컬럼 삭제하는 마이그레이션 날린 적 있는데... 항상 confirm 단계 두세요.',
  ],
  // TDD
  19: [
    '처음엔 시간이 더 걸리는 것 같아서 회의적이었는데, 리팩터링할 때 진가를 발휘하더라고요.',
    '테스트 커버리지보다 테스트의 질이 중요하다는 걸 TDD 하면서 배웠어요.',
    '레드-그린-리팩터 사이클 지키려고 노력하는데 쉽지 않네요.',
    '테스트 작성이 곧 설계라는 말이 이제야 이해돼요.',
  ],
  // HTTP 예외 처리
  20: [
    '403과 404 구분 잘 하는 게 중요한데, 보안 관점에서 리소스 존재 여부도 숨겨야 할 때가 있어요.',
    '에러 메시지에 스택 트레이스 포함하지 않는 것 프로덕션에선 필수예요.',
    '커스텀 에러 코드 체계 만들어두면 프론트에서 핸들링하기 훨씬 쉬워요.',
    'ValidationPipe의 exceptionFactory로 에러 포맷 커스터마이징하고 있어요.',
    '비즈니스 에러를 HTTP 상태 코드에 무리하게 맞추려다 설계가 이상해진 적 있어요.',
  ],
  // bcrypt
  21: [
    'saltRounds 10이 기본값인데, 서버 성능에 따라 조절할 수 있어요.',
    'argon2가 bcrypt보다 최신이고 더 안전하다고 하는데, 표준은 아직 bcrypt인 것 같아요.',
    'bcrypt 비교할 때 타이밍 어택 방지로 항상 compare 함수 써야 한다는 거 중요해요.',
    '레인보우 테이블 공격 때문에 솔트 꼭 써야 하는데 bcrypt는 자동으로 처리해주죠.',
  ],
  // Helmet
  22: [
    'CSP 헤더 설정이 까다롭긴 한데 XSS 방어에 정말 효과적이에요.',
    'X-Frame-Options로 클릭재킹 방어하는 거 잊기 쉬운데 Helmet이 자동으로 해줘서 편해요.',
    'Helmet의 각 미들웨어가 어떤 헤더를 설정하는지 한 번씩 확인해보길 추천해요.',
    '개발 환경에서 CSP 때문에 리소스 안 불러와서 당황한 적 있어요. 환경별 설정 주의하세요.',
    'HSTS 설정 켜면 한 번 HTTPS 접속한 뒤에 자동으로 HTTPS로 연결돼요.',
  ],
  // CORS
  23: [
    '프리플라이트 요청(OPTIONS) 처리 잊어서 삽질한 적 있어요.',
    'credentials: true 옵션은 origin을 * 로 설정하면 안 된다는 거 주의하세요.',
    '개발할 땐 localhost 허용하고 프로덕션에선 꼭 도메인 명시해야 해요.',
    'CORS 에러가 항상 서버 문제는 아니더라고요. 브라우저 캐시 때문인 경우도 있어요.',
  ],
  // Vite + React
  24: [
    'CRA 대비 개발 서버 실행 속도가 체감상 10배는 빠른 것 같아요.',
    'path alias 설정을 vite.config.ts와 tsconfig.json 둘 다 해줘야 한다는 거 주의!',
    'Vite proxy 설정으로 CORS 없이 API 호출하는 거 개발할 때 편하더라고요.',
    '빌드 결과물 크기도 작아서 배포 속도까지 빨라졌어요.',
    'HMR 덕분에 상태 유지하면서 수정 사항이 바로 반영돼요. 개발 경험이 확 달라요.',
  ],
  // 환경변수
  25: [
    '.env.example 파일 최신 상태로 유지하는 게 팀 협업에서 정말 중요해요.',
    'dotenv-safe 쓰면 필수 환경변수 누락 시 서버 시작 전에 바로 에러 내줘요.',
    'AWS Secrets Manager 써봤는데 키 로테이션도 자동으로 되어서 편해요.',
    '.gitignore에 .env 추가 까먹고 커밋했다가... 절대 하면 안 돼요.',
  ],
  // 댓글 기능
  26: [
    '저는 소프트 딜리트 방식으로 댓글 관리하고 있어요. 복구 요청 올 수 있거든요.',
    '대댓글까지 구현하려면 자기 참조 관계 설계가 필요해서 좀 복잡해지죠.',
    'Cascade 삭제 설정 덕분에 게시글 지울 때 댓글 일일이 안 지워도 돼서 편해요.',
    '댓글 많을 때 무한스크롤로 구현하면 UX가 훨씬 좋더라고요.',
    '실시간 댓글은 WebSocket이나 SSE 활용하면 좋은데 구현이 좀 복잡하죠.',
  ],
  // AWS RDS
  27: [
    'RDS Proxy 쓰면 Lambda 환경에서 connection pool 문제가 많이 해소돼요.',
    '자동 백업 활성화해두고 스냅샷 주기적으로 확인하는 습관 들이세요.',
    'Multi-AZ 설정하면 failover 시간이 확 줄어드는데 비용이 2배라 고민이에요.',
    'Performance Insights로 슬로우 쿼리 잡는 게 정말 편해졌어요.',
  ],
  // Jest 테스트
  28: [
    'Mock 너무 많이 쓰면 테스트가 실제 동작을 반영 못 하는 경우가 생겨요.',
    'coverage 100% 맞추는 것보다 중요한 로직 테스트하는 게 더 가치 있더라고요.',
    '@nestjs/testing의 Test.createTestingModule 처음엔 헷갈렸는데 익숙해지면 편해요.',
    'supertest로 E2E 테스트 짜두니까 API 스펙 변경 시 바로 알 수 있어서 좋아요.',
    'Jest의 --watch 모드로 TDD 사이클 돌리면 피드백이 빠르게 와서 좋아요.',
  ],
  // 레이어드 아키텍처
  29: [
    '서비스 레이어에 너무 많은 로직 몰아넣으면 파일이 커지는데 도메인 서비스로 분리해보세요.',
    'Repository 패턴 추가로 도입하면 테스트 시 DB 의존성 제거가 쉬워져요.',
    'Controller는 진짜 얇게 유지하는 게 좋더라고요. 비즈니스 로직은 Service에.',
    'DDD 적용하다가 오버엔지니어링 됐는데, 팀 규모에 맞는 아키텍처가 최고예요.',
  ],
  // Git Flow vs GitHub Flow
  30: [
    '저희 팀은 GitHub Flow로 바꿨는데 브랜치 관리가 훨씬 단순해졌어요.',
    '배포 주기가 빠른 서비스면 GitHub Flow가 확실히 더 맞는 것 같아요.',
    'Git Flow release 브랜치 관리하다가 머지 충돌 지옥 경험해보신 분...',
    '브랜치 전략보다 중요한 건 팀원 모두 같은 규칙을 따르는 것 같아요.',
    '모노레포 환경에선 trunk-based development도 고려해볼 만해요.',
  ],
  // HTTP 완전 정복
  31: [
    'PATCH와 PUT의 차이를 API 설계할 때 자꾸 헷갈리는데 이 글로 정리됐어요.',
    'idempotent 개념 이해하고 나서 API 설계가 훨씬 일관성 있어졌어요.',
    '상태 코드 201 vs 200 구분도 의외로 많이 틀리더라고요.',
    'HTTP/2 멀티플렉싱 덕분에 요청 병렬 처리가 얼마나 개선됐는지 신기해요.',
    'ETag, Last-Modified 활용한 캐시 전략도 같이 다뤄주시면 좋겠어요!',
  ],
};

// 기본 댓글 풀 (post ID에 해당하는 게 없을 때 사용)
const defaultComments = [
  '좋은 글 감사합니다! 많이 배워갑니다.',
  '실무에서 바로 적용해볼 수 있을 것 같아요.',
  '이 부분 오래 찾아다녔는데 여기서 해결됐네요. 감사해요!',
  '예제 코드가 있으면 더 이해하기 쉬울 것 같아요.',
  '다음 편도 기대하겠습니다!',
  '북마크 해뒀어요. 나중에 다시 읽을게요.',
  '입문자인데 이해하기 쉽게 설명해주셔서 감사해요.',
];

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pickRandom<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  return shuffle(arr).slice(0, count);
}

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });
  const posts = await prisma.post.findMany({ select: { id: true } });

  let totalComments = 0;

  for (const post of posts) {
    const pool = commentPools[post.id] ?? defaultComments;
    const selectedComments = pickRandom(pool, 3, 5);

    for (const content of selectedComments) {
      const author = users[Math.floor(Math.random() * users.length)];
      await prisma.comment.create({
        data: {
          content,
          postId: post.id,
          authorId: author.id,
        },
      });
      totalComments++;
    }
  }

  console.log(`✅ 게시글 ${posts.length}개에 댓글 총 ${totalComments}개 생성 완료`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
