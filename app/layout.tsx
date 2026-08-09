import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = `${protocol}://${host}`;
  return {
    title: "旅妆地图｜找到你想拍的那一套",
    description: "从真实旅拍案例出发，查清妆造店与摄影方，统一提交景区妆造预约需求并安排出片行程。",
    metadataBase: new URL(base),
    openGraph: { title: "旅妆地图", description: "从喜欢的一套，到能出发的一天", images: [{ url: `${base}/og-v2.webp`, width: 1536, height: 1024 }] },
    twitter: { card: "summary_large_image", title: "旅妆地图", description: "从喜欢的一套，到能出发的一天", images: [`${base}/og-v2.webp`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
