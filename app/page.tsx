import HeroSection from '@/components/landing/HeroSection';
import FeaturesGrid from '@/components/landing/FeaturesGrid';
import CoursesCatalog from '@/components/landing/CoursesCatalog';
import VerifyCredential from '@/components/landing/VerifyCredential';
import Footer from '@/components/landing/Footer';
import Navbar from '@/components/landing/Navbar';
import RolePortals from '@/components/landing/RolePortals';

export default function LandingPage() {
  return (
    <main className="viq-page min-h-screen selection:bg-orange-500 selection:text-white bg-[#07090E] text-slate-100">
      {/* 1. Floating Navigation */}
      <Navbar />

      {/* 2. Hero Section */}
      <HeroSection />
      
      {/* 4. Solutions & Bento Features */}
      <FeaturesGrid />

      {/* 5. Industrial Training Programs Catalog */}
      <CoursesCatalog />

      {/* 6. Public Certificate & Credential Verification Desk */}
      <VerifyCredential />

      {/* 7. Enterprise Footer */}
      <Footer />
    </main>
  );
}