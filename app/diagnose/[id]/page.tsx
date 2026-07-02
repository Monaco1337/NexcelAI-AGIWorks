import DiagnosticsReport from "@/components/diagnostics/DiagnosticsReport";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default function DiagnoseDetailPage({ params }: PageProps) {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <DiagnosticsReport analysisId={params.id} />
    </main>
  );
}
