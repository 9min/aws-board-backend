import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const posts = [
  {
    title: 'NestJS로 RESTful API 서버 구축하기',
    content:
      'NestJS는 Node.js 기반의 프레임워크로, Angular의 아키텍처 패턴을 차용하여 강력한 백엔드 애플리케이션을 구축할 수 있게 해줍니다. 모듈, 컨트롤러, 서비스 구조를 통해 코드의 유지보수성을 높일 수 있습니다.',
  },
  {
    title: 'Prisma ORM으로 타입 안전한 데이터베이스 접근하기',
    content:
      'Prisma는 TypeScript와 완벽하게 통합되는 차세대 ORM입니다. 스키마 정의를 통해 자동으로 타입을 생성하고, 자동완성 기능을 지원하여 개발 생산성을 크게 향상시킵니다.',
  },
  {
    title: 'AWS S3 Presigned URL로 파일 업로드 구현하기',
    content:
      'Presigned URL 방식은 클라이언트가 서버를 거치지 않고 직접 S3에 파일을 업로드할 수 있게 해줍니다. 이를 통해 서버의 부하를 줄이고 대용량 파일도 효율적으로 처리할 수 있습니다.',
  },
  {
    title: 'JWT 인증 방식 완벽 정리',
    content:
      'JWT(JSON Web Token)는 클레임 기반의 토큰 인증 방식입니다. 헤더, 페이로드, 서명 세 부분으로 구성되며, 서버에서 별도의 세션 저장소 없이 인증 상태를 유지할 수 있습니다.',
  },
  {
    title: 'Docker Compose로 로컬 개발 환경 세팅하기',
    content:
      'Docker Compose를 활용하면 PostgreSQL, Redis 등 의존 서비스들을 한 번에 실행할 수 있습니다. 팀원 간 동일한 개발 환경을 보장하고 온보딩 시간을 크게 단축할 수 있습니다.',
  },
  {
    title: 'TypeScript strict 모드 활용 팁',
    content:
      'TypeScript strict 모드를 켜면 noImplicitAny, strictNullChecks 등 엄격한 타입 검사가 활성화됩니다. 초반에 불편할 수 있지만 런타임 오류를 사전에 방지하는 데 큰 도움이 됩니다.',
  },
  {
    title: 'class-validator로 DTO 유효성 검사 제대로 하기',
    content:
      'NestJS에서 class-validator 데코레이터를 활용하면 API 요청 바디를 손쉽게 검증할 수 있습니다. @IsString, @IsEmail, @MinLength 등 다양한 데코레이터를 조합해 안전한 API를 만들 수 있습니다.',
  },
  {
    title: 'GitHub Actions로 CI/CD 파이프라인 구축하기',
    content:
      'GitHub Actions는 코드 푸시, PR 생성 등의 이벤트에 자동으로 반응하여 테스트, 빌드, 배포를 자동화할 수 있습니다. YAML 파일로 워크플로우를 정의하고 다양한 마켓플레이스 액션을 활용할 수 있습니다.',
  },
  {
    title: 'OWASP Top 10 보안 취약점과 대응 방법',
    content:
      'OWASP Top 10은 웹 애플리케이션에서 가장 흔하게 발생하는 보안 취약점 목록입니다. SQL Injection, XSS, 인증 취약점 등을 이해하고 적절한 대응책을 적용하는 것이 중요합니다.',
  },
  {
    title: 'PostgreSQL 인덱스 최적화 전략',
    content:
      '데이터베이스 쿼리 성능을 향상시키려면 적절한 인덱스 전략이 필수입니다. B-tree, Hash, GIN 등 인덱스 유형의 차이를 이해하고 쿼리 패턴에 맞게 인덱스를 설계해야 합니다.',
  },
  {
    title: 'React Query로 서버 상태 관리하기',
    content:
      'React Query는 서버 상태를 선언적으로 관리할 수 있게 해주는 라이브러리입니다. 자동 캐싱, 백그라운드 리패칭, 낙관적 업데이트 등의 기능으로 UX를 크게 개선할 수 있습니다.',
  },
  {
    title: '게시판 서비스의 페이지네이션 구현 방법 비교',
    content:
      'Offset 기반과 Cursor 기반 페이지네이션은 각각 장단점이 있습니다. Offset은 구현이 단순하지만 대용량 데이터에서 성능 저하가 있고, Cursor 방식은 실시간 데이터에 적합하지만 구현이 복잡합니다.',
  },
  {
    title: 'Swagger로 API 문서 자동화하기',
    content:
      '@nestjs/swagger 패키지를 활용하면 컨트롤러와 DTO에 데코레이터를 추가하는 것만으로 자동으로 API 문서를 생성할 수 있습니다. 프론트엔드 개발자와의 협업이 훨씬 수월해집니다.',
  },
  {
    title: 'ESLint와 Prettier로 코드 스타일 통일하기',
    content:
      'ESLint는 코드 품질을 검사하고 Prettier는 코드 포맷을 통일합니다. 두 도구를 함께 사용하면 팀 전체의 코드 스타일을 일관되게 유지할 수 있습니다.',
  },
  {
    title: 'NestJS Throttler로 API Rate Limiting 구현',
    content:
      '@nestjs/throttler를 사용하면 간단한 설정만으로 API에 요청 횟수 제한을 걸 수 있습니다. DDoS 공격 방지와 서버 자원 보호에 효과적입니다.',
  },
  {
    title: 'AWS EC2에 NestJS 앱 배포하기',
    content:
      'EC2 인스턴스에 Node.js 환경을 세팅하고 PM2로 프로세스를 관리하면 안정적인 서버 운영이 가능합니다. Nginx를 리버스 프록시로 활용해 SSL 처리와 정적 파일 서빙을 분리하는 것이 좋습니다.',
  },
  {
    title: 'Prisma Migrate로 안전한 DB 스키마 변경하기',
    content:
      'Prisma Migrate는 스키마 변경 이력을 SQL 파일로 관리합니다. 개발 환경에서는 migrate dev, 운영 환경에서는 migrate deploy 명령으로 안전하게 마이그레이션을 적용할 수 있습니다.',
  },
  {
    title: 'TDD로 견고한 NestJS 서비스 만들기',
    content:
      'Test-Driven Development를 실천하면 테스트 코드를 먼저 작성하고 그것을 통과하는 최소한의 코드를 구현합니다. 이 방식은 설계를 개선하고 리팩터링에 대한 두려움을 없애줍니다.',
  },
  {
    title: 'HTTP 예외 처리와 일관된 에러 응답 설계',
    content:
      'NestJS의 HttpException 클래스와 글로벌 ExceptionFilter를 활용하면 모든 에러를 일관된 포맷으로 응답할 수 있습니다. 클라이언트가 예측 가능한 에러 처리를 할 수 있어 개발 편의성이 높아집니다.',
  },
  {
    title: 'bcrypt로 비밀번호 안전하게 저장하기',
    content:
      'bcrypt는 단방향 해시 함수로 비밀번호를 암호화하는 데 적합합니다. salt를 자동으로 처리하고 반복 횟수를 조절해 무차별 대입 공격에 강한 저장 방식을 구현할 수 있습니다.',
  },
  {
    title: 'Helmet.js로 Express 앱 보안 강화하기',
    content:
      'Helmet은 HTTP 헤더를 적절히 설정하여 XSS, Clickjacking 등 다양한 공격을 방어합니다. NestJS에서는 app.use(helmet())으로 간단하게 적용할 수 있습니다.',
  },
  {
    title: '프론트엔드와 백엔드의 CORS 설정 완벽 이해',
    content:
      'CORS(Cross-Origin Resource Sharing)는 브라우저의 보안 정책입니다. 서버에서 허용할 Origin을 명시적으로 설정하고, 필요한 메서드와 헤더를 허용해야 프론트엔드와 원활히 통신할 수 있습니다.',
  },
  {
    title: 'Vite + React + TypeScript 프로젝트 시작하기',
    content:
      'Vite는 빠른 빌드 속도와 HMR을 지원하는 현대적인 프론트엔드 빌드 도구입니다. React와 TypeScript를 조합하면 타입 안전하고 빠른 프론트엔드 개발 환경을 구축할 수 있습니다.',
  },
  {
    title: 'Node.js 환경변수 관리 베스트 프랙티스',
    content:
      '.env 파일로 로컬 설정을 관리하고, 프로덕션에서는 AWS Parameter Store나 Secrets Manager를 활용하는 것이 좋습니다. 절대로 환경변수를 코드에 하드코딩하거나 Git에 커밋해서는 안 됩니다.',
  },
  {
    title: '게시판 댓글 기능 구현 시 고려할 점',
    content:
      '댓글 기능을 구현할 때는 대댓글 지원 여부, 실시간 업데이트, 페이지네이션 방식 등을 미리 고려해야 합니다. Cascade 삭제 설정으로 게시글 삭제 시 댓글도 함께 정리되도록 해야 합니다.',
  },
  {
    title: 'AWS RDS PostgreSQL 연결 및 최적화',
    content:
      'RDS를 사용할 때는 Connection Pooling 설정이 중요합니다. Prisma의 connection_limit 파라미터를 Lambda나 ECS 환경에 맞게 조정하고, 보안 그룹 설정으로 접근 제어를 철저히 해야 합니다.',
  },
  {
    title: 'Jest로 단위 테스트와 통합 테스트 작성하기',
    content:
      'NestJS에서 Jest를 활용한 테스트 작성법을 알아봅니다. 서비스 단위 테스트 시에는 PrismaService를 Mock으로 대체하고, E2E 테스트에서는 실제 DB를 사용해 전체 흐름을 검증합니다.',
  },
  {
    title: '소프트웨어 아키텍처 패턴: 레이어드 아키텍처',
    content:
      'Controller → Service → Repository 계층 분리는 책임을 명확히 하고 테스트를 용이하게 합니다. NestJS의 모듈 시스템은 이러한 레이어드 아키텍처를 자연스럽게 구현할 수 있도록 설계되어 있습니다.',
  },
  {
    title: 'Git Flow vs GitHub Flow 비교 분석',
    content:
      'Git Flow는 복잡한 릴리즈 사이클에 적합하고, GitHub Flow는 지속적 배포 환경에서 단순하고 빠르게 운영할 수 있습니다. 팀 규모와 배포 전략에 맞는 브랜치 전략을 선택하는 것이 중요합니다.',
  },
  {
    title: '백엔드 개발자가 알아야 할 HTTP 완전 정복',
    content:
      'HTTP 메서드(GET, POST, PUT, PATCH, DELETE)의 올바른 사용법, 상태 코드의 의미, 헤더 활용법을 이해하는 것은 좋은 REST API를 설계하는 기초입니다. idempotent와 safe 개념도 꼭 알아두어야 합니다.',
  },
];

async function main() {
  // 테스트 유저 생성
  const hashedPassword = await bcrypt.hash('password123!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      nickname: '테스트유저',
    },
  });

  // 게시글 30개 생성
  for (let i = 0; i < posts.length; i++) {
    await prisma.post.create({
      data: {
        title: posts[i].title,
        content: posts[i].content,
        authorId: user.id,
        viewCount: Math.floor(Math.random() * 200),
      },
    });
  }

  console.log(`✅ 유저 1명, 게시글 ${posts.length}개 생성 완료`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
