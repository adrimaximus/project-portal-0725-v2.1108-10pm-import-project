// @ts-nocheck
import { analyzeDuplicates } from './analyzeDuplicates.ts';
import { aiMergeContacts } from './aiMergeContacts.ts';
import { articleWriter } from './articleWriter.ts';
import { generateCaption } from './generateCaption.ts';
import { generateMoodInsight } from './generateMoodInsight.ts';
import { suggestIcon } from './suggestIcon.ts';
import { analyzeProjects } from './analyzeProjects.ts';
import { generateInsight } from './generateInsight.ts';

export const featureHandlers = {
  'analyze-duplicates': analyzeDuplicates,
  'ai-merge-contacts': aiMergeContacts,
  'generate-article-from-title': articleWriter,
  'expand-article-text': articleWriter,
  'improve-article-content': articleWriter,
  'summarize-article-content': articleWriter,
  'generate-caption': generateCaption,
  'generate-mood-insight': generateMoodInsight,
  'suggest-icon': suggestIcon,
  'analyze-projects': analyzeProjects,
  'generate-insight': generateInsight,
};