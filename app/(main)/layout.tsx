import Header from "@/components/layout/header";
import ScrollingBanner from "@/components/layout/ScrollingBanner";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <ScrollingBanner />
      <main className="min-h-screen">
        {children}
      </main>
    </>
  );
}
