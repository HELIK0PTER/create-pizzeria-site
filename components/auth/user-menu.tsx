'use client'

import { useSession, signOut } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, LogOut, Settings, ShoppingBag, Shield } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

export function UserMenu() {
  const { data: session, isPending } = useSession()
  const [activeOrders, setActiveOrders] = useState(0)

  useEffect(() => {
    const fetchActiveOrders = async () => {
      try {
        const response = await fetch('/api/orders/active')
        if (response.ok) {
          const data = await response.json()
          setActiveOrders(data.count)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des commandes actives:', error)
      }
    }

    if (session?.user) {
      fetchActiveOrders()
    }
  }, [session])

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/'
        }
      }
    })
  }

  if (isPending) {
    return (
      <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
    )
  }

  if (!session?.user) {
    return (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/auth/login">Connexion</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/auth/register">Inscription</Link>
        </Button>
      </div>
    )
  }

  const initials = session.user.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-md p-5 hover:cursor-pointer">
          <Avatar className="h-8 w-8 p-4">
            <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{session.user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Mon profil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/orders" className="cursor-pointer relative">
            <ShoppingBag className="mr-2 h-4 w-4" />
            <span>Mes commandes</span>
            {activeOrders > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {activeOrders}
              </Badge>
            )}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres</span>
          </Link>
        </DropdownMenuItem>
        {(session?.user as unknown as { role: string })?.role === 'admin' && (
          <>
            <DropdownMenuSeparator className='my-[3px] pb-[1px]'/>
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
              <span>Admin</span>
            </Link>
          </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Se déconnecter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 