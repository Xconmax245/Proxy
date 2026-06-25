import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import DelegationTypes from "@/components/landing/DelegationTypes";
import HowItWorks from "@/components/landing/HowItWorks";
import DemoSection from "@/components/landing/DemoSection";
import LiveFeed from "@/components/landing/LiveFeed";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import AosInit from "@/components/AosInit";

export default function Home() {
  return (
    <>
      <AosInit />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <DelegationTypes />
        <HowItWorks />
        <DemoSection />
        <LiveFeed />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
