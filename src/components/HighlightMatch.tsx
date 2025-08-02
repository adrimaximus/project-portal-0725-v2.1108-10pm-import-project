import React from 'react';

interface HighlightMatchProps {
  text: string;
  query: string;
}

const HighlightMatch: React.FC<HighlightMatchProps> = ({ text, query }) => {
  if (!query.trim()) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <span key={index} className="font-bold text-foreground">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
};

export default HighlightMatch;