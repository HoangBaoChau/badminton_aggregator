export interface RawPost {
    text: string;
    imageUrl: string;
    postUrl: string;
    postId: string;
    authorName: string;
    postedAt: string;
}

export interface GroqDealResponse {
    is_deal: boolean;
    productName: string | null;
    price: number | null;
    originalPrice: number | null;
    condition: string | null;
    location: string | null;
    transactionMethod: string | null;
    sellerName: string | null;
    aiSummary: string;
    tags: string[];
    metadata: {
        weight: string | null;
        flex: string | null;
        size: string | null;
        phone: string | null;
    };
}

export interface DealPayload {
    sourceId: string;
    externalId: string;
    externalUrl: string;
    productName: string | null;
    price: number | null;
    originalPrice: number | null;
    condition: string | null;
    location: string | null;
    sellerName: string | null;
    transactionMethod: string | null;
    aiSummary: string | null;
    tags: string[];
    metadata: Record<string, any>;
    thumbnailUrl: string | null;
    rawText: string;
    postedAt: string | null;
}
