
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import { LogIn } from 'lucide-react'

export default function AuthDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const handleSwitchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-white/90 backdrop-blur-sm border-white/20 hover:bg-white">
          <LogIn className="mr-2 h-4 w-4" />
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-0 p-0">
        {mode === 'login' ? (
          <LoginForm onSwitchToRegister={handleSwitchMode} />
        ) : (
          <RegisterForm onSwitchToLogin={handleSwitchMode} />
        )}
      </DialogContent>
    </Dialog>
  )
}
