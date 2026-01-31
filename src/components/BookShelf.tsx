import { useMemo } from 'react';
import type { Book } from '../data/books';
import { Book3D } from './Book3D';
import { Shelf } from './Shelf';
import './BookShelf.css';

interface BookShelfProps {
    books: Book[];
    onBookClick: (book: Book, event: React.MouseEvent) => void;
    booksPerShelf?: number;
    selectedBookId?: string | null;
}

export function BookShelf({ books, onBookClick, booksPerShelf = 8, selectedBookId }: BookShelfProps) {
    // Group books into shelves
    const shelves = useMemo(() => {
        const result: Book[][] = [];
        for (let i = 0; i < books.length; i += booksPerShelf) {
            result.push(books.slice(i, i + booksPerShelf));
        }
        return result;
    }, [books, booksPerShelf]);

    if (books.length === 0) {
        return (
            <div className="bookshelf-empty">
                <div className="empty-icon">📚</div>
                <p>검색 결과가 없습니다</p>
                <span>다른 검색어나 카테고리를 시도해보세요</span>
            </div>
        );
    }

    return (
        <div className="bookshelf">
            {shelves.map((shelfBooks, shelfIndex) => (
                <Shelf key={shelfIndex}>
                    {shelfBooks.map((book, bookIndex) => (
                        <Book3D
                            key={book.id}
                            book={book}
                            onClick={onBookClick}
                            index={shelfIndex * booksPerShelf + bookIndex}
                            isSelected={book.id === selectedBookId}
                        />
                    ))}
                </Shelf>
            ))}
        </div>
    );
}
