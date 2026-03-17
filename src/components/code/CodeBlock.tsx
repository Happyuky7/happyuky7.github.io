import React, { useState } from 'react';
import { HiClipboard, HiCheck } from 'react-icons/hi';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children, className, ...props }) => {
  const [copied, setCopied] = useState(false);

  // Función recursiva mejorada para extraer texto de children
  const extractText = (node: any): string => {
    if (typeof node === 'string') {
      return node;
    }
    if (typeof node === 'number') {
      return String(node);
    }
    if (Array.isArray(node)) {
      return node.map(extractText).join('');
    }
    if (node?.props?.children) {
      return extractText(node.props.children);
    }
    return '';
  };

  const handleCopy = async () => {
    const textContent = extractText(children);
    
    if (textContent) {
      try {
        await navigator.clipboard.writeText(textContent.trim());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // Determinar si es un bloque de código (no inline)
  const isCodeBlock = className?.includes('language-');

  // Extraer el lenguaje del className
  const getLanguage = (): string | null => {
    if (!className) return null;
    const match = className.match(/language-(\w+)/);
    if (!match) return null;
    
    const lang = match[1];
    
    // Mapeo de nombres de lenguajes a sus versiones más presentables
    const languageMap: { [key: string]: string } = {
      'js': 'JavaScript',
      'javascript': 'JavaScript',
      'ts': 'TypeScript',
      'typescript': 'TypeScript',
      'jsx': 'React JSX',
      'tsx': 'React TSX',
      'py': 'Python',
      'python': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'csharp': 'C#',
      'go': 'Go',
      'rust': 'Rust',
      'php': 'PHP',
      'ruby': 'Ruby',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'dart': 'Dart',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'sass': 'Sass',
      'less': 'Less',
      'json': 'JSON',
      'xml': 'XML',
      'yaml': 'YAML',
      'yml': 'YAML',
      'toml': 'TOML',
      'md': 'Markdown',
      'markdown': 'Markdown',
      'sql': 'SQL',
      'bash': 'Bash',
      'sh': 'Shell',
      'shell': 'Shell',
      'powershell': 'PowerShell',
      'dockerfile': 'Dockerfile',
      'docker': 'Docker',
      'nginx': 'Nginx',
      'apache': 'Apache',
      'conf': 'Config',
      'config': 'Config',
      'ini': 'INI',
      'graphql': 'GraphQL',
      'prisma': 'Prisma',
      'solidity': 'Solidity',
      'vue': 'Vue',
      'svelte': 'Svelte',
      'astro': 'Astro',
      'julia': 'Julia'
    };
    
    return languageMap[lang.toLowerCase()] || lang.toUpperCase();
  };

  const language = getLanguage();

  // Contar líneas de código para ajustar posicionamiento
  const textContent = extractText(children);
  const lineCount = textContent.trim().split('\n').length;
  const isSingleOrDoubleLine = lineCount <= 2;

  if (!isCodeBlock) {
    // Código inline - renderizar normalmente
    return <code className={className} {...props}>{children}</code>;
  }

  // Bloque de código - agregar botón de copiar y badge de lenguaje
  return (
    <div className="relative group">
      {/* Copy Button - En móvil más pequeño y transparente, en desktop con hover */}
      <button
        onClick={handleCopy}
        className={`absolute ${isSingleOrDoubleLine ? 'left-3' : 'right-3'} top-3 p-1.5 md:p-2 rounded-lg bg-dark/60 hover:bg-dark border border-primary/20 hover:border-primary transition-all z-10 shadow-lg opacity-40 md:opacity-0 md:group-hover:opacity-100`}
        title={copied ? '¡Copiado!' : 'Copiar código'}
        aria-label={copied ? 'Code copied' : 'Copy code to clipboard'}
      >
        {copied ? (
          <div className="flex items-center gap-2">
            <HiCheck className="text-green-400 text-base md:text-lg" />
            <span className="text-xs text-green-400 font-semibold whitespace-nowrap hidden md:inline">Copied!</span>
          </div>
        ) : (
          <HiClipboard className="text-gray-400 hover:text-primary text-base md:text-lg transition-colors" />
        )}
      </button>

      {/* Language Badge - En móvil más transparente, en desktop con hover */}
      {language && (
        <div className="absolute right-3 bottom-3 px-2 md:px-2.5 py-0.5 md:py-1 rounded-md bg-primary/5 md:bg-primary/10 border border-primary/20 md:border-primary/30 backdrop-blur-sm z-10 opacity-40 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <span className="text-[0.625rem] md:text-xs font-mono font-semibold text-primary">
            {language}
          </span>
        </div>
      )}

      <code className={className} {...props}>
        {children}
      </code>
    </div>
  );
};

export default CodeBlock;