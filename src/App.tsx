import { lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";

import { LanguageProvider } from "@i18n/LanguageContext";
import LanguageRouteSync from "@i18n/LanguageRouteSync";
import ScrollToHash from "@components/routing/ScrollToHash";

import { DeviceProvider } from "@/device/DeviceContext";
import { BackgroundProvider } from "@/background/BackgroundContext";

import AppLayout from "@/layouts/AppLayout";


const Home = lazy(() => import("@pages/Home"));
const Projects = lazy(() => import("@pages/Projects"));
const ProjectsDetails = lazy(() => import("@pages/ProjectsDetails"));
const Blog = lazy(() => import("@pages/Blog"));
const BlogPost = lazy(() => import("@pages/BlogPost"));
const Contact = lazy(() => import("@pages/Contact"));
const ErrorRoute = lazy(() => import("@pages/erros/ErrorRoute"));
const NotFound = lazy(() => import("@pages/erros/404"));

// DEV-only routes (should not be included in production build output)
const DevBlogEditorHub = import.meta.env.DEV ? lazy(() => import("./dev/blogeditor/Hub")) : null;
const DevBlogEditorEditor = import.meta.env.DEV ? lazy(() => import("./dev/BlogEditor")) : null;
const DevHubDev = import.meta.env.DEV ? lazy(() => import("./dev/HubDev")) : null;
const DevTagsManager = import.meta.env.DEV ? lazy(() => import("./dev/TagsManager")) : null;
const DevProjectsEditorHub = import.meta.env.DEV ? lazy(() => import("./dev/projectseditor/Hub")) : null;
const DevProjectsEditorEditor = import.meta.env.DEV ? lazy(() => import("./dev/ProjectsEditor")) : null;

function getPreferredLang() {
  const saved = localStorage.getItem("language");
  const savedNorm = (saved || '').toLowerCase() === 'jp' ? 'ja' : saved;
  const browser = navigator.language.split("-")[0];
  const supported = ["en", "es", "ja", "fr", "de", "pt", "pl", "ru", "zh", "ko", "th", "fil"];
  return savedNorm || (supported.includes(browser) ? browser : "en");
}

/*function RedirectMissingBlogPrefix() {
  const { year, month, slug } = useParams();
  const y = year;
  const m = month;
  const s = slug;

  if (!y || !m || !s) return <Navigate to="blog" replace />;
  return <Navigate to={`blog/${y}/${m}/${s}`} replace />;
}*/

function LangGuard({ children }: { children: React.ReactNode }) {
  const { lang } = useParams();
  const location = useLocation();

  const supported = ["en", "es", "ja", "fr", "de", "pt", "pl", "ru", "zh", "ko", "th", "fil"];
  // Legacy alias: redirect /jp/* to /ja/*
  if (lang && lang.toLowerCase() === 'jp') {
    const targetPath = location.pathname.replace(/^\/(jp)(?=\/|$)/i, '/ja');
    return <Navigate to={targetPath + location.search + location.hash} replace />;
  }
  if (lang && supported.includes(lang)) return <>{children}</>;

  // If the first path segment isn't a supported lang, treat it as an unprefixed URL.
  const preferred = getPreferredLang();
  const pathname = location.pathname || "/";
  const parts = pathname.split("/").filter(Boolean);
  const rest = parts.length > 1 ? `/${parts.slice(1).join("/")}` : "/";
  return <Navigate to={`/${preferred}${rest}` + location.search + location.hash} replace />;
}

function RedirectLegacyJpToJa() {
  const location = useLocation();
  const targetPath = location.pathname.replace(/^\/(jp)(?=\/|$)/i, '/ja');
  return <Navigate to={targetPath + location.search + location.hash} replace />;
}

function RedirectLegacyBlogLang() {
  const { lang, year, month, slug, postLang } = useParams();
  const location = useLocation();
  const uiLang = (lang || getPreferredLang()).toLowerCase();
  const contentLang = (postLang || '').toLowerCase();

  const base = year && month && slug ? `/blog/${year}/${month}/${slug}` : slug ? `/blog/${slug}` : "/blog";
  const params = new URLSearchParams(location.search);
  if (contentLang && contentLang !== uiLang) params.set('contentLang', contentLang);
  if (contentLang && contentLang === uiLang) params.delete('contentLang');

  const qs = params.toString();
  const target = `/${uiLang}${base}`.replace(/\/\//g, "/") + (qs ? `?${qs}` : "") + location.hash;
  return <Navigate to={target} replace />;
}

function RedirectLegacyDevBlogEditorToHub() {
  const { lang } = useParams();
  const uiLang = (lang || getPreferredLang()).toLowerCase();
  return <Navigate to={`/${uiLang}/blogeditor`} replace />;
}


export default function App() {
  return (
    <Router>
      <DeviceProvider>
        <LanguageProvider>
          <BackgroundProvider>
            <LanguageRouteSync />
            <ScrollToHash />

          <Routes>
            {/* Legacy language alias: /jp/* -> /ja/* */}
            <Route path="/jp/*" element={<RedirectLegacyJpToJa />} />
            {/* root (global) */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Home />} />

              {/* Error preview routes */}
              <Route path="error/:code" element={<ErrorRoute />} />
              <Route path="test/error/:code" element={<ErrorRoute />} />

              <Route path="projects" element={<Projects />} />
              <Route path="projects/page/:pageNum" element={<Projects />} />
              <Route path="project/:slug" element={<ProjectsDetails />} />
              <Route path="projects/:slug" element={<ProjectsDetails />} />

              <Route path="blog" element={<Blog />} />
              <Route path="blog/page/:pageNum" element={<Blog />} />
              <Route path="blog/:year/:month/:slug" element={<BlogPost />} />
              <Route path="blog/:slug" element={<BlogPost />} />

              <Route path="contact" element={<Contact />} />

              {DevBlogEditorHub && DevBlogEditorEditor ? (
                <>
                  <Route path="blogeditor" element={<DevBlogEditorHub />} />
                  <Route path="blogeditor/editor" element={<DevBlogEditorEditor />} />
                  <Route path="blogeditor/editor/:slug" element={<DevBlogEditorEditor />} />
                  <Route path="__blog-editor" element={<Navigate to="/blogeditor" replace />} />
                </>
              ) : null}

              {DevHubDev ? <Route path="hubdev" element={<DevHubDev />} /> : null}
              {DevTagsManager ? <Route path="hubdev/tags" element={<DevTagsManager />} /> : null}

              {DevProjectsEditorHub && DevProjectsEditorEditor ? (
                <>
                  <Route path="projectseditor" element={<DevProjectsEditorHub />} />
                  <Route path="projectseditor/editor" element={<DevProjectsEditorEditor />} />
                  <Route path="projectseditor/editor/:slug" element={<DevProjectsEditorEditor />} />
                </>
              ) : null}

              <Route path="*" element={<NotFound />} />
            </Route>
            
            {/* lang prefix + layout */}
            <Route
              path="/:lang"
              element={
                <LangGuard>
                  <AppLayout />
                </LangGuard>
              }
            >
              <Route index element={<Home />} />

              {/* Error preview routes */}
              <Route path="error/:code" element={<ErrorRoute />} />
              <Route path="test/error/:code" element={<ErrorRoute />} />

              <Route path="projects" element={<Projects />} />
              <Route path="projects/page/:pageNum" element={<Projects />} />
              <Route path="project/:slug" element={<ProjectsDetails />} />
              <Route path="projects/:slug" element={<ProjectsDetails />} />

              <Route path="blog" element={<Blog />} />
              <Route path="blog/page/:pageNum" element={<Blog />} />
              <Route path="blog/:year/:month/:slug/:postLang" element={<RedirectLegacyBlogLang />} />
              <Route path="blog/:year/:month/:slug" element={<BlogPost />} />
              <Route path="blog/:slug/:postLang" element={<RedirectLegacyBlogLang />} />
              <Route path="blog/:slug" element={<BlogPost />} />

              <Route path="contact" element={<Contact />} />

              {DevBlogEditorHub && DevBlogEditorEditor ? (
                <>
                  <Route path="blogeditor" element={<DevBlogEditorHub />} />
                  <Route path="blogeditor/editor" element={<DevBlogEditorEditor />} />
                  <Route path="blogeditor/editor/:slug" element={<DevBlogEditorEditor />} />
                  <Route path="__blog-editor" element={<RedirectLegacyDevBlogEditorToHub />} />
                </>
              ) : null}

              {DevHubDev ? <Route path="hubdev" element={<DevHubDev />} /> : null}
              {DevTagsManager ? <Route path="hubdev/tags" element={<DevTagsManager />} /> : null}

              {DevProjectsEditorHub && DevProjectsEditorEditor ? (
                <>
                  <Route path="projectseditor" element={<DevProjectsEditorHub />} />
                  <Route path="projectseditor/editor" element={<DevProjectsEditorEditor />} />
                  <Route path="projectseditor/editor/:slug" element={<DevProjectsEditorEditor />} />
                </>
              ) : null}

              {/* 404 for any unknown route within a language */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          </BackgroundProvider>
        </LanguageProvider>
      </DeviceProvider>
    </Router>
  );
}
