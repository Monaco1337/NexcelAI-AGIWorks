import { permanentRedirect } from "next/navigation";
/** Permanent decommission of public pricing; no calculator or prices served. */
export default function Page(){ permanentRedirect("/beratung"); }
