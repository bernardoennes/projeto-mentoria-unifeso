import {
  CalendarCheck,
  CurrencyDollar,
  House,
  Megaphone,
  Question,
  UsersThree,
} from '@phosphor-icons/react'

const iconRegistry = {
  House,
  CalendarCheck,
  UsersThree,
  CurrencyDollar,
  Megaphone,
}

export function resolvePhosphorIcon(iconName) {
  return iconRegistry[iconName] ?? Question
}
