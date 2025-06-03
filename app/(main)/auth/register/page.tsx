import { SignUpForm } from '@/components/auth/sign-up-form'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignUpForm />
      </div>
    </div>
  )
} 