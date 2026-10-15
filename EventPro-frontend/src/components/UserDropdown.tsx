import { useNavigate } from "react-router-dom"
import { LogOut, Settings, User as UserIcon } from "lucide-react"
import { auth } from "@/firebase/firebase"
import { useAuthLogout } from "@/hooks/useAuth"
import { useFetchUserProfileById } from "@/hooks/useProfile"
import type { UserData } from "@/stores/useSessionStore"
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
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open account menu"
      >
        <Avatar>
          {userProfile?.profile_pic && <AvatarImage src={userProfile.profile_pic} alt="" />}
          <AvatarFallback className="bg-primary text-primary-foreground">
            {userData?.first_name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
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
