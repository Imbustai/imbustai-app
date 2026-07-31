import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { letterContent } from './LetterContent.css';

export type LetterContentProps = {
  markdown: string;
  className?: string;
};

/** The only renderer for persisted Letter Markdown. */
export function LetterContent({ markdown, className }: LetterContentProps) {
  return (
    <div className={[letterContent, className].filter(Boolean).join(' ')} data-slot="letter-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
