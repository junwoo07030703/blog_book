import * as THREE from 'three';

interface Shelf3DProps {
    position?: [number, number, number];
}

export function Shelf3D({ position = [0, 0, 0] }: Shelf3DProps) {

    // 나무 재질 생성
    const woodMaterial = new THREE.MeshStandardMaterial({
        color: '#c4a574',
        roughness: 0.8,
        metalness: 0.1,
    });

    const shelfWidth = 16;
    const shelfDepth = 1.2;
    const shelfHeight = 0.15;

    return (
        <group position={position}>
            {/* 선반 상판 */}
            <mesh
                castShadow
                receiveShadow
                material={woodMaterial}
            >
                <boxGeometry args={[shelfWidth, shelfHeight, shelfDepth]} />
            </mesh>

            {/* 선반 뒷판 */}
            <mesh
                position={[0, 0.4, -shelfDepth / 2 - 0.05]}
                castShadow
                receiveShadow
                material={woodMaterial}
            >
                <boxGeometry args={[shelfWidth, 1, 0.1]} />
            </mesh>

            {/* 선반 앞 테두리 */}
            <mesh
                position={[0, shelfHeight / 2 + 0.05, shelfDepth / 2 - 0.05]}
                castShadow
                receiveShadow
                material={woodMaterial}
            >
                <boxGeometry args={[shelfWidth, 0.1, 0.1]} />
            </mesh>
        </group>
    );
}
