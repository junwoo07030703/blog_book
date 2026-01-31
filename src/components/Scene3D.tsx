import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Suspense } from 'react';
import { Shelf3D } from './Shelf3D';
import { Book3DModel } from './Book3DModel';
import type { Book } from '../data/books';

interface Scene3DProps {
    books: Book[];
    onBookClick: (book: Book) => void;
    selectedBookId?: string;
}

export function Scene3D({ books, onBookClick, selectedBookId }: Scene3DProps) {
    // 책을 선반별로 그룹화 (한 선반당 5권)
    const booksPerShelf = 5;
    const shelves: Book[][] = [];
    for (let i = 0; i < books.length; i += booksPerShelf) {
        shelves.push(books.slice(i, i + booksPerShelf));
    }

    return (
        <div style={{ width: '100%', height: '100vh', background: 'linear-gradient(180deg, #f5f0e8 0%, #e8e0d5 100%)' }}>
            <Canvas
                shadows
                camera={{ position: [0, 0, 10], fov: 50 }}
                gl={{ antialias: true, alpha: true }}
            >
                <Suspense fallback={null}>
                    {/* 조명 설정 */}
                    <ambientLight intensity={0.6} color="#fff5e6" />
                    <directionalLight
                        position={[5, 10, 5]}
                        intensity={1}
                        castShadow
                        shadow-mapSize={[2048, 2048]}
                        shadow-camera-far={50}
                        shadow-camera-left={-10}
                        shadow-camera-right={10}
                        shadow-camera-top={10}
                        shadow-camera-bottom={-10}
                    />
                    <pointLight position={[-5, 5, 5]} intensity={0.3} color="#ffeedd" />

                    {/* 배경 환경 */}
                    <Environment preset="apartment" />

                    {/* 선반들과 책들 */}
                    {shelves.map((shelfBooks, shelfIndex) => {
                        const shelfY = 2 - shelfIndex * 2.5; // 각 선반 간격
                        return (
                            <group key={shelfIndex} position={[0, shelfY, 0]}>
                                {/* 선반 */}
                                <Shelf3D position={[0, -0.6, 0]} />

                                {/* 책들 */}
                                {shelfBooks.map((book, bookIndex) => {
                                    const bookX = (bookIndex - (shelfBooks.length - 1) / 2) * 1.2;
                                    return (
                                        <Book3DModel
                                            key={book.id}
                                            book={book}
                                            position={[bookX, 0, 0]}
                                            onClick={() => onBookClick(book)}
                                            isSelected={book.id === selectedBookId}
                                        />
                                    );
                                })}
                            </group>
                        );
                    })}

                    {/* 바닥 그림자 */}
                    <ContactShadows
                        position={[0, -5, 0]}
                        opacity={0.4}
                        scale={20}
                        blur={2}
                        far={10}
                    />

                    {/* 카메라 컨트롤 */}
                    <OrbitControls
                        enablePan={false}
                        enableZoom={true}
                        minDistance={5}
                        maxDistance={20}
                        minPolarAngle={Math.PI / 4}
                        maxPolarAngle={Math.PI / 2}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
