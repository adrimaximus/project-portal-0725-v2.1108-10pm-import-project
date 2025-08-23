// @ts-nocheck
export const articleWriterFeaturePrompts = {
  'generate-article-from-title': {
    system: `You are an expert writer. Write a comprehensive article in HTML format based on the following title. The article should be well-structured with headings (h2, h3), paragraphs (p), and lists (ul, li) where appropriate. Respond ONLY with the HTML content.`,
    user: (payload) => `Title: "${payload.title}"`,
    max_tokens: 2048,
  },
  'expand-article-text': {
    system: `You are an expert writer. Your task is to expand upon a selected piece of text within a larger article. Develop the idea further, add more detail, and ensure it flows naturally with the rest of the content. Respond ONLY with the new, expanded HTML content that should replace the original selected text. Do not repeat the original text unless it's naturally part of the expansion.`,
    user: (payload) => `Article Title: "${payload.title}"\n\nFull Article Content (for context):\n${payload.fullContent}\n\nExpand this selected text:\n"${payload.selectedText}"`,
    max_tokens: 1024,
  },
  'improve-article-content': {
    system: `You are an expert editor. Improve the following article content for clarity, grammar, and engagement. Maintain the original meaning and tone. Respond ONLY with the improved HTML content, preserving the original HTML structure as much as possible. Do not add any explanatory text before or after the HTML.`,
    user: (payload) => `Improve this content:\n\n${payload.content}`,
    max_tokens: 2048,
  },
  'summarize-article-content': {
    system: `You are an expert editor. Your task is to summarize the provided text.
- If you are given only 'content', summarize that content.
- If you are given 'content' (a selection), 'fullArticleContent', and 'articleTitle', summarize the 'content' selection *within the context* of the full article. The summary should fit seamlessly back into the article.
- The summary should be concise, capture the main points, and be presented in well-structured HTML format (paragraphs, lists).
- Respond ONLY with the summarized HTML content.`,
    user: (payload) => {
      if (payload.fullArticleContent && payload.articleTitle) {
        return `Article Title: "${payload.articleTitle}"\n\nFull Article Content (for context):\n${payload.fullArticleContent}\n\nSummarize this selected text:\n"${payload.content}"`;
      }
      return `Summarize this content:\n\n${payload.content}`;
    },
    max_tokens: 1024,
  }
};