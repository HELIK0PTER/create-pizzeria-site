import { SignInForm } from '@/components/auth/sign-in-form'

export default function LoginPage() {
  return (
    <div className="h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignInForm />
      </div>
    </div>
  )
} 