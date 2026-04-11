import { libraryService } from './services/libraryService';

export const seedLibraryData = async () => {
  const resources = [
    {
      title: "Clean Code: A Handbook of Agile Software Craftsmanship",
      author: "Robert C. Martin",
      description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.",
      thumbnail: "https://picsum.photos/seed/cleancode/300/400",
      url: "https://openlibrary.org/books/OL22675400M/Clean_Code",
      type: "Book" as const,
      domain: "Computer Science",
      tags: ["Software Engineering", "Agile", "Best Practices"],
      difficulty: "Medium" as const,
      source: "Open Library"
    },
    {
      title: "Attention Is All You Need",
      author: "Vaswani et al.",
      description: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...",
      thumbnail: "https://picsum.photos/seed/attention/300/400",
      url: "https://arxiv.org/pdf/1706.03762.pdf",
      type: "Paper" as const,
      domain: "Computer Science",
      tags: ["Deep Learning", "Transformers", "NLP"],
      difficulty: "Hard" as const,
      source: "arXiv"
    },
    {
      title: "The Republic",
      author: "Plato",
      description: "A Socratic dialogue, authored by Plato around 375 BC, concerning justice, the order and character of the just city-state, and the just man.",
      thumbnail: "https://picsum.photos/seed/republic/300/400",
      url: "https://www.gutenberg.org/ebooks/1497",
      type: "Book" as const,
      domain: "Humanities",
      tags: ["Philosophy", "Politics", "Classics"],
      difficulty: "Medium" as const,
      source: "Project Gutenberg"
    }
  ];

  for (const res of resources) {
    await libraryService.createResource(res);
  }

  const paths = [
    {
      title: "Mastering Machine Learning",
      description: "A comprehensive path from foundations to state-of-the-art deep learning models.",
      domain: "Computer Science",
      resources: [],
      problems: []
    }
  ];

  for (const path of paths) {
    await libraryService.createPath(path);
  }
};
