# CAPTCHA Module Documentation

The CAPTCHA module provides a mathematical challenge-response mechanism to protect sensitive endpoints (e.g., login, form submissions) against automated bots. It follows Clean Architecture principles and supports server-side validation.

## Architecture

- **Domain/Use Cases**: `GenerateCaptchaUseCase`, `ValidateCaptchaUseCase`, `RefreshCaptchaUseCase`
- **Infrastructure**: Prisma-backed repositories for challenges, configurations, and audit logging.
- **Provider**: Supports dynamically switching between `MathProvider` (plain text arithmetic) and `SvgProvider` (distorted SVG images for alphanumeric and math equations).
- **DI Container**: Use cases are exposed via `src/infrastructure/di/Container.ts`.

## Using CAPTCHA in API Routes (Server-Side)

### 1. Generating a CAPTCHA
Call the `generate` endpoint to create a challenge for a specific purpose.

```typescript
const response = await fetch('/api/captcha/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ purpose: 'login' }),
});

const data = await response.json();
// Returns: { id: string, challenge: string, expires_at: Date }

// If using 'math' config, challenge is plain text (e.g. "5 + 3")
// If using 'svg-math' or 'svg-alphanumeric', challenge is a Base64 SVG string.
```

#### Frontend Example (React)

```tsx
// For plain text math
<p>Solve this: {data.challenge}</p>

// For SVG-based CAPTCHA (svg-alphanumeric or svg-math)
// 'data.challenge' contains a valid data URI (e.g. "data:image/svg+xml;base64,...")
<img src={data.challenge} alt="CAPTCHA Challenge" />
```

### 2. Validating a CAPTCHA
Submit the user's answer alongside their primary request, or validate it directly.

```typescript
const response = await fetch('/api/captcha/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: data.id, // The CAPTCHA ID returned during generation
    answer: '8' // The user's input
  }),
});

const validationResult = await response.json();
if (response.ok && validationResult.valid) {
  // CAPTCHA solved successfully, proceed with business logic
} else {
  // Handle failure (e.g., show validationResult.reason)
}
```

### 3. Refreshing a CAPTCHA
If the user cannot solve the current challenge or it expires, request a new one while cleaning up the old one.

```typescript
const response = await fetch('/api/captcha/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ oldId: data.id, purpose: 'login' }),
});

const newData = await response.json();
// Render the new challenge
```

## Reusing Use Cases (Server-Side Logic)

If you are writing a server-side action or a different API route and want to embed CAPTCHA validation directly without an extra HTTP hop, you can inject the use cases from the DI container:

```typescript
import { validateCaptchaUseCase } from '@/infrastructure/di/Container';
import { validateCaptchaSchema } from '@/modules/captcha/domain/schemas/captcha.schema';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = validateCaptchaSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { id, answer } = parsed.data;
  
  // IP Address for audit logging
  const ip_address = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || undefined;

  const result = await validateCaptchaUseCase.execute(id, answer, ip_address);
  
  if (!result.valid) {
    return NextResponse.json({ error: result.reason }, { status: 403 });
  }

  // Continue with your actual route logic here...
}
```

## Configuration

The CAPTCHA module relies on the `captcha_config` table in the database for its settings, managed through the `ICaptchaConfigRepository`.

Default Configuration Fields:
- `provider`: The type of CAPTCHA. Valid options are:
  - `'math'`: Plain text arithmetic equation (e.g., "5 + 3").
  - `'svg-alphanumeric'`: A distorted, hard-to-read image containing random letters and numbers (ignores confusing characters like O, 0, 1, l).
  - `'svg-math'`: A distorted image containing a math equation.
- `difficulty`: Determines complexity (`easy`, `medium`, `difficult`, `extreme`). 
  - For `math` and `svg-math`, this scales the numbers used in the equation.
  - For SVG providers, this scales the amount of visual noise (lines, dots) and string length.
- `max_attempts`: The number of times a user can guess incorrectly before the CAPTCHA is deleted (e.g., `3`).
- `expiration_minutes`: How long the challenge remains valid (e.g., `5`).

Because the configuration is fetched via `ICaptchaConfigRepository.getConfig()`, the CAPTCHA type and difficulty can be dynamically adjusted in real-time by modifying the database without any application redeploys.

## Cleanup Job

An automated background job (`expireCaptchas`) is dispatched to clean up expired challenges from the `captcha_challenge` table. This prevents database bloat over time.
