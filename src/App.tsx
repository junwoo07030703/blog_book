import { useState, useCallback, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Header } from './components/Header';
import { CategoryFilter } from './components/CategoryFilter';
import { BookDetail } from './components/BookDetail';
import { GuidePanel3D } from './components/GuidePanel3D';
import { Shelf3D } from './components/Shelf3D';
import { Book3DModel } from './components/Book3DModel';
import { useBooks } from './hooks/useBooks';
import type { Book } from './hooks/useBooks';
import './App.css';

function App() {
  const {
    books,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    categoryCounts,
    totalBooks,
  } = useBooks();

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleBookClick = useCallback((book: Book) => {
    setSelectedBook(book);
    setShowDetail(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setShowDetail(false);
    setSelectedBook(null);
  }, []);

  // 책을 선반별로 그룹화 (한 선반당 5권)
  const booksPerShelf = 5;
  const shelves: Book[][] = [];
  for (let i = 0; i < books.length; i += booksPerShelf) {
    shelves.push(books.slice(i, i + booksPerShelf));
  }

  // Mobile Check
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#f5f0e8', // 앱 테마 색상 유지
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        zIndex: 9999,
        color: '#2c3e50',
        fontFamily: "'Pretendard', sans-serif"
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🖥️</div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '1rem',
          letterSpacing: '-0.02em'
        }}>
          PC 환경에 최적화되어 있습니다
        </h2>
        <p style={{
          fontSize: '1rem',
          lineHeight: '1.6',
          color: '#555',
          wordBreak: 'keep-all',
          maxWidth: '300px'
        }}>
          아름다운 3D 서재 경험을 위해<br />
          모바일보다는 <b>PC(큰 화면)</b>에서 접속해 주세요.<br />
          <span style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.5rem', display: 'block' }}>
            (화면 너비 768px 이상 권장)
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalBooks={totalBooks}
      />

      {/* Category Filter */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
      />

      {/* 3D Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          shadows
          frameloop="always"
          camera={{ position: [-4, 1, 12], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'linear-gradient(180deg, #f5f0e8 0%, #e8e0d5 100%)' }}
        >
          <Suspense fallback={null}>
            {/* 조명 설정 */}
            <ambientLight intensity={0.7} color="#fff5e6" />
            <directionalLight
              position={[5, 10, 5]}
              intensity={1.2}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-bias={-0.0004}
            />
            <pointLight position={[-5, 5, 5]} intensity={0.4} color="#ffeedd" />

            {/* 배경 환경 */}
            <Environment preset="apartment" />

            {/* 3D 안내판 (평행하게 배치, 높이 조정) - 상세보기 중에는 숨김 */}
            {!showDetail && (
              <GuidePanel3D
                position={[-8, 1.5, 0]}
                rotation={[0, 0, 0]}
              />
            )}

            {/* 선반들과 책들 - 상세보기 중에는 숨김 */}
            {!showDetail && shelves.map((shelfBooks, shelfIndex) => {
              const shelfY = 2.5 - shelfIndex * 3;
              return (
                <group key={shelfIndex} position={[0, shelfY, 0]}>
                  {/* 선반 */}
                  <Shelf3D position={[0, -0.075, 0]} />

                  {/* 책들 */}
                  {shelfBooks.map((book, bookIndex) => {
                    const bookX = (bookIndex - (shelfBooks.length - 1) / 2) * 1.4;
                    return (
                      <Book3DModel
                        key={book.id}
                        book={book}
                        position={[bookX, 0, 0.2]}
                        onClick={() => handleBookClick(book)}
                        isSelected={book.id === selectedBook?.id}
                      />
                    );
                  })}
                </group>
              );
            })}



            {/* 카메라 컨트롤 */}
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              target={[-4, 1, 0]} // 회전 중심도 이동
              minDistance={0.1}
              maxDistance={30}
              minPolarAngle={0}
              maxPolarAngle={Math.PI}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Book Detail Modal */}
      {showDetail && selectedBook && (
        <BookDetail book={selectedBook} onClose={handleCloseDetail} />
      )}
    </div>
  );
}

export default App;
