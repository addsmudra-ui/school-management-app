'use server';
/**
 * @fileOverview An AI agent for summarizing detailed news articles into concise versions for reporters.
 *
 * - summarizeArticleForReporter - A function that handles the article summarization process.
 * - SummarizeArticleInput - The input type for the summarizeArticleForReporter function.
 * - SummarizeArticleOutput - The return type for the summarizeArticleForReporter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeArticleInputSchema = z.object({
  detailedArticle: z.string().describe('The detailed news article to be summarized.')
});
export type SummarizeArticleInput = z.infer<typeof SummarizeArticleInputSchema>;

const SummarizeArticleOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the news article in Telugu.')
});
export type SummarizeArticleOutput = z.infer<typeof SummarizeArticleOutputSchema>;

export async function summarizeArticleForReporter(input: SummarizeArticleInput): Promise<SummarizeArticleOutput> {
  return summarizeArticleFlow(input);
}

const summarizeArticlePrompt = ai.definePrompt({
  name: 'summarizeArticlePrompt',
  input: {schema: SummarizeArticleInputSchema},
  output: {schema: SummarizeArticleOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing news articles for a Telugu news app (Telugu News Pulse). Your goal is to create a concise and impactful summary.

IMPORTANT: The summary must be written in Telugu (తెలుగు) language.

The summary should be between 70 and 100 words in Telugu. It should capture the main points of the article without losing crucial information.

Here is the detailed news article:
{{{detailedArticle}}}`
});

const summarizeArticleFlow = ai.defineFlow(
  {
    name: 'summarizeArticleFlow',
    inputSchema: SummarizeArticleInputSchema,
    outputSchema: SummarizeArticleOutputSchema,
  },
  async (input) => {
    const {output} = await summarizeArticlePrompt(input);
    return output!;
  }
);
