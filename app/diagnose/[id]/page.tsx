import DiagnosticsReport from "@/components/diagnostics/DiagnosticsReport";
import Navigation from "@/components/Navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default function DiagnoseDetailPage({ params }: PageProps) {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />
      <DiagnosticsReport analysisId={params.id} />
    </main>
  );
}
