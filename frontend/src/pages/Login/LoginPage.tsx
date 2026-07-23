import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, LoaderCircle, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import logoWithText from "../../assets/logo-transaparente -2.0.png";
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
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });
    const emailValue = watch("email");
    const passwordValue = watch("password");

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
            <div className="login-stack">
                <img className="login-logo" src={logoWithText} alt="GarageOS" />

                <section className="login-panel" aria-labelledby="login-title">
                    <div className="login-heading">
                        <h1 id="login-title">Entrar</h1>
                        <p>Acesse sua conta para continuar.</p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                        <label className="form-field" htmlFor="email">
                            <span>E-mail</span>
                            <div className="login-input-wrap">
                                <Mail className="login-input-icon" size={20} aria-hidden="true" />
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    autoFocus
                                    placeholder="Digite seu e-mail"
                                    aria-invalid={Boolean(errors.email)}
                                    className={emailValue && !errors.email ? "is-valid" : undefined}
                                    {...register("email")}
                                />
                            </div>
                            {errors.email && <small>{errors.email.message}</small>}
                        </label>

                        <label className="form-field" htmlFor="password">
                            <span>Senha</span>
                            <div className="login-input-wrap">
                                <Lock className="login-input-icon" size={20} aria-hidden="true" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="Digite sua senha"
                                    aria-invalid={Boolean(errors.password)}
                                    className={passwordValue && !errors.password ? "is-valid" : undefined}
                                    {...register("password")}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword((current) => !current)}
                                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                                >
                                    {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                                </button>
                            </div>
                            {errors.password && <small>{errors.password.message}</small>}
                        </label>

                        {serverError && (
                            <div className="form-error" role="alert">
                                {serverError}
                            </div>
                        )}

                        <div className="login-divider" aria-hidden="true">
                            <span />
                        </div>

                        <button type="submit" className="login-submit" disabled={isSubmitting}>
                            {isSubmitting && <LoaderCircle className="login-spinner" size={20} aria-hidden="true" />}
                            {isSubmitting ? "Entrando..." : "Entrar"}
                            {!isSubmitting && <ArrowRight size={20} aria-hidden="true" />}
                        </button>
                    </form>

                    <div className="login-status" aria-label="Sistema online">
                        <span aria-hidden="true" />
                        ERP v1.0 Online
                    </div>
                </section>
            </div>
        </main>
    );
}

export default LoginPage;
