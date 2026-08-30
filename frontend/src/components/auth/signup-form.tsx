import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const vietnamPhoneRegex = /^(0[35789]\d{8}|\+84[35789]\d{8}|84[35789]\d{8})$/;

const signUpSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Tên đăng nhập phải có ít nhất 3 ký tự")
      .max(30, "Tên đăng nhập không được vượt quá 30 ký tự")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới",
      ),

    displayName: z
      .string()
      .trim()
      .min(2, "Tên hiển thị phải có ít nhất 2 ký tự")
      .max(50, "Tên hiển thị không được vượt quá 50 ký tự"),

    email: z
      .string()
      .trim()
      .min(1, "Email là bắt buộc")
      .email("Email không hợp lệ"),

    phone: z
      .string()
      .trim()
      .regex(vietnamPhoneRegex, "Số điện thoại Việt Nam không hợp lệ"),

    password: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .max(72, "Mật khẩu không được vượt quá 72 ký tự")
      .regex(/[a-z]/, "Mật khẩu phải có ít nhất một chữ thường")
      .regex(/[A-Z]/, "Mật khẩu phải có ít nhất một chữ hoa")
      .regex(/\d/, "Mật khẩu phải có ít nhất một chữ số"),

    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const signUp = useAuthStore((state) => state.signUp);
  const googleSignIn = useAuthStore((state) => state.googleSignIn);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (credentialResponse.credential) {
      await googleSignIn(credentialResponse.credential);
      navigate("/");
    }
  };

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),

    defaultValues: {
      username: "",
      displayName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    try {
      await signUp(
        data.username.trim(),
        data.password,
        data.displayName.trim(),
        data.email.trim().toLowerCase(),
        data.phone.trim(),
      );

      navigate("/signin", {
        replace: true,
        state: {
          message: "Đăng ký thành công. Vui lòng đăng nhập.",
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tạo tài khoản. Vui lòng thử lại.";

      setError("root", {
        type: "server",
        message,
      });
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="p-6 md:p-8"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Tạo tài khoản</h1>

                <p className="text-sm text-balance text-muted-foreground">
                  Nhập thông tin bên dưới để đăng ký tài khoản
                </p>
              </div>

              {errors.root?.message && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {errors.root.message}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="username">Tên đăng nhập</FieldLabel>

                <Input
                  id="username"
                  type="text"
                  placeholder="Ví dụ: nguyenvana"
                  autoComplete="username"
                  aria-invalid={Boolean(errors.username)}
                  {...register("username")}
                />

                {errors.username?.message && (
                  <p className="text-sm text-destructive">
                    {errors.username.message}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="displayName">Tên hiển thị</FieldLabel>

                <Input
                  id="displayName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.displayName)}
                  {...register("displayName")}
                />

                {errors.displayName?.message && (
                  <p className="text-sm text-destructive">
                    {errors.displayName.message}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>

                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                />

                {errors.email?.message && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">Số điện thoại</FieldLabel>

                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="0912345678"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                  {...register("phone")}
                />

                {errors.phone?.message && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}

                <FieldDescription>
                  Số điện thoại được dùng để liên hệ khi cần thiết.
                </FieldDescription>
              </Field>

              <Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>

                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={Boolean(errors.password)}
                      {...register("password")}
                    />

                    {errors.password?.message && (
                      <p className="text-sm text-destructive">
                        {errors.password.message}
                      </p>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="confirmPassword">
                      Xác nhận mật khẩu
                    </FieldLabel>

                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={Boolean(errors.confirmPassword)}
                      {...register("confirmPassword")}
                    />

                    {errors.confirmPassword?.message && (
                      <p className="text-sm text-destructive">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </Field>
                </div>

                <FieldDescription>
                  Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và
                  chữ số.
                </FieldDescription>
              </Field>

              <Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                </Button>
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Hoặc tiếp tục với
              </FieldSeparator>

              <Field className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    console.error("Google Login Failed");
                  }}
                  theme="outline"
                  size="large"
                  width="100%"
                  text="signup_with"
                  shape="rectangular"
                />
              </Field>

              <FieldDescription className="text-center">
                Đã có tài khoản?{" "}
                <Link to="/signin" className="underline underline-offset-4">
                  Đăng nhập
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholderSignup.png"
              alt="Hình minh họa đăng ký tài khoản"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        Khi tạo tài khoản, bạn đồng ý với{" "}
        <a href="#" className="underline underline-offset-4">
          Điều khoản dịch vụ
        </a>{" "}
        và{" "}
        <a href="#" className="underline underline-offset-4">
          Chính sách quyền riêng tư
        </a>
        .
      </FieldDescription>
    </div>
  );
}
