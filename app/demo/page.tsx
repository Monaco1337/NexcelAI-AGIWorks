import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { verifySession } from "@/lib/auth";
import { findUserById } from "@/lib/demo-users";
import { redirect } from "next/navigation";
import DemoDashboard from "@/components/DemoDashboard";

export default async function DemoPage() {
  const session = await verifySession();

  if (!session) {
    redirect("/login");
  }

  const user = findUserById(session.userId);
  if (!user) {
    redirect("/login");
  }

  const expiresAt = new Date(user.expiresAt);
  const now = new Date();
  if (expiresAt < now) {
    redirect("/login?expired=true");
  }

  if (user.role !== "demo_user" && user.role !== "admin") {
    redirect("/login");
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navigation />
      <DemoDashboard user={user} />
      <Footer />
    </main>
  );
}

