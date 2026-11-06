import { Suspense } from "react";
import { Outlet } from "react-router-dom";

import NavBar from "@/components/nav/NavBar";
import Footer from "@/components/footer/Footer";
import MusicWidget from "@/components/music/MusicWidget";

import Seo from "@/seo/Seo";

import "@/App.css";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Seo />
      <NavBar />
      <main className="app-content">
        <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
          <Outlet />
        </Suspense>
      </main>
      <MusicWidget />
      <Footer />
    </div>
  );
}
