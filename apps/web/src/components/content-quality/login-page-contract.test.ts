import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

test('login route delegates to the shared sign-in UI component', () => {
  const loginComponentPath = join(process.cwd(), 'src/components/ui/sign-in.tsx');
  const loginPageSource = readFileSync(join(process.cwd(), 'src/app/login/page.tsx'), 'utf8');

  assert.ok(existsSync(loginComponentPath), 'sign-in must live under components/ui');
  assert.match(loginPageSource, /@\/components\/ui\/sign-in/);
  assert.match(loginPageSource, /<SignInLogin/);
});

test('login UI is account-password only and uses the dotted surface background', () => {
  const loginComponentSource = readFileSync(join(process.cwd(), 'src/components/ui/sign-in.tsx'), 'utf8');
  const dottedSurfacePath = join(process.cwd(), 'src/components/ui/dotted-surface.tsx');

  assert.ok(existsSync(dottedSurfacePath), 'dotted surface must live under components/ui');
  assert.doesNotMatch(loginComponentSource, /企业域名/);
  assert.doesNotMatch(loginComponentSource, /register\('tenantCode'\)/);
  assert.doesNotMatch(loginComponentSource, /tenantCode: ''/);
  assert.match(loginComponentSource, /账号/);
  assert.match(loginComponentSource, /密码/);
  assert.match(loginComponentSource, /placeholder="请输入账号"/);
  assert.match(loginComponentSource, /accountInputProps=\{register\('account'\)\}/);
  assert.match(loginComponentSource, /normalizeLoginAccount/);
  assert.match(loginComponentSource, /tenantCode: 'default'/);
  assert.match(loginComponentSource, /@\/components\/ui\/dotted-surface/);
  assert.match(loginComponentSource, /@\/components\/ui\/spotlight-card/);
  assert.match(loginComponentSource, /<DottedSurface/);
  assert.match(loginComponentSource, /<GlowCard/);
  assert.doesNotMatch(loginComponentSource, /\/images\/login\/background\.png/);
  assert.match(loginComponentSource, /const handleSubmit = onSignIn/);
  assert.match(loginComponentSource, /onSubmit=\{handleSubmit\}/);
  assert.match(loginComponentSource, /passwordInputProps=\{register\('password'\)\}/);
});

test('login api client works on non-secure frp http origins', () => {
  const apiClientSource = readFileSync(join(process.cwd(), 'src/lib/api-client.ts'), 'utf8');

  assert.match(apiClientSource, /globalThis\.crypto\?\.randomUUID/);
  assert.match(apiClientSource, /globalThis\.crypto\?\.getRandomValues/);
  assert.match(apiClientSource, /Math\.random\(\)/);
});

test('login hero copy uses enterprise AI Agent product wording and a welcome message', () => {
  const loginComponentSource = readFileSync(join(process.cwd(), 'src/components/ui/sign-in.tsx'), 'utf8');

  assert.match(loginComponentSource, /企业AIAgent平台/);
  assert.match(loginComponentSource, /欢迎回来/);
  assert.doesNotMatch(loginComponentSource, /AIAget 控制台/);
  assert.doesNotMatch(loginComponentSource, /使用管理员账号进入工作台/);
});

test('login UI follows the split sign-in component structure without fake default actions', () => {
  const loginComponentSource = readFileSync(join(process.cwd(), 'src/components/ui/sign-in.tsx'), 'utf8');
  const loginPageSource = readFileSync(join(process.cwd(), 'src/app/login/page.tsx'), 'utf8');

  assert.match(loginComponentSource, /export interface Testimonial/);
  assert.match(loginComponentSource, /export function SignInPage/);
  assert.match(loginComponentSource, /GlassInputWrapper/);
  assert.match(loginComponentSource, /DottedSurface/);
  assert.match(loginComponentSource, /login-sign-in-shell/);
  assert.match(loginComponentSource, /onGoogleSignIn \?/);
  assert.match(loginComponentSource, /onCreateAccount \?/);
  assert.doesNotMatch(loginPageSource, /DottedSurface/);
  assert.doesNotMatch(loginPageSource, /LoginPageBackground/);
  assert.doesNotMatch(loginComponentSource, /alert\(/);
});

test('login UI wraps search-param dependent content in suspense for production builds', () => {
  const loginComponentSource = readFileSync(join(process.cwd(), 'src/components/ui/sign-in.tsx'), 'utf8');

  assert.match(loginComponentSource, /useSearchParams/);
  assert.match(loginComponentSource, /Suspense/);
  assert.match(loginComponentSource, /<Suspense fallback=/);
  assert.match(loginComponentSource, /<SignInLoginPanel \/>/);
});

test('login animation utilities are defined in global styles', () => {
  const globalStylesSource = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

  assert.match(globalStylesSource, /@keyframes fadeSlideIn/);
  assert.match(globalStylesSource, /@keyframes slideRightIn/);
  assert.match(globalStylesSource, /@keyframes testimonialIn/);
  assert.match(globalStylesSource, /\.animate-element/);
  assert.match(globalStylesSource, /\.animate-testimonial/);
  assert.match(globalStylesSource, /\.spotlight-card::before/);
  assert.match(globalStylesSource, /\.spotlight-card__glow/);
});
