import type { ReactNode } from 'react';
import './Shelf.css';

interface ShelfProps {
    children: ReactNode;
    label?: string;
}

export function Shelf({ children, label }: ShelfProps) {
    return (
        <div className="shelf-container">
            {label && <h3 className="shelf-label">{label}</h3>}
            <div className="shelf">
                <div className="shelf-surface">
                    <div className="books-row">
                        {children}
                    </div>
                </div>
                <div className="shelf-front"></div>
                <div className="shelf-shadow"></div>
            </div>
        </div>
    );
}
