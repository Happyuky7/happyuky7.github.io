import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import 'highlight.js/styles/github-dark.css';
import { HiArrowLeft } from 'react-icons/hi';

import { useLanguage } from '@i18n/LanguageContext';
import { withLang } from '@i18n/path';
import VideoBackground from '@/components/videoBackground/VideoBackground';
import ProjectDetailInfo from "@/components/projects/ProjectDetailInfo";
import ProjectReadme from "@/components/projects/ProjectReadme";
import { publicPath } from '@/utils/publicPath';


// Type definitions
interface ReadmeError {
    status: number | 'invalid' | 'network';
}

interface Project {
    name: string;
    displayName?: string;
    id?: string;
    github?: string;
    readme?: string;
    [key: string]: any;
}

const ProjectsDetails: React.FC = () => {

    const { slug } = useParams<{ slug: string }>();
    const { t, language } = useLanguage();

    const [project, setProject] = useState<Project | null>(null);
    const [readme, setReadme] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [githubData, setGithubData] = useState<any>(null);
    const [readmeError, setReadmeError] = useState<ReadmeError | null>(null);
    const [readmeBaseUrl, setReadmeBaseUrl] = useState<string | null>(null); // To resolve relative links in the README

    // Utility function to validate markdown content
    const isValidMarkdown = (text: string): boolean => {
        // Check if it's not HTML (simple check for HTML tags)
        const htmlPattern = /<html|<body|<!DOCTYPE/i;
        return !htmlPattern.test(text.trim());
    };

    const resolvePublicUrl = (path: string) => {
        const base = import.meta.env.BASE_URL || '/';
        const cleanBase = base.endsWith('/') ? base : `${base}/`;
        const cleanPath = (path || '').startsWith('/') ? (path || '').slice(1) : (path || '');
        return `${cleanBase}${cleanPath}`.replace(/\/+/g, '/');
    };

    useEffect(() => {
        loadProjects();
    }, [slug]);

    const loadProjects = async () => {
        try {

            const response = await fetch(publicPath('/jsons/projects-real.json'));
            if (!response.ok) {
                throw new Error('Network response was not ok');
            };

            const data = await response.json();
            
            // Validate that data is an array
            if (!Array.isArray(data)) {
                console.error('Projects data is not an array:', data);
                setError(true);
                setLoading(false);
                return;
            }

            console.log('Loaded projects data:', data.length, 'projects');
            console.log('Raw slug from URL:', slug);
            
            // Decode the URL slug to handle encoded characters like %7C (|)
            const decodedSlug = slug ? decodeURIComponent(slug) : '';
            console.log('Decoded slug:', decodedSlug);
            
            // Filter out invalid projects first
            const validProjects = data.filter((p: any) => p && typeof p === 'object' && p.name);
            console.log('Valid projects with names:', validProjects.length);

            const getProjectSlug = (p: any) => createSlug(p?.id || p?.name);

            const foundProject = validProjects.find((p: any) => {                
                const projectSlug = getProjectSlug(p);
                
                // Test specifically for the problematic project
                if (p.name.includes('All options Projects')) {
                    console.log('=== DEBUGGING PROBLEMATIC PROJECT ===');
                    console.log('Project name:', p.name);
                    console.log('Generated slug:', projectSlug);
                    console.log('URL slug (raw):', slug);
                    console.log('URL slug (decoded):', decodedSlug);
                    console.log('Match with decoded?', projectSlug === decodedSlug);
                    console.log('Match with raw?', projectSlug === slug);
                }
                
                console.log('Comparing slugs:', { 
                    projectName: p.name, 
                    projectId: p.id,
                    projectSlug, 
                    decodedSlug,
                    rawSlug: slug,
                    match: projectSlug === decodedSlug
                });
                return projectSlug === decodedSlug;
            });

            if (!foundProject || (foundProject as any)?.hidden) {
                console.log('Project not found for slug:', slug);
                setError(true);
                setLoading(false);
                return;
            }

            setProject(foundProject);

            // Load GitHub stats if github URL exists
            if (foundProject.github) {
                await loadGithubStats(foundProject.github);
            }

            // Load README with priority: custom readme URL > local readme file > github auto-fetch
            if (foundProject.readme) {
                // Check if readme exists (either URL or local path)
                if (foundProject.readme.startsWith('http')) {
                    // External URL (like GitHub raw URL)
                    if (!foundProject.readme.toLowerCase().endsWith('.md')) {
                        console.log('README URL does not end in .md:', foundProject.readme);
                        setReadmeError({ status: 'invalid' });
                    } else {
                        console.log('Loading external README URL:', foundProject.readme);
                        await loadCustomReadme(foundProject.readme);
                    }
                } else {
                    // Local file path - highest priority when present
                    if (!foundProject.readme.toLowerCase().endsWith('.md')) {
                        console.log('README path does not end in .md:', foundProject.readme);
                        setReadmeError({ status: 'invalid' });
                    } else {
                        console.log('Loading local README file:', foundProject.readme);
                        await loadCustomReadme(foundProject.readme);
                    }
                }
            } else if (foundProject.github) {
                // Only fallback to GitHub auto-fetch if no custom readme is specified
                console.log('No custom README found, trying GitHub auto-fetch...');
                await loadGithubReadme(foundProject.github);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error loading project:', err);
            setError(true);
            setLoading(false);
        }
    };

    const loadGithubStats = async (githubUrl: string) => {
        try {
            // Extract owner and repo from GitHub URL
            const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (!match) {
                console.log('No match found for GitHub URL:', githubUrl);
                return;
            }

            const [, owner, repo] = match;
            console.log('Loading GitHub stats for:', owner, repo);

            // Fetch GitHub repo data
            const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
            if (repoResponse.ok) {
                const repoData = await repoResponse.json();
                setGithubData(repoData);
                console.log('GitHub stats loaded successfully');
            } else {
                console.log('Failed to load repo stats:', repoResponse.status);
            }
        } catch (err) {
            console.error('Error loading GitHub stats:', err);
        }
    };

    const loadGithubReadme = async (githubUrl: string) => {
        try {
            // Extract owner and repo from GitHub URL
            const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (!match) {
                console.log('No match found for GitHub URL:', githubUrl);
                return;
            }

            const [, owner, repo] = match;
            console.log('Loading README for:', owner, repo);

            // Try master first, then main (some repos still use master)
            setReadmeBaseUrl(`https://github.com/${owner}/${repo}/blob/master`);

            console.log('Fetching README from master branch...');
            const readmeResponse = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`);

            if (!readmeResponse.ok) {
                if (readmeResponse.status === 429) {
                    console.log('Rate limit exceeded (429)');
                    setReadmeError({ status: 429 });
                    return;
                }

                console.log('Master branch failed, trying main branch...');
                setReadmeBaseUrl(`https://github.com/${owner}/${repo}/blob/main`);

                const mainResponse = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`);

                if (mainResponse.ok) {
                    const text = await mainResponse.text();
                    if (isValidMarkdown(text)) {
                        setReadme(text);
                        setReadmeError(null);
                        console.log('README loaded from main branch');
                    } else {
                        console.log('Invalid README content (appears to be HTML)');
                        setReadmeError({ status: 'invalid' });
                    }
                } else {
                    if (mainResponse.status === 429) {
                        console.log('Rate limit exceeded (429)');
                        setReadmeError({ status: 429 });
                    } else if (mainResponse.status === 404) {
                        console.log('README not found (404)');
                        setReadmeError({ status: 404 });
                    } else {
                        console.log('Failed to load README:', mainResponse.status);
                        setReadmeError({ status: mainResponse.status });
                    }
                }
            } else {
                const text = await readmeResponse.text();
                if (isValidMarkdown(text)) {
                    setReadme(text);
                    setReadmeError(null);
                    console.log('README loaded from master branch');
                } else {
                    console.log('Invalid README content (appears to be HTML)');
                    setReadmeError({ status: 'invalid' });
                }
            }
        } catch (err) {
            console.error('Error loading GitHub README:', err);
            setReadmeError({ status: 'network' });
        }
    };

    const loadCustomReadme = async (readmePath: string) => {
        try {
            console.log('Loading custom README from:', readmePath);
            
            // Determine if it's a local file or external URL
            const isLocalFile = !readmePath.startsWith('http');
            const supportedLangPrefix = /^\/(en|es|ja|jp|zh|pt|pl|de|ru|th|fil|fr|ko)\//i;
            const normalizedPath = isLocalFile ? readmePath.replace(supportedLangPrefix, '/') : readmePath;

            const candidates = isLocalFile
                ? [normalizedPath]
                : [readmePath];

            if (isLocalFile && normalizedPath.includes('/projects-content/')) {
                candidates.push(normalizedPath.replace('/projects-content/', '/proyects-content/'));
            }
            if (isLocalFile && normalizedPath.includes('/proyects-content/')) {
                candidates.push(normalizedPath.replace('/proyects-content/', '/projects-content/'));
            }
            
            console.log('README type:', isLocalFile ? 'Local file' : 'External URL');

            let lastStatus: number | null = null;

            for (const candidate of candidates) {
                const url = isLocalFile ? resolvePublicUrl(candidate) : candidate;
                console.log('Fetching from:', url);

                const response = await fetch(url);
                if (!response.ok) {
                    lastStatus = response.status;
                    continue;
                }

                const text = await response.text();
                if (!isValidMarkdown(text)) {
                    console.log('Invalid README content (appears to be HTML)');
                    setReadmeError({ status: 'invalid' });
                    return;
                }

                setReadme(text);
                setReadmeError(null);

                if (isLocalFile) {
                    const baseDir = url.replace(/\/[^/]+$/, '');
                    setReadmeBaseUrl(new URL(`${baseDir}/`, window.location.origin).toString().replace(/\/$/, ''));
                }

                console.log('Custom README loaded successfully, length:', text.length);
                console.log('README type loaded:', isLocalFile ? 'Local file' : 'External URL');
                return;
            }

            console.log('Failed to load custom README from all candidates');
            if (lastStatus === 429) {
                setReadmeError({ status: 429 });
            } else if (lastStatus === 404 || lastStatus === null) {
                setReadmeError({ status: 404 });
            } else {
                setReadmeError({ status: lastStatus });
            }
        } catch (err) {
            console.error('Error loading custom README:', err);
            setReadmeError({ status: 'network' });
        }
    };

    const createSlug = (name: string | undefined | null): string => {
        if (!name || typeof name !== 'string') {
            return '';
        }
        return name
            .toLowerCase()
            .trim()
            // Replace spaces with hyphens
            .replace(/\s+/g, '-')
            // Replace special characters but keep some meaningful ones
            .replace(/[^\w\-()|\[\]]/g, '-')
            // Replace multiple consecutive hyphens with a single one
            .replace(/-+/g, '-')
            // Remove leading and trailing hyphens
            .replace(/^-+|-+$/g, '');
    };

    if (loading) {
        return (
            <>
                <VideoBackground videoSrc='/assets/video/background6.gif' overlay={true} />
                <div className="relative z-10">
                    <div className="min-h-screen flex items-center justify-center pt-20">
                        <div className='text-center'>
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-xl text-gray-300">{t('projectsDetails.loading')}</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (error || !project) {
        return (
            <>
                <VideoBackground videoSrc='/assets/video/background.mp4' overlay={true} />
                <div className="relative z-10">
                    <div className="min-h-screen flex items-center justify-center pt-20">
                        <div className="text-center card-custom bg-dark-lighter/85 max-w-md ">
                            <img
                                src={publicPath('/assets/img/error-image-logo1.png')}
                                alt="Error"
                                className="mx-auto mb-4 w-64 h-64 object-cover object-[50%_15%] rounded-lg"
                                loading="eager"
                                decoding="async"
                            />
                            <h2 className="text-2xl font-bold mb-2">{t('projectsDetails.error.loading')}</h2>
                            <p className="text-gray-300 mb-6">
                                {t('projectsDetails.error.description')}
                                {/* Only in Dev Mode (Uncomment for Dev Mode) */}
                                {/*(<>
                                    <br />
                                    <span className="text-sm text-yellow-400">{JSON.stringify(error)}</span>
                                    <br />
                                    <span className="text-sm text-red-400">
                                        Error Message: {errorMsg ? errorMsg.toString() : 'Unknown error'}
                                    </span>
                                </>)*/}
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn-primary"
                            >
                                {t('projectsDetails.refreshPage')}
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>

            <VideoBackground videoSrc="/assets/video/background6.gif" overlay={true} />

            <div className="relative z-10">

                <section className="pt-24 px-4">
                    <div className="max-w-5xl mx-auto">

                        {/* Back Button */}
                        <Link
                            to={withLang(language, "/projects")}
                            className="inline-flex items-center text-primary hover:text-blue-400 transition-colors mb-8 group"
                        >
                            <HiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                            {t('projectsDetails.backToProjects')}
                        </Link>
                    </div>
                </section>

                {/* Project Detail Info Section */}
                <section className="px-4">
                    <div className="max-w-5xl mx-auto">
                        {/* Project Detail Info Component */}
                        <ProjectDetailInfo project={project} githubData={githubData} />
                    </div>
                </section>

                {/* README Section */}
                <section className="pb-20 px-4">
                    <div className="max-w-5xl mx-auto">
                        {/* README Component */}
                        <ProjectReadme 
                            readme={readme} 
                            readmeError={readmeError} 
                            readmeBaseUrl={readmeBaseUrl} 
                        />
                    </div>
                </section>

            </div>

        </>
    );
};

export default ProjectsDetails;
