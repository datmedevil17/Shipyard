import { Button } from "@/components/ui/button"

export function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col items-center justify-between gap-4 rounded-lg border border-border bg-card p-6 text-center md:flex-row md:text-left shadow-lg hover:shadow-xl transition-all duration-300">
        <div>
          <h3 className="text-balance text-2xl font-semibold md:text-3xl text-foreground">Start your Solana community today</h3>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            Create channels, connect wallets, and set token gates in minutes.
          </p>
        </div>
        <div className="flex gap-3">
          <Button size="lg" className="min-w-[140px]">Create a server</Button>
          <Button size="lg" variant="secondary" asChild className="min-w-[120px]">
            <a href="#docs">View docs</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
