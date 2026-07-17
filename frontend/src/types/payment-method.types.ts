import type { ApiId } from "./api.types";

export interface PaymentMethod {
    id: ApiId;
    name: string;
    description?: string;
    status?: boolean;
}
