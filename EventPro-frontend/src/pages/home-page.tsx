import { Navigate } from "react-router-dom"
import { Title } from "react-head"
import { LandingHeader } from "@/components/organisms/landing-header"
import { Hero } from "@/components/organisms/hero"
import { Quality } from "@/components/organisms/quality"
import { Categories } from "@/components/organisms/categories"
import { HowItWorks } from "@/components/organisms/how-it-works"
import { Audiences } from "@/components/organisms/audiences"
import { Faq } from "@/components/organisms/faq"
import { FinalCta } from "@/components/organisms/final-cta"
import { LandingFooter } from "@/components/organisms/landing-footer"

export default function HomePage({ user }: { user?: unknown }) {
  if (user) return <Navigate to="/dashboard" />

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Title>EventPro | Book event suppliers in one place</Title>
      <LandingHeader />
      <main>
        <Hero />
        <Quality />
        <Categories />
        <HowItWorks />
        <Audiences />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
