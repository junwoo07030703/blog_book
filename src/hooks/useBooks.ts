import { useState, useMemo, useCallback } from 'react';
import { books } from '../data/books';
import type { Book } from '../data/books';

export type SortOption = 'newest' | 'oldest' | 'title';

export function useBooks() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  const [allBooks, setAllBooks] = useState<Book[]>(books);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('전체');
    allBooks.forEach(book => {
      if (book.category) {
        cats.add(book.category);
      }
    });
    return Array.from(cats);
  }, []);

  // Parse date string to Date object
  const parseDate = useCallback((dateStr: string): Date => {
    // Format: "2026. 1. 17. 3:34"
    if (!dateStr) return new Date(0);
    const match = dateStr.match(/(\d+)\.\s*(\d+)\.\s*(\d+)\.\s*(\d+):(\d+)/);
    if (match) {
      const [, year, month, day, hour, minute] = match;
      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      );
    }
    return new Date(0);
  }, []);

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    let result = [...allBooks];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== '전체') {
      result = result.filter(book => book.category === selectedCategory);
    }

    // Sort
    result.sort((a, b) => {
      if (sortOption === 'title') {
        return a.title.localeCompare(b.title, 'ko');
      }
      const dateA = parseDate(a.readDate);
      const dateB = parseDate(b.readDate);
      return sortOption === 'newest'
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

    return result;
  }, [searchQuery, selectedCategory, sortOption, parseDate, allBooks]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { '전체': allBooks.length };
    allBooks.forEach(book => {
      if (book.category) {
        counts[book.category] = (counts[book.category] || 0) + 1;
      }
    });
    return counts;
  }, [allBooks]);

  const addBook = useCallback((newBook: Book) => {
    setAllBooks(prev => [newBook, ...prev]);
  }, []);

  return {
    books: filteredBooks,
    allBooks,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortOption,
    setSortOption,
    categories,
    categoryCounts,
    totalBooks: allBooks.length,
    addBook,
  };
}

export type { Book };
