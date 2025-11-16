import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore - Docusaurus theme module
import Layout from '@theme/Layout';

export default function StorybookPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let timeoutId: NodeJS.Timeout;

    const handleLoad = () => {
      console.log('Storybook iframe loaded');
      // Give Storybook a moment to initialize before hiding loader
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    };

    const handleError = () => {
      console.error('Storybook iframe failed to load');
      setHasError(true);
      setIsLoading(false);
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    // Timeout after 10 seconds
    timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('Storybook loading timeout');
        setIsLoading(false);
      }
    }, 10000);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  return (
    <Layout title="Components" description="Storybook Component Library" noFooter>
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        margin: 0,
        padding: 0,
        overflow: 'hidden'
      }}>
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            textAlign: 'center'
          }}>
            <p>Loading Storybook...</p>
          </div>
        )}
        {hasError && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            textAlign: 'center',
            padding: '20px'
          }}>
            <p>Failed to load Storybook.</p>
            <a href="/storybook/index.html" target="_blank" rel="noopener noreferrer">
              Open Storybook in a new tab
            </a>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src="/storybook/index.html"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s'
          }}
          title="Storybook Component Library"
        />
      </div>
    </Layout>
  );
}

