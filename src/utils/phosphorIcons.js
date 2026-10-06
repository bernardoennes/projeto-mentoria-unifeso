import {
  CalendarCheck,
  CurrencyDollar,
  House,
  Package,
  Question,
  UsersThree,
} from '@phosphor-icons/react'

const iconRegistry = {
  House,
  CalendarCheck,
  UsersThree,
  CurrencyDollar,
  Package,
}

export function resolvePhosphorIcon(iconName) {
  return iconRegistry[iconName] ?? Question
}
