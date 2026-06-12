import { FaTelegram, FaInstagram, FaWhatsapp } from "react-icons/fa"
import { IoMailOutline, IoLogoGithub } from "react-icons/io5"

export interface SocialMedia {
  label: string
  url: string
  icon: any
  hoverColor: string
}

export const socialMediaList: SocialMedia[] = [
  {
    label: "Telegram",
    url: "https://t.me/hcw0915",
    icon: FaTelegram,
    hoverColor: "#0088cc"
  },
  {
    label: "Email",
    url: "mailto:love233031@gmail.com",
    icon: IoMailOutline,
    hoverColor: "#6366f1"
  },
  {
    label: "GitHub",
    url: "https://github.com/hcw0015",
    icon: IoLogoGithub,
    hoverColor: "#9ca3af"
  },
  {
    label: "Instagram",
    url: "https://instagram.com/hcw0915",
    icon: FaInstagram,
    hoverColor: "#E4405F"
  },
  {
    label: "WhatsApp",
    url: "https://wa.me/886988249339",
    icon: FaWhatsapp,
    hoverColor: "#25D366"
  }
]

export const familiarSkills = ["React / Next", "Tailwind", "Style-components", "TypeScript"]

export const experiencedSkills = [
  "Zustand", "Vite", "Redux", "Vue2/3", "webpack", "rollup", "turbopack",
  "babel", "AST", "WebSocket", "github-action", "Canvas", "SVG", "Three.js", "pnpm", "solid.js"
]

export const PDF_PATH = "/Antonio_Hou_260228.pdf"
