import { Navigate } from "react-router-dom"
import { Title } from "react-head"
import { Hero } from "@/features/landing/Hero"
import { Categories } from "@/features/landing/Categories"
import { HowItWorks } from "@/features/landing/HowItWorks"
import { Audiences } from "@/features/landing/Audiences"
import { Faq } from "@/features/landing/Faq"
import { FinalCta } from "@/features/landing/FinalCta"

export default function HomePage({ user }: { user?: unknown }) {
  if (user) return <Navigate to="/dashboard" />

  return (
    <main>
      <Title>EventPro | Book event suppliers in one place</Title>
      <Hero />
      <Categories />
      <HowItWorks />
      <Audiences />
      <Faq />
      <FinalCta />
    </main>
  )
}
