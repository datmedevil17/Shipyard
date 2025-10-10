import { Hero } from "@/components/home/hero"
import { Features } from "@/components/home/features"
import { CTA } from "@/components/home/cta"
import { Footer } from "@/components/home/footer"

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </main>
  )
}
