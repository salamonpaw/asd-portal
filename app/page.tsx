import { LandingPage } from "@/components/landing/LandingPage";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default function Home() {
  return <LandingPage />;
}
