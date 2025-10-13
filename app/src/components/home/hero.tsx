'use client'
import { Button } from "@/components/ui/button"
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useEffect, useState } from 'react'

export function Hero() {
  const { connected } = useWallet()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleEnterShipyard = () => {
    if (connected) {
      router.push('/chat')
    } else {
      // You could show a toast message or trigger wallet modal
      // For now, we'll do nothing - user needs to connect wallet first
    }
  }

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
          {isClient && connected ? (
            <Button size="lg" className="min-w-[140px]" onClick={handleEnterShipyard}>
              Enter Shipyard
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <WalletMultiButton
                style={{ 
                  backgroundColor: '#5865f2', 
                  color: 'white',
                  borderRadius: '6px',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  minWidth: '140px',
                  height: '44px',
                }}
              />
              {isClient && <p className="text-xs text-muted-foreground">Connect wallet to enter</p>}
            </div>
          )}
          <Button size="lg" variant="secondary" asChild className="min-w-[140px]">
            <a href="#docs">View Github</a>
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
