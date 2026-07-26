import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getApiErrorMessage } from "../services/api";
import employeeService from "../services/employee.service";
import type { ApiId } from "../types/api.types";
import type { Employee, EmployeeRequest } from "../types/employee.types";

export function useEmployee() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async (includeInactive = false) => {
        setLoading(true);
        setError(null);
        try {
            const data = await employeeService.list(includeInactive);
            setEmployees(data);
            return data;
        } catch (loadError) {
            const message = getApiErrorMessage(loadError, "Nao foi possivel carregar funcionarios.");
            setError(message);
            toast.error(message);
            throw loadError;
        } finally {
            setLoading(false);
        }
    }, []);

    const create = useCallback(async (data: EmployeeRequest) => {
        const employee = await employeeService.create(data);
        toast.success("Funcionario criado com sucesso.");
        return employee;
    }, []);
    const update = useCallback(async (id: ApiId, data: EmployeeRequest) => {
        const employee = await employeeService.update(id, data);
        toast.success("Funcionario atualizado com sucesso.");
        return employee;
    }, []);
    const remove = useCallback(async (id: ApiId) => {
        const result = await employeeService.remove(id);
        toast.success(result.message);
        return result;
    }, []);
    const forceDelete = useCallback(async (id: ApiId) => {
        const result = await employeeService.forceDelete(id);
        toast.success(result.message);
        return result;
    }, []);

    return { employees, loading, error, setError, fetchAll, create, update, remove, forceDelete };
}

export default useEmployee;
