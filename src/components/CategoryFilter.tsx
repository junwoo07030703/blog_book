import './CategoryFilter.css';

interface CategoryFilterProps {
    categories: string[];
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
    categoryCounts: Record<string, number>;
}

export function CategoryFilter({
    categories,
    selectedCategory,
    onSelectCategory,
    categoryCounts,
}: CategoryFilterProps) {
    return (
        <div className="category-filter">
            <div className="category-tabs">
                {categories.map((category) => (
                    <button
                        key={category}
                        className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                        onClick={() => onSelectCategory(category)}
                        aria-pressed={selectedCategory === category}
                    >
                        <span className="category-name">{category}</span>
                        <span className="category-count">{categoryCounts[category] || 0}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
