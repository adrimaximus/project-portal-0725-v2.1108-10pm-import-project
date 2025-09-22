import React from 'react';

interface EmbedRendererProps {
  content: string;
}

const EmbedRenderer: React.FC<EmbedRendererProps> = ({ content }) => {
  const isIframe = content.trim().startsWith('<iframe');

  if (isIframe) {
    return (
      <div
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  return (
    <iframe
      src={content}
      className="w-full h-full border-0"
      allowFullScreen
    />
  );
};

export default EmbedRenderer;