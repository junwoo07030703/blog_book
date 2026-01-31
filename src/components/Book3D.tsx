import type { CSSProperties } from 'react';
import type { Book } from '../data/books';
import './Book3D.css';

interface Book3DProps {
    book: Book;
    onClick: (book: Book, event: React.MouseEvent) => void;
    index?: number;
    isSelected?: boolean;
}

export function Book3D({ book, onClick, index = 0, isSelected = false }: Book3DProps) {
    // Calculate book dimensions based on actual size data
    const baseHeight = book.sizeHeight ? book.sizeHeight * 0.55 : 140;
    const baseWidth = book.sizeWidth ? book.sizeWidth * 0.55 : 90;
    const baseDepth = book.sizeDepth ? book.sizeDepth * 0.55 : 15; // 동일 비율

    // Clamp dimensions
    const height = Math.min(Math.max(baseHeight, 100), 180);
    const width = Math.min(Math.max(baseWidth, 60), 120);
    const depth = Math.min(Math.max(baseDepth, 8), 35); // 최소 8px

    // Stagger animation delay
    const animationDelay = `${index * 0.05}s`;

    const bookStyle: CSSProperties = {
        '--book-height': `${height}px`,
        '--book-width': `${width}px`,
        '--book-depth': `${depth}px`,
        animationDelay,
    } as CSSProperties;

    // Get spine color
    const spineColor = getSpineColor(book.title);
    const spineDarkColor = getDarkerColor(spineColor);

    return (
        <div
            className={`book-container ${isSelected ? 'book-selected' : ''}`}
            style={bookStyle}
            onClick={(e) => onClick(book, e)}
            role="button"
            tabIndex={0}
            aria-label={`${book.title} by ${book.author}`}
            onKeyDown={(e) => e.key === 'Enter' && onClick(book, e as unknown as React.MouseEvent)}
        >
            <div className="book">
                {/* Front cover */}
                <div className="book-face book-cover">
                    <img
                        src={book.coverImage}
                        alt={book.title}
                        loading="lazy"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-book.png';
                        }}
                    />
                </div>

                {/* Spine */}
                <div
                    className="book-face book-spine"
                    style={{
                        background: `linear-gradient(90deg, ${spineDarkColor} 0%, ${spineColor} 50%, ${spineDarkColor} 100%)`,
                    }}
                >
                    <span className="spine-title">{book.title}</span>
                </div>

                {/* Pages (right side) */}
                <div className="book-face book-pages">
                    <div className="pages-lines"></div>
                </div>

                {/* Top */}
                <div className="book-face book-top">
                    <div className="pages-texture"></div>
                </div>

                {/* Bottom */}
                <div className="book-face book-bottom"></div>

                {/* Back */}
                <div
                    className="book-face book-back"
                    style={{ backgroundColor: spineColor }}
                ></div>
            </div>
        </div>
    );
}

function getSpineColor(uniqueInput: string): string {
    const colors = [
        '#722f37', // burgundy
        '#1a365d', // navy
        '#2d5a27', // forest
        '#36454f', // charcoal
        '#cd5c5c', // coral
        '#722f37', // wine
        '#556b2f', // olive
        '#008080', // teal
        '#c49a3c', // mustard
        '#708090', // slate
        '#f5f5dc', // cream
    ];

    // Simple hash
    let hash = 0;
    for (let i = 0; i < uniqueInput.length; i++) {
        hash = uniqueInput.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
}

function getDarkerColor(hex: string): string {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 30);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 30);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 30);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
