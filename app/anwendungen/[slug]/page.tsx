import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import AuthorityDetail from "@/components/authority/AuthorityDetail";
import { getAuthorityPage, getAuthorityPages } from "@/data/authorityPortfolio";
import { generateSeoMetadata } from "@/lib/seo/metadata";
interface Props {params:{slug:string}}
export function generateStaticParams(){return getAuthorityPages("nexcel").map(p=>({slug:p.slug}));}
export function generateMetadata({params}:Props):Metadata{return generateSeoMetadata({brand:"nexcel",path:`/anwendungen/${params.slug}`});}
export default function Page({params}:Props){const p=getAuthorityPage("nexcel",params.slug);if(!p)notFound();return <div className="relative min-h-screen overflow-x-hidden"><div className="pt-[76px] sm:pt-[88px]"><AuthorityDetail page={p}/></div><Footer/></div>;}
