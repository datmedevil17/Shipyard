import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 md:flex-row md:px-6">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Solana Chat. All rights reserved.</p>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="#privacy" className="text-muted-foreground hover:text-foreground transition-colors duration-200">
            Privacy
          </Link>
          <Link href="#terms" className="text-muted-foreground hover:text-foreground transition-colors duration-200">
            Terms
          </Link>
          <Link href="#status" className="text-muted-foreground hover:text-foreground transition-colors duration-200">
            Status
          </Link>
        </nav>
      </div>
    </footer>
  )
}
