import { Problem } from '../types';
import { problemService } from './problemService';
import { aiService } from './aiService';

export const scrapingService = {
  /**
   * Fetches problem IDs from Codeforces API. 
   * Note: Statements need separate HTML scraping usually, 
   * but for this "legal" proof of concept, we fetch the available metadata.
   */
  async scrapeCodeforces(): Promise<Partial<Problem>[]> {
    try {
      const response = await fetch('/api/proxy/codeforces');
      const data = await response.json();
      
      if (data.status === 'OK') {
        const problems = data.result.problems.slice(0, 50); // Increased to 50
        return problems.map((p: any) => ({
          title: p.name, // Removed "Codeforces:" prefix
          slug: `external-${p.contestId}-${p.index}`.toLowerCase(), // More generic slug
          difficulty: p.rating ? (p.rating < 1200 ? 'Easy' : p.rating < 1800 ? 'Medium' : 'Hard') : 'Medium',
          category: 'Competitive Programming',
          tags: p.tags || [],
          statement: '', // Leave empty for AI enrichment
          constraints: '',
          inputFormat: 'Standard Input',
          outputFormat: 'Standard Output',
          sampleInput: '',
          sampleOutput: '',
          testCases: []
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching external CP problems:', error);
      return [];
    }
  },

  /**
   * Fetches from known public datasets on GitHub with fallback logic.
   */
  async scrapeGitHubDataset(): Promise<Partial<Problem>[]> {
    const urls = [
      'https://raw.githubusercontent.com/yennanliu/leetcode-questions-json/master/leet-code-questions.json',
      'https://raw.githubusercontent.com/alreves/leetcode-questions-json/master/leetcode-questions.json',
      'https://raw.githubusercontent.com/akarsh-gupta007/leetcode-api/master/problems.json',
      'https://raw.githubusercontent.com/Mahesh-Sherpa/leetcode-questions-json/main/leet-code-questions.json'
    ];

    let lastError: any = null;

    for (const url of urls) {
      try {
        const response = await fetch(url);
        
        if (!response.ok) continue;

        const text = await response.text();
        let problems;
        try {
          problems = JSON.parse(text);
        } catch (e) {
          continue;
        }
        
        // Adapt mapping based on the structure of the dataset
        const data = Array.isArray(problems) ? problems : (problems.stat_status_pairs || problems.problems || []);
        if (!data || data.length === 0) continue;

        return data.slice(0, 50).map((p: any) => { // Increased to 50
          const title = p.stat?.question__title || p.title || 'Algorithmic Challenge';
          const slugId = p.stat?.question__title_slug || p.title_slug || (title).toLowerCase().replace(/\s+/g, '-');
          
          return {
            title: title,
            slug: `challenge-${slugId}`.toLowerCase(),
            difficulty: p.difficulty?.level === 3 ? 'Hard' : p.difficulty?.level === 2 ? 'Medium' : 'Easy',
            category: 'Algorithms',
            tags: p.tags || p.topicTags?.map((t: any) => t.name) || [],
            statement: p.content || '', // Leave empty if not available
            constraints: '',
            inputFormat: 'Function parameters',
            outputFormat: 'Return value',
            sampleInput: '',
            sampleOutput: '',
            testCases: []
          };
        });
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Internal error: Could not reach problem repository.');
  },

  async importProblems(problems: Partial<Problem>[]): Promise<number> {
    let count = 0;
    try {
      // Fetch all existing problems once to avoid expensive repeated DB calls
      const existing = await problemService.getAllProblems();
      const existingSlugs = new Set(existing.map(ep => ep.slug));

      for (const p of problems) {
        try {
          if (!existingSlugs.has(p.slug!)) {
            let finalizedProblem = { ...p };

            // Enrich with AI if basic content is missing (Self-Healing Import)
            if (!finalizedProblem.statement || finalizedProblem.statement.length < 50) {
              try {
                const enriched = await aiService.enrichProblemMetadata(
                  finalizedProblem.title!, 
                  finalizedProblem.tags || [], 
                  finalizedProblem.category || 'Algorithms'
                );
                finalizedProblem = { ...finalizedProblem, ...enriched };
              } catch (aiErr) {
                console.warn(`AI Enrichment failed for ${p.title}, using fallback basics.`);
              }
            }

            // This is a REAL write to your Firestore database
            await problemService.createProblem({
              title: finalizedProblem.title!,
              slug: finalizedProblem.slug!,
              difficulty: finalizedProblem.difficulty || 'Medium',
              category: finalizedProblem.category || 'Algorithms',
              tags: finalizedProblem.tags || [],
              statement: finalizedProblem.statement || 'Statement pending AI generation.',
              constraints: finalizedProblem.constraints || 'Constraints pending analysis.',
              inputFormat: finalizedProblem.inputFormat || 'Standard Input',
              outputFormat: finalizedProblem.outputFormat || 'Standard Output',
              sampleInput: finalizedProblem.sampleInput || 'Pending...',
              sampleOutput: finalizedProblem.sampleOutput || 'Pending...',
              testCases: finalizedProblem.testCases || [],
              authorId: 'system-transfer',
              editorial: finalizedProblem.editorial || '',
              referenceSolution: finalizedProblem.referenceSolution || '',
              codeTemplates: finalizedProblem.codeTemplates || []
            });
            
            // Add to local set to prevent duplicate imports within the same batch
            existingSlugs.add(p.slug!);
            count++;
          }
        } catch (err) {
          console.error('Failed to copy problem to database:', p.title, err);
        }
      }
    } catch (error) {
      console.error('Database pre-check failed during synchronization:', error);
    }
    return count;
  }
};
