export interface LoginRequest{

    email: string;
    password: string;
}
export interface LoginResponse{

    token: string;
    type: string;
    employeeId: number;
    role: string;
    name: string;
}
