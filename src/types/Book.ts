export interface Book {
    id: string;
    title: string;
    readDate: string;
    blogCategory: string;
    author: string;
    publisher: string;
    category: string;
    pageCount?: number;
    size?: string;
    sizeWidth?: number;
    sizeHeight?: number;
    sizeDepth?: number;
    bindingType?: string;
    weight?: number;
    isbn?: string;
    coverImage: string;

    link?: string;

    tags?: string[];
    contentHtml?: string;
    thumbnailUrl?: string; // Also saw this in the previous turn user request
    kdcClass?: string; // User removed it in previous turn? 
    // "kdcClass(KDC 분류)와 rating(별점) 필드를 모두 제거했습니다."
    // So keep it removed.
    rating?: number;   // Keep removed.
}
