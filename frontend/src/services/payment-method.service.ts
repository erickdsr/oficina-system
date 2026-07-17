import api from "./api";
import type { PaymentMethod } from "../types/payment-method.types";

const RESOURCE = "/payment-methods";

export const paymentMethodService = {
    async list() {
        const { data } = await api.get<PaymentMethod[]>(RESOURCE);
        return data;
    },
};

export default paymentMethodService;
