import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../../context/auth.context";
import { getApiErrorMessage } from "../../services/api";

const loginSchema = z.object({
    email: z.string().min(1, "Informe o e-mail").email("Informe um e-mail valido"),
    password: z.string().min(1, "Informe a senha"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
    const navigate = useNavigate();
    const { isAuthenticated, login } = useAuth();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(data: LoginFormData) {
        setServerError(null);

        try {
            await login(data);
            navigate("/", { replace: true });
        } catch (error) {
            setServerError(getApiErrorMessage(error, "Nao foi possivel entrar. Verifique seus dados."));
        }
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return (
        <main className="login-page">
            <section className="login-panel" aria-labelledby="login-title">
                <div className="login-heading">
                    <span className="login-kicker">System Oficina</span>
                    <h1 id="login-title">Entrar</h1>
                    <p>Acesse sua conta para continuar.</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <label className="form-field" htmlFor="email">
                        <span>E-mail</span>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="usuario@empresa.com"
                            aria-invalid={Boolean(errors.email)}
                            {...register("email")}
                        />
                        {errors.email && <small>{errors.email.message}</small>}
                    </label>

                    <label className="form-field" htmlFor="password">
                        <span>Senha</span>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="Digite sua senha"
                            aria-invalid={Boolean(errors.password)}
                            {...register("password")}
                        />
                        {errors.password && <small>{errors.password.message}</small>}
                    </label>

                    {serverError && (
                        <div className="form-error" role="alert">
                            {serverError}
                        </div>
                    )}

                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Entrando..." : "Entrar"}
                    </button>
                </form>
            </section>
        </main>
    );
}

export default LoginPage;
