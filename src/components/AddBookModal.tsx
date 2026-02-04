import { useState } from 'react';
import type { Book } from '../data/books';
import './AddBookModal.css';

interface AddBookModalProps {
    onClose: () => void;
    onAdd: (book: Book) => void;
    categories: string[];
}

export function AddBookModal({ onClose, onAdd, categories }: AddBookModalProps) {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [publisher, setPublisher] = useState('');
    const [readDate, setReadDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState(categories[0] || '기타');
    const [tags, setTags] = useState('');
    const [content, setContent] = useState('');
    const [coverImage, setCoverImage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 날짜 포맷팅 (YYYY. M. D. H:mm)
        const dateObj = new Date(readDate);
        const formattedDate = `${dateObj.getFullYear()}. ${dateObj.getMonth() + 1}. ${dateObj.getDate()}. 12:00`;

        const newBook: Book = {
            id: Date.now().toString(),
            title,
            author,
            publisher,
            readDate: formattedDate,
            category,
            blogCategory: category, // blogCategory도 동일하게 설정
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
            contentHtml: content, // 간단하게 text를 html로 저장 (나중에 에디터 붙일 수 있음)
            coverImage: coverImage || '/book_covers/cover_000.jpg', // 기본 이미지
            thumbnailUrl: coverImage || '/book_covers/cover_000.jpg',
        };

        onAdd(newBook);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content add-book-modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>
                <h2>새로운 독서감상문 작성</h2>

                <form onSubmit={handleSubmit} className="add-book-form">
                    <div className="form-group">
                        <label>책 제목 *</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="책 제목을 입력하세요"
                        />
                    </div>

                    <div className="form-group-row">
                        <div className="form-group">
                            <label>저자 *</label>
                            <input
                                type="text"
                                required
                                value={author}
                                onChange={e => setAuthor(e.target.value)}
                                placeholder="저자명"
                            />
                        </div>
                        <div className="form-group">
                            <label>출판사</label>
                            <input
                                type="text"
                                value={publisher}
                                onChange={e => setPublisher(e.target.value)}
                                placeholder="출판사명"
                            />
                        </div>
                    </div>

                    <div className="form-group-row">
                        <div className="form-group">
                            <label>읽은 날짜</label>
                            <input
                                type="date"
                                value={readDate}
                                onChange={e => setReadDate(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>카테고리</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                            >
                                {categories.filter(c => c !== '전체').map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                                <option value="기타">기타</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>태그 (쉼표로 구분)</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                            placeholder="소설, 감동, 추천"
                        />
                    </div>

                    <div className="form-group">
                        <label>표지 이미지 URL (선택)</label>
                        <input
                            type="text"
                            value={coverImage}
                            onChange={e => setCoverImage(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>

                    <div className="form-group">
                        <label>감상평 내용</label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="책을 읽고 느낀 점을 자유롭게 기록해보세요."
                            rows={10}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>취소</button>
                        <button type="submit" className="submit-btn">등록하기</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
