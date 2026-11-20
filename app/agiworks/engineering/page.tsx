import type { Metadata } from "next";
import Footer from "@/components/Footer";
import AuthorityHub from "@/components/authority/AuthorityHub";
import { generateSeoMetadata } from "@/lib/seo/metadata";
export const metadata:Metadata = generateSeoMetadata({brand:"agiworks",path:"/engineering"});
export default function Page(){return <div className="relative min-h-screen overflow-x-hidden"><div className="pt-[76px] sm:pt-[88px]"><AuthorityHub brand="agiworks" /></div><Footer/></div>;}
