export const externalLibraryService = {
  async searchOpenLibrary(query: string) {
    try {
      const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data.docs.slice(0, 10).map((doc: any) => ({
        id: doc.key,
        title: doc.title,
        author: doc.author_name?.[0] || 'Unknown',
        description: doc.first_sentence?.[0] || '',
        thumbnail: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
        url: `https://openlibrary.org${doc.key}`,
        source: 'Open Library',
        type: 'Book'
      }));
    } catch (error) {
      console.error("Open Library Search Error:", error);
      return [];
    }
  },

  async searchArXiv(query: string) {
    // Simplified mock for arXiv as it returns XML by default
    // In a real app, we'd use a proxy or XML parser
    return [
      {
        id: 'arxiv_1',
        title: 'Attention Is All You Need',
        author: 'Vaswani et al.',
        description: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...',
        url: 'https://arxiv.org/pdf/1706.03762.pdf',
        source: 'arXiv',
        type: 'Paper',
        tags: ['Deep Learning', 'Transformers', 'NLP']
      },
      {
        id: 'arxiv_2',
        title: 'Generative Adversarial Nets',
        author: 'Goodfellow et al.',
        description: 'We propose a new framework for estimating generative models via an adversarial process...',
        url: 'https://arxiv.org/pdf/1406.2661.pdf',
        source: 'arXiv',
        type: 'Paper',
        tags: ['GANs', 'Generative Models', 'AI']
      }
    ].filter(p => p.title.toLowerCase().includes(query.toLowerCase()) || p.tags.some(t => t.toLowerCase().includes(query.toLowerCase())));
  }
};
