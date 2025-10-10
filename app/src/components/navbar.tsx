"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Menu, X } from "lucide-react"

export function Navbar() {
  const [isMounted, setIsMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="Solana Chat home">
          <img
            src="/images/solana-discord-logo.jpg"
            alt="Solana Chat logo"
            className="h-7 w-7 rounded-sm"
            width={28}
            height={28}
          />
          <span className="font-semibold text-foreground">Solana Chat</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
            Features
          </Link>
          <Link href="#docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
            Docs
          </Link>
          <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
            Pricing
          </Link>
        </div>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="secondary" asChild>
            <Link href="#learn">Learn more</Link>
          </Button>
          <Button asChild>
            <Link href="#app">Open App</Link>
          </Button>
          {/* Wallet Button */}
          {isMounted && (
            <WalletMultiButton
              style={{ 
                backgroundColor: '#5865f2', 
                color: 'white',
                borderRadius: '3px',
                border: 'none',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                height: '36px',
                minHeight: '36px'
              }}
            />
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 hover:bg-accent rounded-md transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-4 space-y-4">
            {/* Mobile Navigation Links */}
            <div className="flex flex-col space-y-3">
              <Link 
                href="#features" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="#docs" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Docs
              </Link>
              <Link 
                href="#pricing" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
            </div>
            
            {/* Mobile Action Buttons */}
            <div className="flex flex-col space-y-3 pt-4 border-t border-border">
              <Button variant="secondary" asChild>
                <Link href="#learn" onClick={() => setIsMobileMenuOpen(false)}>Learn more</Link>
              </Button>
              <Button asChild>
                <Link href="#app" onClick={() => setIsMobileMenuOpen(false)}>Open App</Link>
              </Button>
              {/* Mobile Wallet Button */}
              {isMounted && (
                <div className="w-full">
                  <WalletMultiButton
                    style={{ 
                      backgroundColor: '#5865f2', 
                      color: 'white',
                      borderRadius: '3px',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      width: '100%',
                      height: '36px',
                      minHeight: '36px'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
