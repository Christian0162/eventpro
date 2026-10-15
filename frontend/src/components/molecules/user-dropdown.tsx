import { useNavigate } from "react-router-dom"
import { ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react"
import { auth } from "@/firebase/firebase"
import { useAuthLogout } from "@/hooks/use-auth"
import { useFetchUserProfileById } from "@/hooks/use-profile"
import type { UserData } from "@/types/session"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function UserDropDown({ userData }: { userData: UserData | null }) {
  const navigate = useNavigate()
  const { userProfile } = useFetchUserProfileById(userData?.id) as { userProfile?: { profile_pic?: string } }
  const { logout } = useAuthLogout()
  const name = [userData?.first_name, userData?.last_name].filter(Boolean).join(" ")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open account menu"
      >
        <Avatar>
          {userProfile?.profile_pic && <AvatarImage src={userProfile.profile_pic} alt="" />}
          <AvatarFallback className="bg-primary text-primary-foreground">
            {userData?.first_name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="hidden min-w-0 leading-tight sm:block">
          <span className="block max-w-36 truncate text-sm font-semibold">{name}</span>
          <span className="block text-xs text-muted-foreground">{userData?.role}</span>
        </span>
        <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {name && <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/profile")}>
          <UserIcon /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/settings")}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => logout(auth)}>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
