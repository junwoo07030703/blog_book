
import { Html } from '@react-three/drei';

interface GuidePanel3DProps {
    position?: [number, number, number];
    rotation?: [number, number, number];
}

export function GuidePanel3D({ position = [0, 0, 0], rotation = [0, 0, 0] }: GuidePanel3DProps) {
    return (
        <group position={position} rotation={rotation}>
            {/* 안내판 물리적 배경 (나무 판자 느낌) */}
            <mesh position={[0, 0, -0.05]} castShadow receiveShadow>
                <boxGeometry args={[5, 4, 0.1]} />
                <meshStandardMaterial color="#f5f0e8" roughness={0.8} />
            </mesh>

            {/* 텍스트 컨텐츠 (3D HTML) */}
            <Html
                transform
                occlude="blending"
                position={[0, 0, 0.06]} // 판자보다 살짝 앞
                scale={0.5}
                style={{
                    width: '400px',
                    userSelect: 'none',
                    pointerEvents: 'none', // 클릭 방해 방지
                }}
            >
                <div style={{
                    fontFamily: "'Pretendard', sans-serif",
                    color: '#3e2723', // 짙은 갈색 텍스트
                    textAlign: 'center',
                    padding: '20px',
                }}>
                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        margin: '0 0 20px 0',
                        borderBottom: '2px solid #5d4037',
                        paddingBottom: '10px'
                    }}>
                        서재 이용 가이드
                    </h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr',
                        gap: '15px',
                        textAlign: 'left',
                        fontSize: '1.1rem'
                    }}>
                        <span style={{ fontSize: '2rem' }}>🔄</span>
                        <div>
                            <strong>회전</strong><br />
                            <span style={{ fontSize: '0.9rem' }}>왼쪽 클릭 + 드래그</span>
                        </div>

                        <span style={{ fontSize: '2rem' }}>✋</span>
                        <div>
                            <strong>이동</strong><br />
                            <span style={{ fontSize: '0.9rem' }}>오른쪽 클릭 + 드래그</span>
                        </div>

                        <span style={{ fontSize: '2rem' }}>🔍</span>
                        <div>
                            <strong>줌인/아웃</strong><br />
                            <span style={{ fontSize: '0.9rem' }}>마우스 휠 스크롤</span>
                        </div>

                        <span style={{ fontSize: '2rem' }}>👆</span>
                        <div>
                            <strong>상세 보기</strong><br />
                            <span style={{ fontSize: '0.9rem' }}>책 클릭</span>
                        </div>
                    </div>
                </div>
            </Html>
        </group>
    );
}
