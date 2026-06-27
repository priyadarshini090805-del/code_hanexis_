import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: '#FFFDF9' }}>
      {/* Brand panel */}
      <div className="hx-mesh hidden lg:flex flex-col justify-between p-12 text-white relative">
        <div className="hx-grid-overlay absolute inset-0" />
        <div className="relative z-10 animate-fade-in-down">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(255,253,249,0.15)', backdropFilter: 'blur(8px)' }}>
              H
            </div>
            <span className="text-xl font-bold tracking-tight">Hanexis</span>
          </Link>
        </div>
        <div className="relative z-10 animate-fade-in-up">
          <h2 className="text-4xl font-bold leading-[1.15] tracking-[-0.03em]">
            Turn social signals
            <br />
            into real pipeline.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed" style={{ color: 'rgba(255,253,249,0.5)' }}>
            AI-personalized outreach, automated publishing, and a live view of every lead — in one premium workspace.
          </p>
          <div className="mt-10 flex gap-8 text-sm" style={{ color: 'rgba(255,253,249,0.4)' }}>
            <div>
              <div className="text-2xl font-semibold text-white mb-0.5">9</div>
              modules
            </div>
            <div>
              <div className="text-2xl font-semibold text-white mb-0.5">AI</div>
              personalization
            </div>
            <div>
              <div className="text-2xl font-semibold text-white mb-0.5">Auto</div>
              publishing
            </div>
          </div>
        </div>
        <div className="relative z-10 text-xs" style={{ color: 'rgba(255,253,249,0.25)' }}>
          © {new Date().getFullYear()} Hanexis
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12" style={{ background: '#FFFDF9' }}>
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold" style={{ background: '#6D1E2A' }}>
                H
              </div>
              <span className="text-lg font-bold tracking-tight" style={{ color: '#242424' }}>Hanexis</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
