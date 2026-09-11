import { FaTelegram, FaInstagram, FaWhatsapp } from "react-icons/fa"
import { IoMailOutline, IoLogoGithub } from "react-icons/io5"

export const GITHUB_URL = "https://github.com/hcw0915"
export const EMAIL = "love233031@gmail.com"
export const PDF_PATH = "/Antonio_Hou_260228.pdf"

export interface SocialMedia {
  label: string
  url: string
  icon: any
  hoverColor: string
  /** 手機 app 類的聯絡方式另外提供 QR code，方便從電腦掃到手機 */
  qr?: boolean
}

/** 招募者最常用的放前面：GitHub、Email */
export const socialMediaList: SocialMedia[] = [
  { label: "GitHub", url: GITHUB_URL, icon: IoLogoGithub, hoverColor: "#9ca3af" },
  { label: "Email", url: `mailto:${EMAIL}`, icon: IoMailOutline, hoverColor: "#6366f1" },
  { label: "Telegram", url: "https://t.me/hcw0915", icon: FaTelegram, hoverColor: "#0088cc", qr: true },
  { label: "WhatsApp", url: "https://wa.me/886988249339", icon: FaWhatsapp, hoverColor: "#25D366", qr: true },
  { label: "Instagram", url: "https://instagram.com/hcw0915", icon: FaInstagram, hoverColor: "#E4405F" }
]

export const familiarSkills = ["React / Next", "Tailwind", "Style-components", "TypeScript"]

export const experiencedSkills = [
  "Zustand", "Vite", "Redux", "Vue2/3", "webpack", "rollup", "turbopack",
  "babel", "AST", "WebSocket", "github-action", "Canvas", "SVG", "Three.js", "pnpm", "solid.js"
]
