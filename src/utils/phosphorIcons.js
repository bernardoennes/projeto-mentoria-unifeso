import {
  Bell,
  CalendarCheck,
  ChatCircleDots,
  House,
  Package,
  Question,
} from '@phosphor-icons/react'

const iconRegistry = {
  House,
  CalendarCheck,
  ChatCircleDots,
  Bell,
  Package,
}

export function resolvePhosphorIcon(iconName) {
  return iconRegistry[iconName] ?? Question
}
