'use server';
/**
 * @fileOverview This file provides a Genkit flow for reporters to generate catchy headline options based on their article content.
 *
 * - generateHeadlines - A function that handles the headline generation process.
 * - HeadlineGenerationInput - The input type for the generateHeadlines function.
 * - HeadlineGenerationOutput - The return type for the generateHeadlines function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HeadlineGenerationInputSchema = z.object({
  articleContent: z.string().describe('The full content of the news article.'),
});
export type HeadlineGenerationInput = z.infer<typeof HeadlineGenerationInputSchema>;

const HeadlineGenerationOutputSchema = z.object({
  headlines: z.array(z.string()).describe('An array of catchy headline options generated for the article.'),
});
export type HeadlineGenerationOutput = z.infer<typeof HeadlineGenerationOutputSchema>;

export async function generateHeadlines(input: HeadlineGenerationInput): Promise<HeadlineGenerationOutput> {
  return headlineGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'headlineGenerationPrompt',
  input: {schema: HeadlineGenerationInputSchema},
  output: {schema: HeadlineGenerationOutputSchema},
  prompt: `You are a professional news editor for a Telugu news platform. Your task is to generate several catchy, concise, and engaging headlines for a news article.

IMPORTANT: All headlines must be written in Telugu (తెలుగు) language.

Based on the following article content, provide 3 to 5 distinct headline options in Telugu. Ensure the headlines are appealing and accurately reflect the article's main point.

Article Content: {{{articleContent}}}`,
});

const headlineGenerationFlow = ai.defineFlow(
  {
    name: 'headlineGenerationFlow',
    inputSchema: HeadlineGenerationInputSchema,
    outputSchema: HeadlineGenerationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
