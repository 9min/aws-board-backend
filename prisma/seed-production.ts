/**
 * 상용 서버에 AWS 관련 더미 데이터 삽입 스크립트
 * API를 통해 회원가입 → 게시글 작성 → 댓글 작성 순서로 진행
 *
 * 실행 전 환경변수 설정 필요:
 *   SEED_BASE_URL=https://<your-domain>/api/v1
 *   SEED_PASSWORD=<seed-account-password>
 */

const BASE_URL = process.env.SEED_BASE_URL ?? 'http://localhost:3000/api/v1';

const posts = [
  {
    title: 'AWS VPC 설계 기초: 서브넷과 라우팅 테이블 이해하기',
    content:
      'VPC(Virtual Private Cloud)는 AWS에서 논리적으로 격리된 네트워크 공간입니다. Public Subnet과 Private Subnet을 구분하고, 인터넷 게이트웨이와 NAT 게이트웨이를 통해 트래픽 흐름을 제어하는 방법을 알아봅니다. 보안 그룹과 NACL을 함께 활용하면 다층 방어 구조를 만들 수 있습니다.',
    comments: [
      'CIDR 블록 설계할 때 미래 확장성 고려하는 게 정말 중요하더라고요.',
      'NAT 게이트웨이 비용이 생각보다 나와서 깜짝 놀랐어요. 트래픽 모니터링 꼭 하세요.',
      'VPC Peering이랑 Transit Gateway 차이도 같이 설명해주시면 좋겠어요!',
      'Private Subnet의 Lambda가 인터넷 접근할 때 NAT 없이 VPC Endpoint 쓰면 비용 절감돼요.',
    ],
  },
  {
    title: 'AWS IAM 역할(Role)과 정책(Policy) 실전 가이드',
    content:
      'IAM은 AWS 리소스 접근을 제어하는 핵심 서비스입니다. 최소 권한 원칙(Principle of Least Privilege)에 따라 역할과 정책을 설계하고, 인라인 정책보다 관리형 정책을 활용하는 방법을 설명합니다. EC2, Lambda, ECS 각 서비스에 맞는 실행 역할 설정도 다룹니다.',
    comments: [
      '와일드카드(*) 남발하다가 보안 감사에서 지적받은 적 있어요. 정말 조심해야 해요.',
      'IAM Access Analyzer 써보니까 불필요한 권한 찾는 데 너무 편하더라고요.',
      '크로스 계정 역할 위임 구조 설명도 추가해주시면 좋겠습니다.',
      'AWS Organizations SCP와 IAM 정책 동시에 적용할 때 평가 순서가 헷갈렸는데 이 글로 정리됐어요.',
      '서비스 계정 키 발급 대신 역할 기반 인증 쓰는 게 훨씬 안전하죠.',
    ],
  },
  {
    title: 'Amazon RDS Aurora PostgreSQL 운영 경험 공유',
    content:
      'Aurora PostgreSQL은 일반 RDS보다 최대 3배 빠른 성능을 제공합니다. Multi-AZ 클러스터 구성으로 고가용성을 확보하고, Read Replica를 활용한 읽기 부하 분산 전략을 실무에서 적용한 경험을 공유합니다. 자동 백업과 Point-in-Time Recovery 설정도 함께 다룹니다.',
    comments: [
      'Aurora Serverless v2 써봤는데 트래픽 변동이 큰 서비스엔 정말 좋더라고요.',
      'Failover 테스트 주기적으로 꼭 해두세요. 실제 장애 때 당황하지 않으려면.',
      'Performance Insights로 슬로우 쿼리 잡는 게 CloudWatch보다 훨씬 직관적이에요.',
      'Connection pooling은 RDS Proxy 꼭 쓰세요. Lambda 환경에서 특히 필수예요.',
    ],
  },
  {
    title: 'AWS Lambda + API Gateway로 서버리스 API 구축하기',
    content:
      'Lambda와 API Gateway를 조합하면 서버 관리 없이 확장 가능한 API를 만들 수 있습니다. Cold Start 문제를 줄이는 Provisioned Concurrency 설정, Lambda Layer로 의존성 관리하는 방법, 그리고 API Gateway의 스테이지 변수와 사용량 계획 설정을 실습해봅니다.',
    comments: [
      'Cold Start 때문에 사용자 경험이 나빠질 수 있어서 워밍업 전략이 중요해요.',
      'Lambda URL 기능으로 API Gateway 없이도 HTTPS 엔드포인트 만들 수 있어요.',
      'SnapStart 기능 Java Lambda에서 Cold Start 90% 줄어든다고 하던데 체감 어떤가요?',
      'Lambda Power Tuning으로 메모리 설정 최적화하면 비용도 줄고 속도도 빨라져요.',
      'ARM64 아키텍처로 바꿨더니 비용이 20% 줄었어요.',
    ],
  },
  {
    title: 'S3 버킷 정책과 CloudFront OAC 설정으로 정적 웹사이트 배포',
    content:
      'S3 버킷에 정적 파일을 호스팅하고 CloudFront로 CDN을 구성하는 완전한 가이드입니다. Origin Access Control(OAC)로 S3에 직접 접근을 차단하고 CloudFront만 허용하는 보안 설정, HTTPS 강제 리다이렉트, 그리고 커스텀 도메인 연결 방법을 설명합니다.',
    comments: [
      'OAI에서 OAC로 마이그레이션하는 가이드도 있으면 좋겠어요.',
      'CloudFront 캐시 무효화 비용도 꽤 나오니까 파일명에 해시 붙이는 방식 추천해요.',
      'S3 Transfer Acceleration이랑 CloudFront 차이가 궁금했는데 이 글 보고 이해했어요.',
      'www 리다이렉트 설정할 때 S3 버킷 두 개 만들어야 하는 게 번거롭긴 하죠.',
    ],
  },
  {
    title: 'AWS ECS Fargate로 NestJS 컨테이너 배포하기',
    content:
      'ECS Fargate는 EC2 인스턴스 관리 없이 컨테이너를 실행할 수 있는 서버리스 컨테이너 플랫폼입니다. Dockerfile 최적화, ECR 이미지 관리, Task Definition 설정, ALB와 연동한 블루/그린 배포 전략까지 실전 경험을 바탕으로 설명합니다.',
    comments: [
      'Fargate Spot 쓰면 비용을 70% 절감할 수 있는데, 중단 가능한 워크로드에 적합해요.',
      'Container Insights 활성화하면 메모리/CPU 사용률 추적이 훨씬 편해요.',
      'Task Definition 업데이트 후 서비스 배포할 때 롤링 업데이트 설정 주의하세요.',
      'ECR 이미지 수명주기 정책 설정 안 하면 오래된 이미지가 쌓여서 비용 나와요.',
      'ECS Exec으로 컨테이너 내부 접근하는 기능 정말 유용하더라고요.',
    ],
  },
  {
    title: 'AWS CloudWatch로 애플리케이션 모니터링 구축하기',
    content:
      'CloudWatch Logs, Metrics, Alarms를 활용한 통합 모니터링 시스템을 구축하는 방법입니다. 커스텀 메트릭 발행, 로그 인사이트 쿼리로 에러 패턴 분석, 그리고 SNS 연동으로 슬랙 알림을 보내는 실전 설정을 공유합니다.',
    comments: [
      'Embedded Metric Format(EMF)으로 Lambda에서 커스텀 메트릭 발행하면 편해요.',
      'Log Insights 쿼리 언어가 처음엔 어렵지만 익숙해지면 정말 강력해요.',
      'CloudWatch Anomaly Detection 기능으로 이상 트래픽 자동 감지하고 있어요.',
      'Contributor Insights로 어떤 IP, API가 트래픽 많은지 한눈에 볼 수 있어요.',
    ],
  },
  {
    title: 'AWS SQS와 SNS로 이벤트 기반 아키텍처 설계하기',
    content:
      'SQS(Simple Queue Service)와 SNS(Simple Notification Service)를 조합한 Fan-out 패턴으로 마이크로서비스 간 비동기 통신을 구현합니다. Dead Letter Queue 설정으로 실패 메시지를 처리하고, FIFO 큐로 순서를 보장하는 방법도 다룹니다.',
    comments: [
      'SQS Visibility Timeout 설정을 Lambda 처리 시간보다 길게 잡아야 중복 처리를 막을 수 있어요.',
      'DLQ 모니터링 알림 꼭 설정해두세요. 자칫 메시지 유실될 수 있어요.',
      'EventBridge가 SNS보다 라우팅 기능이 풍부해서 요즘은 EventBridge 많이 쓰더라고요.',
      'Lambda 트리거로 SQS 배치 처리할 때 배치 크기 튜닝이 성능에 큰 영향을 줘요.',
      '메시지 중복 처리 방지를 위한 멱등성(idempotency) 설계가 정말 중요해요.',
    ],
  },
  {
    title: 'AWS CodePipeline으로 CI/CD 파이프라인 완전 자동화',
    content:
      'CodeCommit, CodeBuild, CodeDeploy를 연결하는 CodePipeline으로 소스 변경부터 프로덕션 배포까지 완전 자동화하는 방법입니다. GitHub 연동, 테스트 단계 삽입, 수동 승인 게이트 설정, 그리고 배포 실패 시 자동 롤백 전략을 설명합니다.',
    comments: [
      'GitHub Actions가 더 익숙해서 그쪽 쓰는데, CodePipeline은 AWS 서비스 연동이 더 자연스럽죠.',
      'CodeBuild 캐시 설정하면 빌드 시간이 확 줄어요. node_modules 캐싱 꼭 해보세요.',
      '수동 승인 단계에서 슬랙 알림 연동해두면 팀 협업이 훨씬 편해져요.',
      'ECR 이미지 스캔을 파이프라인에 넣어두면 보안 취약점 조기 발견에 도움돼요.',
    ],
  },
  {
    title: 'Amazon ElastiCache Redis로 API 응답 캐싱 구현',
    content:
      'ElastiCache Redis를 활용해 자주 조회되는 데이터를 캐싱하여 DB 부하를 줄이고 응답 속도를 개선하는 방법입니다. NestJS에서 Cache Manager를 연동하는 코드와 함께 TTL 전략, 캐시 무효화 패턴, 그리고 Redis Cluster 모드 설정까지 다룹니다.',
    comments: [
      '캐시 스탬피드 문제 겪어봤는데, Mutex Lock 패턴으로 해결했어요.',
      'Redis는 단순 캐시 외에도 세션 저장소, Rate Limiter로도 활용할 수 있어요.',
      'Cluster 모드에서 multi-key 명령어 제한 때문에 설계 바꾼 경험이 있어요.',
      'ElastiCache Serverless 출시됐는데 소규모 서비스엔 관리 부담이 없어서 좋아요.',
      'Cache-aside vs Write-through 패턴 선택이 데이터 정합성에 영향을 미쳐요.',
    ],
  },
  {
    title: 'AWS Secrets Manager로 환경변수 보안 관리하기',
    content:
      'Secrets Manager를 사용해 DB 비밀번호, API 키 등 민감한 정보를 안전하게 관리하는 방법입니다. 자동 로테이션 설정, Lambda와 ECS에서 런타임에 시크릿을 주입하는 방법, 그리고 Parameter Store와의 차이점 및 사용 기준을 설명합니다.',
    comments: [
      '.env 파일 Git에 올린 사고 이후로 무조건 Secrets Manager 쓰고 있어요.',
      '자동 로테이션 설정하면 Lambda 함수 연결도 자동으로 업데이트되는 게 신기해요.',
      'Parameter Store SecureString으로도 충분한 경우가 많아서 비용 고려해서 선택하세요.',
      '로컬 개발 시엔 aws-vault로 IAM 자격증명 관리하면 편해요.',
    ],
  },
  {
    title: 'Application Load Balancer 고급 라우팅 설정',
    content:
      'ALB의 경로 기반, 호스트 기반 라우팅으로 마이크로서비스를 단일 엔트리포인트로 통합하는 방법입니다. 가중치 기반 타겟 그룹으로 카나리 배포를 구현하고, WAF 연동으로 보안을 강화하는 실전 설정을 공유합니다.',
    comments: [
      'ALB Access Log를 S3에 저장하고 Athena로 분석하는 구조 추천해요.',
      '고정 세션(Sticky Session) 설정이 ECS Fargate에서 어떻게 동작하는지 헷갈렸는데 이해됐어요.',
      '가중치 기반 배포로 카나리 릴리즈 해봤는데 정말 안심이 됩니다.',
      'WAF 룰셋 관리 비용도 꽤 되니까 처음엔 기본 관리형 룰부터 시작하세요.',
      'HTTP/2 활성화하면 성능 개선 체감할 수 있어요.',
    ],
  },
  {
    title: 'AWS CDK로 인프라를 코드로 관리하기(IaC)',
    content:
      'AWS CDK(Cloud Development Kit)를 사용해 TypeScript로 인프라를 정의하고 배포하는 방법입니다. VPC, ECS 클러스터, RDS 인스턴스를 코드로 프로비저닝하고, 스택 간 의존성 관리와 환경별 설정 분리 전략을 실습해봅니다.',
    comments: [
      'Terraform에서 CDK로 넘어왔는데 TypeScript로 인프라 짜는 게 너무 편해요.',
      'CDK Constructs 라이브러리 활용하면 반복 설정을 많이 줄일 수 있어요.',
      'cdk diff 명령으로 변경 사항 미리 확인하는 습관 꼭 들이세요.',
      'CDK Nag 써서 보안 모범 사례 자동으로 검사하고 있어요.',
    ],
  },
  {
    title: 'Amazon Route 53으로 도메인과 DNS 설정하기',
    content:
      'Route 53의 레코드 타입(A, CNAME, ALIAS)을 이해하고 ALB, CloudFront, S3에 커스텀 도메인을 연결하는 방법입니다. 가중치 기반 라우팅, 장애 조치(Failover) 라우팅, 지연 시간 기반 라우팅 정책으로 고가용성 DNS를 구성하는 방법도 다룹니다.',
    comments: [
      'ALIAS 레코드가 CNAME과 다른 점을 이 글 보고 드디어 이해했어요.',
      'Health Check 설정 안 하면 Failover 라우팅이 제대로 동작 안 해요. 꼭 설정하세요.',
      'Route 53 Resolver로 하이브리드 클라우드 DNS 설정한 경험 공유해주시면 좋겠어요.',
      'TTL 짧게 하면 DNS 변경이 빠르게 반영되지만 비용이 올라갈 수 있어요.',
      '도메인 이전할 때 TTL 미리 낮춰두는 것 절대 잊지 마세요.',
    ],
  },
  {
    title: 'AWS WAF로 웹 애플리케이션 방화벽 구성하기',
    content:
      'AWS WAF(Web Application Firewall)로 SQL Injection, XSS, 악성 봇 등을 차단하는 방법입니다. AWS Managed Rule Group을 기본으로 설정하고, 커스텀 룰로 IP 차단, Rate Limiting을 구현합니다. CloudFront와 ALB에 WAF를 연동하는 실전 설정을 공유합니다.',
    comments: [
      '관리형 룰이 가끔 오탐이 있어서 Count 모드로 먼저 테스트한 후 Block으로 전환했어요.',
      'Bot Control 관리형 룰 추가했더니 크롤러 트래픽이 확 줄었어요.',
      'WAF Logs를 S3에 저장하고 분석하면 공격 패턴 파악에 도움돼요.',
      'IP Reputation 리스트 룰은 기본으로 켜두는 게 좋더라고요.',
    ],
  },
  {
    title: 'AWS X-Ray로 분산 추적(Distributed Tracing) 구현',
    content:
      'X-Ray를 활용해 마이크로서비스 간 요청 흐름을 추적하고 병목 지점을 찾는 방법입니다. NestJS에 X-Ray SDK를 통합하고, Lambda, ECS, RDS, DynamoDB 호출을 자동 계측하는 설정과 서비스 맵 읽는 방법을 설명합니다.',
    comments: [
      'OpenTelemetry랑 비교했을 때 X-Ray는 AWS 서비스 연동이 훨씬 간단하죠.',
      '샘플링 율 설정이 중요한데 처음엔 5%로 시작하는 걸 추천해요.',
      'Lambda Powertools에서 X-Ray 연동 지원해줘서 설정이 훨씬 간편해졌어요.',
      '서비스 맵에서 병목 구간 찾는 게 직관적이라 문제 해결이 빨라졌어요.',
      'Subsegment로 커스텀 계측 추가하면 더 세밀한 추적이 가능해요.',
    ],
  },
  {
    title: 'DynamoDB 데이터 모델링과 GSI 활용 전략',
    content:
      'DynamoDB의 파티션 키와 정렬 키 설계가 성능을 결정합니다. 단일 테이블 설계(Single Table Design) 패턴으로 관계형 데이터를 DynamoDB에 모델링하고, GSI(Global Secondary Index)로 다양한 쿼리 패턴을 지원하는 방법을 실전 예제와 함께 설명합니다.',
    comments: [
      '처음엔 RDS처럼 설계하다가 핫 파티션 문제 겪었어요. 접근 방식을 완전히 바꿔야 해요.',
      '단일 테이블 설계가 처음엔 어렵지만 익숙해지면 관리가 정말 편해져요.',
      'NoSQL Workbench 툴로 데이터 모델 시각화하면 설계할 때 많은 도움이 돼요.',
      'DynamoDB Streams + Lambda 조합으로 이벤트 기반 처리 구현하고 있어요.',
    ],
  },
  {
    title: 'AWS 비용 최적화 전략: 실제 청구서 분석 후기',
    content:
      '매달 나오는 AWS 청구서를 분석하고 비용을 40% 줄인 실전 경험을 공유합니다. Compute Optimizer 권고사항 적용, Savings Plans와 Reserved Instance 구매 전략, 미사용 리소스 정리, 그리고 Cost Anomaly Detection으로 예상치 못한 비용 급증을 방지하는 방법을 다룹니다.',
    comments: [
      'S3 Intelligent-Tiering으로 전환했더니 스토리지 비용이 30% 줄었어요.',
      'NAT 게이트웨이가 의외로 비싸더라고요. VPC Endpoint 최대한 활용하세요.',
      '개발 환경 EC2 스케줄러 설정해서 야간/주말에 자동 종료하도록 했어요.',
      'Cost Explorer 태그 기반 분석하려면 리소스 태깅 처음부터 잘 해둬야 해요.',
      'Trusted Advisor 권고사항 주기적으로 확인하는 습관이 비용 절감에 도움돼요.',
    ],
  },
  {
    title: 'Amazon Cognito로 소셜 로그인 연동하기',
    content:
      'Cognito User Pool로 회원가입/로그인을 구현하고, Google, Kakao 소셜 로그인을 연동하는 방법입니다. JWT 토큰 검증, Cognito Triggers로 커스텀 비즈니스 로직 삽입, 그리고 NestJS에서 Cognito 인증을 미들웨어로 처리하는 코드를 공유합니다.',
    comments: [
      'Cognito 커스텀 도메인 설정하면 브랜드 일관성 유지할 수 있어요.',
      'Pre-signup Trigger로 허용된 이메일 도메인만 가입 가능하게 했어요.',
      'Cognito Hosted UI는 커스터마이징 한계가 있어서 결국 직접 UI 만들었어요.',
      'Access Token 갱신 로직 처음 구현할 때 꽤 헷갈렸는데 이 글이 도움될 것 같아요.',
    ],
  },
  {
    title: 'AWS Batch로 대용량 데이터 처리 파이프라인 구축',
    content:
      'AWS Batch를 사용해 대용량 CSV 파일 처리, 이미지 변환, 보고서 생성 등의 배치 작업을 자동화하는 방법입니다. Job Queue와 Compute Environment 설정, Spot Instance 활용으로 비용을 줄이는 전략, 그리고 Step Functions와 연동한 워크플로우 오케스트레이션을 설명합니다.',
    comments: [
      'Lambda 15분 제한 때문에 긴 작업은 Batch로 이관했어요. 확실히 적합해요.',
      'Spot Instance 중단될 때 체크포인트 저장하는 로직 구현이 중요해요.',
      'Array Job 기능으로 병렬 처리하니까 처리 시간이 획기적으로 줄었어요.',
      'Container 이미지 크기 작게 유지하면 Job 시작 시간도 빨라져요.',
      'EventBridge로 스케줄 기반 Batch Job 트리거하면 Cron 서버 따로 안 운영해도 돼요.',
    ],
  },
  {
    title: 'AWS Step Functions로 서버리스 워크플로우 구현',
    content:
      'Step Functions를 활용해 복잡한 비즈니스 프로세스를 시각적으로 설계하고 실행하는 방법입니다. Lambda 함수들을 오케스트레이션하고, 재시도 로직과 오류 처리를 선언적으로 정의하며, Express Workflow와 Standard Workflow의 차이점도 설명합니다.',
    comments: [
      '복잡한 비즈니스 로직을 코드 대신 상태 머신으로 표현하니까 가독성이 높아졌어요.',
      'Parallel State로 동시 실행하면 처리 시간을 크게 줄일 수 있어요.',
      'Workflow Studio로 시각적으로 설계할 수 있어서 팀원과 소통이 쉬워요.',
      'Wait State로 외부 콜백 기다리는 패턴이 비동기 처리에 유용해요.',
    ],
  },
  {
    title: 'AWS EventBridge로 이벤트 드리븐 아키텍처 구현',
    content:
      'EventBridge를 중심으로 한 이벤트 기반 아키텍처를 설계하는 방법입니다. 커스텀 이벤트 버스, 이벤트 패턴 매칭 룰, SaaS 파트너 이벤트 연동, 그리고 EventBridge Pipes로 소스에서 타겟으로 이벤트를 필터링하고 변환하는 방법을 다룹니다.',
    comments: [
      'SNS + SQS 조합에서 EventBridge로 갈아탔는데 라우팅 유연성이 훨씬 뛰어나요.',
      'Schema Registry가 이벤트 계약 관리에 정말 유용해요.',
      '이벤트 재실행(Replay) 기능으로 장애 복구할 때 큰 도움이 됐어요.',
      'Dead Letter Queue 설정해서 실패한 이벤트 모니터링하는 것 꼭 해두세요.',
      'Archive + Replay 조합으로 이벤트 소싱 패턴 구현하고 있어요.',
    ],
  },
  {
    title: 'AWS Organizations와 멀티 어카운트 전략',
    content:
      '여러 팀과 환경을 위한 멀티 어카운트 구조를 설계하는 방법입니다. AWS Control Tower로 Landing Zone을 구성하고, SCP로 계정별 정책을 적용하며, AWS Config와 Security Hub로 컴플라이언스를 중앙 관리하는 모범 사례를 공유합니다.',
    comments: [
      '개발/스테이징/프로덕션 계정 분리하고 나서 실수로 운영 건드리는 사고가 없어졌어요.',
      'Control Tower Account Factory로 신규 계정 프로비저닝 자동화하면 편해요.',
      'Consolidated Billing으로 볼륨 디스카운트 받는 것도 장점이에요.',
      'SCP 잘못 설정하면 계정 전체가 먹통 될 수 있어서 신중하게 테스트해야 해요.',
    ],
  },
  {
    title: 'Amazon CloudFront Functions와 Lambda@Edge 활용법',
    content:
      'CloudFront의 엣지 컴퓨팅 기능을 활용해 전 세계 엣지 로케이션에서 로직을 실행하는 방법입니다. CloudFront Functions로 URL 리라이트, A/B 테스트를 구현하고, Lambda@Edge로 인증, 이미지 리사이징을 처리하는 실전 예제를 공유합니다.',
    comments: [
      'CloudFront Functions는 실행 시간 제한이 1ms라 간단한 로직만 적합해요.',
      '이미지 리사이징 Lambda@Edge로 구현했는데 원본 S3 하나로 다양한 크기 제공할 수 있어요.',
      '엣지에서 JWT 검증하면 오리진 서버 부하가 크게 줄어요.',
      'Lambda@Edge는 us-east-1에만 배포해야 한다는 제약이 처음엔 헷갈렸어요.',
      'Viewer Request/Response, Origin Request/Response 이벤트 타입 차이 이해가 중요해요.',
    ],
  },
  {
    title: 'AWS 아키텍처 Well-Architected Framework 실전 적용',
    content:
      'AWS Well-Architected Framework의 6가지 기둥(운영 우수성, 보안, 안정성, 성능 효율성, 비용 최적화, 지속 가능성)을 실제 프로젝트에 적용한 경험입니다. Well-Architected Tool로 아키텍처를 평가하고 개선 계획을 수립하는 방법을 설명합니다.',
    comments: [
      'WAF 리뷰 진행해봤는데 놓치고 있던 부분을 많이 발견했어요.',
      '비용 기둥 항목 보면서 즉시 개선할 수 있는 것들이 꽤 있더라고요.',
      '6개월마다 리뷰하면서 아키텍처 성숙도를 높여가는 과정이 의미 있어요.',
      '안정성 기둥의 재해 복구(DR) 전략 수립이 생각보다 어렵더라고요.',
    ],
  },
  {
    title: 'Amazon SES로 이메일 발송 서비스 구축하기',
    content:
      'SES를 사용해 트랜잭션 이메일(회원가입 인증, 비밀번호 재설정)과 마케팅 이메일을 발송하는 방법입니다. 도메인 인증 설정, 발송 평판 관리, Bounce와 Complaint 처리 자동화, 그리고 SES 샌드박스 탈출 방법까지 실전 팁을 공유합니다.',
    comments: [
      'Bounce Rate 5% 넘으면 계정 정지될 수 있어서 수신 거부 처리가 정말 중요해요.',
      'SES + SNS + SQS 조합으로 Bounce/Complaint 자동 처리하고 있어요.',
      '샌드박스 환경에서 미리 충분히 테스트하고 프로덕션 전환 요청하세요.',
      'DMARC, DKIM, SPF 설정 안 하면 스팸함에 들어가는 경우가 많아요.',
      'SES 이메일 템플릿 기능 활용하면 동적 내용 삽입이 편해요.',
    ],
  },
  {
    title: 'AWS Config로 리소스 변경 이력 추적 및 컴플라이언스 관리',
    content:
      'AWS Config로 리소스 설정 변경을 실시간으로 추적하고, 컴플라이언스 규칙 위반을 자동으로 탐지하는 방법입니다. 관리형 규칙과 커스텀 Lambda 규칙 작성, 자동 교정(Auto Remediation) 설정, 그리고 멀티 리전/멀티 계정 집계 방법을 다룹니다.',
    comments: [
      '보안 감사 준비할 때 Config 이력이 정말 유용하더라고요.',
      '암호화 안 된 S3 버킷 자동 감지 규칙 설정해두고 Slack 알림 받고 있어요.',
      '자동 교정 기능 신중하게 사용해야 해요. 운영 중인 리소스 변경될 수 있어요.',
      'Security Hub와 연동하면 Config 위반 사항을 한곳에서 관리할 수 있어요.',
    ],
  },
  {
    title: 'AWS Fargate Spot으로 배치 작업 비용 절감하기',
    content:
      'Fargate Spot을 활용해 중단 가능한 배치 작업의 비용을 최대 70% 절감하는 방법입니다. SIGTERM 시그널 처리로 작업 중단에 우아하게 대응하고, 체크포인트 저장으로 작업을 재개하는 패턴, 그리고 Spot과 On-Demand를 혼합한 용량 공급자 전략을 설명합니다.',
    comments: [
      '데이터 처리 파이프라인에 Fargate Spot 도입하고 나서 비용이 반 이상 줄었어요.',
      'SIGTERM 받았을 때 진행 상태 S3에 저장하는 로직 구현이 핵심이에요.',
      '인터럽트 알림 받으면 2분 안에 마무리해야 해서 체크포인트 간격 조절이 중요해요.',
      'Spot 가용성이 낮을 때 On-Demand로 자동 폴백되도록 용량 공급자 설정해두세요.',
    ],
  },
  {
    title: 'AWS Amplify로 풀스택 웹앱 빠르게 배포하기',
    content:
      'AWS Amplify를 사용해 React 프론트엔드를 자동 배포하고, Amplify Backend로 인증, API, 스토리지를 빠르게 프로비저닝하는 방법입니다. GitHub 연동 CI/CD, 브랜치별 프리뷰 환경 자동 생성, 그리고 Amplify Gen 2의 새로운 기능도 소개합니다.',
    comments: [
      '간단한 사이드 프로젝트엔 Amplify가 정말 빠르게 올릴 수 있어서 좋아요.',
      '복잡한 백엔드는 결국 직접 구성하게 되더라고요. 학습용이나 MVP엔 적합해요.',
      'PR마다 프리뷰 URL 자동 생성되는 기능이 코드 리뷰할 때 편해요.',
      'Amplify Gen 2가 TypeScript 기반이라 타입 안전성이 좋아졌어요.',
      '커스텀 도메인 설정이 Route 53 없이도 간단하게 되는 게 장점이에요.',
    ],
  },
  {
    title: 'Amazon OpenSearch Service로 전문 검색 구현하기',
    content:
      'OpenSearch Service(구 Elasticsearch Service)를 활용해 게시판 게시글 전문 검색 기능을 구현하는 방법입니다. 인덱스 매핑 설계, 한국어 형태소 분석기 설정, DynamoDB Streams와 연동한 실시간 인덱싱 파이프라인, 그리고 쿼리 최적화 전략을 설명합니다.',
    comments: [
      '한국어 검색은 nori 플러그인 없이는 제대로 안 되더라고요.',
      'DynamoDB → Streams → Lambda → OpenSearch 파이프라인 구성이 핵심이에요.',
      '인덱스 샤드 수 설계를 처음에 잘못해서 나중에 고생했어요. 처음부터 잘 설계하세요.',
      'OpenSearch Serverless 써보니까 용량 관리가 없어서 편하긴 한데 비용 예측이 어려워요.',
    ],
  },
];

