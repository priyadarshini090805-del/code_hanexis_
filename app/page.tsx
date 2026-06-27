import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#FFFDF9' }}>
      {/* Decorative gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #6D1E2A 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #D2A679 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 text-center px-6 max-w-2xl stagger">
        {/* Badge */}
        <div className="mb-8 animate-fade-in-up">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[0.15em]"
            style={{ background: '#F8F5F2', color: '#6D1E2A', border: '1px solid #E7DED5' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#D2A679' }} />
            AI-Powered Sales Intelligence
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl font-bold tracking-[-0.04em] leading-[1.1] mb-6 animate-fade-in-up"
          style={{ color: '#242424' }}
        >
          Close deals
          <br />
          <span style={{ color: '#6D1E2A' }}>before they open.</span>
        </h1>

        {/* Subheadline */}
        <p
          className="text-lg leading-relaxed mb-10 max-w-md mx-auto animate-fade-in-up"
          style={{ color: '#6B6560' }}
        >
          Hanexis uses AI to find, engage, and convert your ideal customers — across LinkedIn, Instagram, and email.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up">
          <Link href="/register" className="hx-btn-primary px-8 py-3 text-base">
            Get started free
          </Link>
          <Link href="/login" className="hx-btn-ghost px-8 py-3 text-base">
            Sign in
          </Link>
        </div>

        {/* Trust line */}
        <p
          className="mt-14 text-xs uppercase tracking-[0.2em] font-medium animate-fade-in"
          style={{ color: '#C5B9AC', animationDelay: '0.6s' }}
        >
          Trusted by sales teams worldwide
        </p>
      </div>
    </main>
  )
}
