import Header from "@/components/layout/header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {children}
      </main>
    </>
  );
}
