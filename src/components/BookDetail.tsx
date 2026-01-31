import { useState, useEffect } from 'react';
import type { Book } from '../data/books';
import './BookDetail.css';

interface BookDetailProps {
    book: Book | null;
    onClose: () => void;
}

type ViewState = 'zoomed' | 'detail';

export function BookDetail({ book, onClose }: BookDetailProps) {
    const [viewState, setViewState] = useState<ViewState>('detail');

    // Reset state when book changes
    useEffect(() => {
        if (book) {
            setViewState('detail');
        }
    }, [book]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // ESC 누르면 바로 모달 닫기
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (book) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [book]);



    if (!book) return null;

    const handleBookClick = () => {
        if (viewState === 'zoomed') {
            setViewState('detail');
        }
    };

    const handleBackClick = () => {
        // 중간 단계 없이 바로 닫기
        onClose();
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleBackClick();
        }
    };

    return (
        <div className="book-detail-overlay" onClick={handleOverlayClick}>
            <div className={`book-detail-container ${viewState}`}>
                {/* Close button */}
                <button className="close-button" onClick={onClose} aria-label="닫기">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {viewState === 'zoomed' && (
                    <div className="zoomed-view" onClick={handleBookClick}>
                        <div className="zoomed-book">
                            <img
                                src={book.coverImage}
                                alt={book.title}
                                className="zoomed-cover"
                            />
                            <div className="click-hint">
                                <span>클릭하여 상세 보기</span>
                            </div>
                        </div>
                    </div>
                )}

                {viewState === 'detail' && (
                    <div className="detail-view">
                        {/* Back button */}
                        <button className="back-button" onClick={handleBackClick}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15,18 9,12 15,6" />
                            </svg>
                            <span>뒤로</span>
                        </button>

                        <div className="detail-content">
                            {/* Book info sidebar */}
                            <aside className="book-info">
                                <img
                                    src={book.coverImage}
                                    alt={book.title}
                                    className="detail-cover"
                                />
                                <div className="book-meta">
                                    <h2 className="book-title">{book.title}</h2>
                                    <p className="book-author">{book.author}</p>
                                    <div className="book-details">
                                        <span className="detail-item">
                                            <span className="label">출판사</span>
                                            <span className="value">{book.publisher}</span>
                                        </span>
                                        <span className="detail-item">
                                            <span className="label">카테고리</span>
                                            <span className="value">{book.category}</span>
                                        </span>
                                        {book.pageCount && (
                                            <span className="detail-item">
                                                <span className="label">페이지</span>
                                                <span className="value">{book.pageCount}p</span>
                                            </span>
                                        )}
                                        <span className="detail-item">
                                            <span className="label">읽은 날짜</span>
                                            <span className="value">{book.readDate}</span>
                                        </span>

                                    </div>
                                    {book.tags && book.tags.length > 0 && (
                                        <div className="book-tags">
                                            {book.tags.map((tag, i) => (
                                                <span key={i} className="tag">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </aside>

                            {/* Reading note */}
                            <article className="reading-note">
                                <h3 className="note-title">📝 독서 감상문</h3>
                                <div
                                    className="note-content html-content"
                                    dangerouslySetInnerHTML={{ __html: book.contentHtml || '' }}
                                />
                            </article>
                        </div>
                    </div>
                )
                }
            </div >
        </div >
    );
}
