import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-12 pt-10 md:px-6 md:pb-20 md:pt-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground font-medium">
          Built on Solana • Non-custodial
        </span>
        <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight md:text-5xl text-foreground">
          Real-time communities on Solana
        </h1>
        <p className="mt-4 text-pretty text-muted-foreground md:text-lg leading-relaxed">
          A Discord‑like experience powered by wallets, tokens, and programs. Token‑gate channels, verify roles by
          wallet, and moderate with programmable rules.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" className="min-w-[140px]">Launch App</Button>
          <Button size="lg" variant="secondary" asChild className="min-w-[140px]">
            <a href="#docs">Read the docs</a>
          </Button>
        </div>
      </div>

      {/* Visual preview */}
      <div className="mt-10 md:mt-14">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-border bg-card shadow-xl">
          <img
            src="/images/hero-ui.jpg"
            alt="A Discord-like Solana chat interface with channels, roles, and messages."
            className="w-full h-auto"
            width={1200}
            height={720}
          />
        </div>
        <p className="sr-only">Interface preview: channels sidebar, main chat area, and action bar.</p>
      </div>
    </section>
  )
}
