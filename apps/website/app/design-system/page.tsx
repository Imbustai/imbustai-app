import Link from 'next/link';
import {
  dsVars,
  Typography,
  TYPOGRAPHY_SCALE,
  Button,
  Badge,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
  Input,
  Label,
} from '@imbustai/ds';
import type { TypographyVariant } from '@imbustai/ds';

export const metadata = {
  title: 'Design System — @imbustai/ds',
  robots: 'noindex',
};

const colorTokens = Object.keys(dsVars.color) as (keyof typeof dsVars.color)[];
const spaceTokens = Object.keys(dsVars.space) as (keyof typeof dsVars.space)[];
const radiusTokens = Object.keys(dsVars.radius) as (keyof typeof dsVars.radius)[];
const typographyVariants = Object.keys(TYPOGRAPHY_SCALE) as TypographyVariant[];

const buttonVariants = ['primary', 'secondary', 'accent', 'outline', 'ghost', 'link', 'destructive'] as const;
const buttonSizes = ['sm', 'md', 'lg'] as const;
const badgeVariants = ['default', 'primary', 'secondary', 'accent', 'outline', 'destructive'] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 'var(--ds-space-12)' }}>
      <Typography variant="h2" as="h2">{title}</Typography>
      <div style={{ marginTop: 'var(--ds-space-6)' }}>{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 'var(--ds-space-8)' }}>
      <Typography variant="h3" as="h3">{title}</Typography>
      <div style={{ marginTop: 'var(--ds-space-4)' }}>{children}</div>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <main style={{ maxWidth: '72rem', margin: '0 auto', padding: 'var(--ds-space-8) var(--ds-space-6)' }}>
      <Typography variant="display">Design System</Typography>
      <Typography variant="body" tone="muted" as="p">
        @imbustai/ds — tokens, typography, and components
      </Typography>

      {/* ── FOUNDATIONS ── */}

      <Section title="Foundations">

        {/* Palette */}
        <SubSection title="Palette">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))', gap: 'var(--ds-space-3)' }}>
            {colorTokens.map((name) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                <div
                  style={{
                    width: 'var(--ds-space-10)',
                    height: 'var(--ds-space-10)',
                    backgroundColor: dsVars.color[name],
                    border: '1px solid var(--ds-color-border)',
                    flexShrink: 0,
                  }}
                />
                <Typography variant="caption" as="span">{name}</Typography>
              </div>
            ))}
          </div>
        </SubSection>

        {/* Typography scale */}
        <SubSection title="Typography Scale">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-4)' }}>
            {typographyVariants.map((v) => (
              <div key={v} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--ds-space-4)' }}>
                <Typography variant="overline" as="span" tone="muted">{v}</Typography>
                <Typography variant={v} as="span">The quick brown fox</Typography>
              </div>
            ))}
          </div>
        </SubSection>

        {/* Spacing */}
        <SubSection title="Spacing">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-2)' }}>
            {spaceTokens.map((s) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-3)' }}>
                <span style={{ display: 'inline-block', width: '2rem', textAlign: 'right' }}>
                  <Typography variant="caption" as="span">{s}</Typography>
                </span>
                <div
                  style={{
                    width: dsVars.space[s],
                    height: 'var(--ds-space-4)',
                    backgroundColor: 'var(--ds-color-primary)',
                  }}
                />
              </div>
            ))}
          </div>
        </SubSection>

        {/* Radius */}
        <SubSection title="Radius">
          <div style={{ display: 'flex', gap: 'var(--ds-space-4)', flexWrap: 'wrap' }}>
            {radiusTokens.map((r) => (
              <div key={r} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--ds-space-2)' }}>
                <div
                  style={{
                    width: 'var(--ds-space-12)',
                    height: 'var(--ds-space-12)',
                    backgroundColor: 'var(--ds-color-muted)',
                    border: '1px solid var(--ds-color-border)',
                    borderRadius: dsVars.radius[r],
                  }}
                />
                <Typography variant="caption" as="span">{r}</Typography>
              </div>
            ))}
          </div>
        </SubSection>

      </Section>

      {/* ── COMPONENTS ── */}

      <Section title="Components">

        {/* Button */}
        <SubSection title="Button">
          <Typography variant="overline" as="p" tone="muted">Variants × sizes</Typography>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-4)', marginTop: 'var(--ds-space-3)' }}>
            {buttonVariants.map((v) => (
              <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 'var(--ds-space-3)', flexWrap: 'wrap' }}>
                {buttonSizes.map((s) => (
                  <Button key={`${v}-${s}`} variant={v} size={s}>{v} {s}</Button>
                ))}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--ds-space-4)' }}>
            <Typography variant="overline" as="p" tone="muted">States &amp; features</Typography>
          </div>
          <div style={{ display: 'flex', gap: 'var(--ds-space-3)', flexWrap: 'wrap', marginTop: 'var(--ds-space-3)' }}>
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="primary" fullWidth>Full width</Button>
            <Button variant="primary" size="icon" aria-label="Icon">★</Button>
            <Button variant="primary" asChild>
              <Link href="/design-system">asChild link</Link>
            </Button>
          </div>
        </SubSection>

        {/* Badge */}
        <SubSection title="Badge">
          <div style={{ display: 'flex', gap: 'var(--ds-space-3)', flexWrap: 'wrap' }}>
            {badgeVariants.map((v) => (
              <Badge key={v} variant={v}>{v}</Badge>
            ))}
          </div>
        </SubSection>

        {/* Card */}
        <SubSection title="Card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))', gap: 'var(--ds-space-4)' }}>
            <Card>
              <CardHeader>
                <CardTitle>Default card</CardTitle>
                <CardDescription>With title, description, content, and footer.</CardDescription>
              </CardHeader>
              <CardContent>
                <Typography variant="body">Card body content goes here.</Typography>
              </CardContent>
              <CardFooter>
                <Button variant="primary" size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card tone="muted">
              <CardHeader>
                <CardTitle>Muted card</CardTitle>
                <CardDescription>tone=&quot;muted&quot; background.</CardDescription>
              </CardHeader>
              <CardContent>
                <Typography variant="body">Muted card body content.</Typography>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card bordered={false}>
              <CardHeader>
                <CardTitle>No border</CardTitle>
                <CardDescription>bordered=false.</CardDescription>
              </CardHeader>
              <CardContent>
                <Typography variant="body">Card without border.</Typography>
              </CardContent>
            </Card>
          </div>
        </SubSection>

        {/* Input */}
        <SubSection title="Input">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-3)', maxWidth: '24rem' }}>
            <Input placeholder="Default input" />
            <Input placeholder="Invalid input" invalid />
            <Input placeholder="Disabled input" disabled />
          </div>
          <Typography variant="caption" tone="muted" as="p">
            Focus ring visible on keyboard focus (tab into the default input above).
          </Typography>
        </SubSection>

        {/* Label + Input */}
        <SubSection title="Label">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-2)', maxWidth: '24rem' }}>
            <Label htmlFor="demo-email">Email address</Label>
            <Input id="demo-email" type="email" placeholder="you@example.com" />
          </div>
        </SubSection>

      </Section>
    </main>
  );
}
