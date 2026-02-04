import './Header.css';

interface HeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    totalBooks: number;
    onAddClick: () => void;
}

export function Header({ searchQuery, onSearchChange, totalBooks, onAddClick }: HeaderProps) {
    return (
        <header className="header">
            <div className="header-content">
                <div className="header-left">
                    <h1 className="logo">
                        <span className="logo-icon">📚</span>
                        <span className="logo-text">이냥저냥의 서재</span>
                    </h1>
                    <p className="subtitle">{totalBooks}권의 독서 기록</p>
                </div>

                <div className="header-right">
                    <div className="search-container">
                        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="책 제목, 저자 검색..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            aria-label="책 검색"
                        />
                        {searchQuery && (
                            <button
                                className="search-clear"
                                onClick={() => onSearchChange('')}
                                aria-label="검색어 지우기"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <button
                        className="add-book-button"
                        onClick={onAddClick}
                        style={{
                            marginTop: '12px',
                            padding: '8px 16px',
                            backgroundColor: 'var(--accent-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            alignSelf: 'flex-end',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span style={{ fontSize: '1.2em' }}>+</span> 독서감상문 추가하기
                    </button>
                </div>
            </div>
        </header>
    );
}
