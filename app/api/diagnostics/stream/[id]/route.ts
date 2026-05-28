/**
 * GET /api/diagnostics/stream/[id]   (Server-Sent Events)
 *
 * Live-Status der Analyse. Liefert:
 *   - phase   → { kind: "phase", phase: AnalysisPhase }
 *   - status  → { kind: "status", status: AnalysisStatus }
 *   - event   → { kind: "event", event: AnalysisEvent }
 *   - done    → { kind: "done" }   (Stream schließt direkt danach)
 *
 * Wenn die Analyse beim Connect schon fertig ist, wird sofort der gesamte
 * Replay-Buffer ausgeliefert und der Stream geschlossen.
 */

import { NextRequest } from "next/server";
import { analysisRepo } from "@/lib/diagnostics/db";
import { subscribe, type BusMessage } from "@/lib/diagnostics/eventBus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const analysis = analysisRepo.findById(params.id);
  if (!analysis) {
    return new Response("Analyse nicht gefunden", { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const safeEnqueue = (bytes: Uint8Array) => {
        if (closed) return;
        try {
          controller.enqueue(bytes);
        } catch {
          closed = true;
        }
      };
      const write = (msg: BusMessage) => {
        safeEnqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
      };
      const closeStream = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* noop */
        }
      };

      // Heartbeat — Proxies sollen die Verbindung nicht killen.
      const heartbeat = setInterval(() => {
        safeEnqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
      }, 15_000);

      safeEnqueue(encoder.encode(`: connected ${Date.now()}\n\n`));

      // Erster Snapshot: aktueller Status + alle initial-Phasen aus DB.
      write({ kind: "status", status: analysis.status });
      for (const phase of analysis.phases) {
        write({ kind: "phase", phase });
      }

      // Ein einziger Subscriber — der schreibt live UND erkennt "done".
      const sub = subscribe(params.id, (msg) => {
        write(msg);
        if (msg.kind === "done") {
          clearInterval(heartbeat);
          sub.unsubscribe();
          closeStream();
        }
      });
      // Replay bereits gebufferter Nachrichten (die zwischen Analyse-Start und
      // unserem subscribe gefeuert wurden). Subscribe ist bereits aktiv für
      // alle künftigen Messages.
      for (const msg of sub.replay) write(msg);

      // Wenn beim Connect schon fertig: direkt schließen.
      const fresh = analysisRepo.findById(params.id);
      if (
        fresh &&
        (fresh.status === "completed" ||
          fresh.status === "partial" ||
          fresh.status === "failed")
      ) {
        write({ kind: "done" });
        clearInterval(heartbeat);
        sub.unsubscribe();
        closeStream();
        return;
      }

      // Client trennt → cleanup
      req.signal.addEventListener(
        "abort",
        () => {
          clearInterval(heartbeat);
          sub.unsubscribe();
          closeStream();
        },
        { once: true },
      );
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
