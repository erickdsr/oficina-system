import type { ApiDateTime, ApiId } from "./api.types";

export interface Category {
    
    id: ApiId;
    name: string;
    description: string;
    createdAt: ApiDateTime;
}

export interface CategoryRequest {

    name: string;
    description: string;
}
