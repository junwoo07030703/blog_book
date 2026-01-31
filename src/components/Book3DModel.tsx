
import { useState } from 'react';
import { useSpring, animated } from '@react-spring/three';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Book } from '../data/books';

interface Book3DModelProps {
    book: Book;
    position?: [number, number, number];
    onClick: () => void;
    isSelected?: boolean;
}

// 텍스처 로딩을 담당하는 하위 컴포넌트 (Suspense와 연동됨)
function BookCoverMaterial({ url }: { url: string }) {
    const texture = useTexture(url);
    texture.colorSpace = THREE.SRGBColorSpace;

    // 텍스처 로딩 후 렌더링 이슈 방지를 위해 map 속성이 확실히 적용되도록 함
    return (
        <meshStandardMaterial
            attach="material-4"
            map={texture}
            color="#ffffff"
            roughness={0.5}
        />
    );
}

export function Book3DModel({ book, position = [0, 0, 0], onClick, isSelected = false }: Book3DModelProps) {
    const [hovered, setHovered] = useState(false);

    // 책 크기 계산
    const bookHeight = book.sizeHeight ? book.sizeHeight * 0.008 : 1.2;
    const bookWidth = book.sizeWidth ? book.sizeWidth * 0.008 : 0.8;
    const bookDepth = 0.15;

    // 호버/선택 애니메이션
    const { posY, rotY } = useSpring({
        posY: hovered || isSelected ? 0.15 : 0,
        rotY: hovered || isSelected ? -0.15 : -0.3,
        config: { mass: 1, tension: 280, friction: 60 }
    });

    return (
        <animated.group
            position-x={position[0]}
            position-y={posY.to(y => position[1] + y + bookHeight / 2)}
            position-z={position[2]}
            rotation-y={rotY}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(true);
                document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
                setHovered(false);
                document.body.style.cursor = 'auto';
            }}
        >
            <mesh castShadow receiveShadow>
                <boxGeometry args={[bookWidth, bookHeight, bookDepth]} />
                {/* right - pages */}
                <meshStandardMaterial attach="material-0" color="#f5f5f0" roughness={0.9} />
                {/* left - spine */}
                <meshStandardMaterial attach="material-1" color="#333333" roughness={0.7} />
                {/* top - pages */}
                <meshStandardMaterial attach="material-2" color="#f5f5f0" roughness={0.9} />
                {/* bottom - pages */}
                <meshStandardMaterial attach="material-3" color="#f5f5f0" roughness={0.9} />

                {/* front - cover (Suspense handling) */}
                {book.coverImage && book.coverImage.trim() !== '' ? (
                    <BookCoverMaterial url={book.coverImage} />
                ) : (
                    <meshStandardMaterial attach="material-4" color="#888888" roughness={0.5} />
                )}

                {/* back */}
                <meshStandardMaterial attach="material-5" color="#f5f5f0" roughness={0.9} />
            </mesh>
        </animated.group>
    );
}