interface AuthResponse {
  data: { accessToken: string };
  error: null;
}

interface RegisterResponse {
  data: { id: number } | null;
  error: { message: string } | null;
}

interface PostResponse {
  data: { id: number } | null;
  error: { message: string } | null;
}

async function register(email: string, password: string, nickname: string): Promise<RegisterResponse> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nickname }),
  });
  return res.json() as Promise<RegisterResponse>;
}

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as AuthResponse;
  return data.data.accessToken;
}

async function createPost(token: string, title: string, content: string): Promise<PostResponse> {
  const res = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, content }),
  });
  return res.json() as Promise<PostResponse>;
}

async function createComment(token: string, postId: number, content: string) {
  const res = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  return res.json();
}

async function main() {
  const email = 'seed@aws-board.dev';
  const password = process.env.SEED_PASSWORD;
  if (!password) {
    throw new Error('SEED_PASSWORD 환경변수가 설정되지 않았습니다.');
  }
  const nickname = 'AWS개발자';

  // 계정 생성 (이미 있으면 로그인만)
  await register(email, password, nickname);
  const token = await login(email, password);
  console.log('✅ 로그인 성공');

  let totalComments = 0;

  for (let i = 0; i < posts.length; i++) {
    const { title, content, comments } = posts[i];

    // 게시글 생성
    const postRes = await createPost(token, title, content);
    const postId = postRes.data?.id;
    if (!postId) {
      console.error(`  [${i + 1}/${posts.length}] 게시글 생성 실패: "${title}"`);
      continue;
    }

    // 댓글 생성
    for (const comment of comments) {
      await createComment(token, postId, comment);
      totalComments++;
    }

    console.log(`  [${i + 1}/${posts.length}] "${title}" + 댓글 ${comments.length}개`);
  }

  console.log(`\n✅ 완료: 게시글 ${posts.length}개, 댓글 ${totalComments}개 생성`);
}

main().catch(console.error);
