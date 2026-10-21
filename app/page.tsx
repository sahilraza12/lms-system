import HeroSection from '@/components/landing/HeroSection';
import FeaturesGrid from '@/components/landing/FeaturesGrid';
import CoursesCatalog from '@/components/landing/CoursesCatalog';
import VerifyCredential from '@/components/landing/VerifyCredential';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="viq-page min-h-screen selection:bg-orange-500 selection:text-white">
      {/* 1. Hero Section (Includes Floating Navbar & Multi-Video Background) */}
      <HeroSection />

      {/* 2. Solutions & Bento Grid */}
      <FeaturesGrid />

      {/* 3. Industrial Training Programs Catalog */}
      <CoursesCatalog />

      {/* 4. Public Credential Verification Section */}
      <VerifyCredential />

      {/* 5. Enterprise Footer */}
      <Footer />
    </main>
  );
}