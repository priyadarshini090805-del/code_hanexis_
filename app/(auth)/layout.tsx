import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Brand panel */}
      <div className="hx-mesh hidden lg:flex flex-col justify-between p-12 text-white relative">
        <div className="hx-grid-overlay absolute inset-0" />
        <div className="relative z-10 animate-fade-in-down">
          <Link href="/" className="text-2xl font-bold tracking-tight">HaneXes</Link>
        </div>
        <div className="relative z-10 animate-fade-in-up">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Turn social signals<br />into real pipeline.
          </h2>
          <p className="mt-4 max-w-md text-neutral-400">
            AI-personalized outreach, scheduled posts that publish themselves, and a live
            view of every lead you create — in one monochrome workspace.
          </p>
          <div className="mt-8 flex gap-6 text-sm text-neutral-400">
            <div><div className="text-2xl font-semibold text-white">9</div>modules</div>
            <div><div className="text-2xl font-semibold text-white">AI</div>personalization</div>
            <div><div className="text-2xl font-semibold text-white">Auto</div>publishing</div>
          </div>
        </div>
        <div className="relative z-10 text-xs text-neutral-500">© {new Date().getFullYear()} HaneXes</div>
      </div>
      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="lg:hidden mb-8">
            <span className="text-2xl font-bold tracking-tight">HaneXes</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
