
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar'
import { User, LogOut, Settings, Crown, Star } from 'lucide-react'
import { useAuthStore } from '@/lib/useAuthStore'
import { UserTier } from '@/lib/supabase'

const getTierIcon = (tier: UserTier) => {
  switch (tier) {
    case 'admin':
      return <Crown className="h-4 w-4" />
    case 'paid':
      return <Star className="h-4 w-4" />
    default:
      return <User className="h-4 w-4" />
  }
}

const getTierColor = (tier: UserTier) => {
  switch (tier) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'paid':
      return 'bg-gold-100 text-gold-800 border-gold-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function UserProfile() {
  const { user, profile, signOut } = useAuthStore()

  if (!user || !profile) return null

  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <div className="flex items-center space-x-2 p-2">
          <Avatar className="h-12 w-12">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="secondary" className={getTierColor(profile.tier)}>
                {getTierIcon(profile.tier)}
                <span className="ml-1 capitalize">{profile.tier}</span>
              </Badge>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-red-600" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
