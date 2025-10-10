import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    title: "Wallet‑native identity",
    body: "Sign in with your Solana wallet. Roles and profiles automatically follow your address.",
    image: "/images/feature-wallet.jpg",
    alt: "Solana wallet connect illustration",
  },
  {
    title: "Token‑gated channels",
    body: "Gate access by SPL tokens, NFTs, or program conditions. Fine‑grained control without bots.",
    image: "/images/feature-token.jpg",
    alt: "Token-gated channel concept with a lock and coin",
  },
  {
    title: "Lightning‑fast messaging",
    body: "Real‑time conversations with low latency and smart caching. Built for busy communities.",
    image: "/images/feature-realtime.jpg",
    alt: "Lightning bolt over chat messages",
  },
  {
    title: "Programmable moderation",
    body: "Automate rules with on‑chain signals and webhooks. Keep conversations healthy at scale.",
    image: "/images/feature-moderation.jpg",
    alt: "Shield representing automated moderation",
  },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-3xl font-semibold md:text-4xl text-foreground">Everything your server needs</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Powerful building blocks to run tokenized communities—no custodial accounts, no complexity.
        </p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:mt-10 md:gap-6">
        {features.map((f) => (
          <Card key={f.title} className="border-border hover:border-accent transition-all duration-300 hover:scale-[1.02]">
            <CardHeader>
              <img
                src={f.image || "/placeholder.svg"}
                alt={f.alt}
                width={640}
                height={360}
                className="mb-3 h-28 w-full rounded-md object-cover"
              />
              <CardTitle className="text-lg text-foreground">{f.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed">{f.body}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
