<template>
  <svg
    v-if="resolvedPath"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    role="img"
    aria-hidden="true"
    class="mdi-svg-icon"
  >
    <path :d="resolvedPath" fill="currentColor" />
  </svg>
  <!-- Fallback: renders nothing (keeps layout) if icon not found -->
  <span v-else class="mdi-svg-icon mdi-svg-icon--missing" :style="{ width: size + 'px', height: size + 'px' }" />
</template>

<script setup>
import { computed } from 'vue'

/**
 * MdiIcon — A tree-shakeable SVG icon component.
 *
 * Instead of loading the entire ~240 KB @mdi/font webfont,
 * this component accepts an SVG path directly OR resolves
 * a kebab-case icon name from a curated map.
 *
 * Usage:
 *   <MdiIcon name="clock-outline" />
 *   <MdiIcon :path="mdiClockOutline" />
 */

// Import ONLY the specific icons used by the app's services.
// Each import is ~200 bytes vs the full 240 KB font.
// Add new icons here as the API introduces new services.
import {
  mdiClockOutline,
  mdiCalendar,
  mdiCalendarMonth,
  mdiCalendarCheck,
  mdiCalendarMinus,
  mdiCalendarClock,
  mdiFileDocument,
  mdiFileDocumentOutline,
  mdiAccountClock,
  mdiAccountClockOutline,
  mdiAccountGroup,
  mdiAccountCheck,
  mdiMapMarker,
  mdiMapMarkerOutline,
  mdiCheckCircle,
  mdiCheckCircleOutline,
  mdiClipboardText,
  mdiClipboardTextOutline,
  mdiClipboardCheck,
  mdiClipboardCheckOutline,
  mdiBriefcase,
  mdiBriefcaseOutline,
  mdiCog,
  mdiCogOutline,
  mdiBell,
  mdiBellOutline,
  mdiHome,
  mdiHomeOutline,
  mdiLogout,
  mdiLogin,
  mdiPencil,
  mdiPencilCircleOutline,
  mdiPlus,
  mdiClose,
  mdiChevronDown,
  mdiChevronRight,
  mdiArrowRight,
  mdiEye,
  mdiEyeOutline,
  mdiEyeCheckOutline,
  mdiFilter,
  mdiFilterOutline,
  mdiMagnify,
  mdiDotsVertical,
  mdiInformation,
  mdiInformationOutline,
  mdiAlert,
  mdiAlertOutline,
  mdiShieldCheck,
  mdiShieldCheckOutline,
  mdiHammer,
  mdiWrench,
  mdiTools,
  mdiHandshake,
  mdiHandshakeOutline,
  mdiFolderOpen,
  mdiFolderOpenOutline,
  mdiCurrencyUsd,
  mdiCash,
  mdiCashMultiple,
  mdiStar,
  mdiStarOutline,
  mdiHeart,
  mdiHeartOutline,
  mdiFlag,
  mdiFlagOutline,
  mdiBook,
  mdiBookOutline,
  mdiSchool,
  mdiHardHat,
  mdiFireExtinguisher,
  mdiSecurity,
  mdiDomain,
  mdiOfficeBuildingOutline,
  mdiOfficeBuilding,
  mdiTruck,
  mdiTruckOutline,
  mdiPhone,
  mdiPhoneOutline,
  mdiEmail,
  mdiEmailOutline,
  mdiMapMarkerDistance,
  mdiSwapHorizontalCircle,
  mdiCalendarRange,
  mdiPackageVariant,
} from '@mdi/js'

// Map from kebab-case icon name (as returned by the API) to SVG path data.
// The key format matches what the API sends in `service_icon` / `icon` fields.
const iconMap = {
  'clock-outline': mdiClockOutline,
  'calendar': mdiCalendar,
  'calendar-month': mdiCalendarMonth,
  'calendar-check': mdiCalendarCheck,
  'calendar-minus': mdiCalendarMinus,
  'calendar-clock': mdiCalendarClock,
  'file-document': mdiFileDocument,
  'file-document-outline': mdiFileDocumentOutline,
  'account-clock': mdiAccountClock,
  'account-clock-outline': mdiAccountClockOutline,
  'account-group': mdiAccountGroup,
  'account-check': mdiAccountCheck,
  'map-marker': mdiMapMarker,
  'map-marker-outline': mdiMapMarkerOutline,
  'check-circle': mdiCheckCircle,
  'check-circle-outline': mdiCheckCircleOutline,
  'clipboard-text': mdiClipboardText,
  'clipboard-text-outline': mdiClipboardTextOutline,
  'clipboard-check': mdiClipboardCheck,
  'clipboard-check-outline': mdiClipboardCheckOutline,
  'briefcase': mdiBriefcase,
  'briefcase-outline': mdiBriefcaseOutline,
  'cog': mdiCog,
  'cog-outline': mdiCogOutline,
  'bell': mdiBell,
  'bell-outline': mdiBellOutline,
  'home': mdiHome,
  'home-outline': mdiHomeOutline,
  'logout': mdiLogout,
  'login': mdiLogin,
  'pencil': mdiPencil,
  'pencil-circle-outline': mdiPencilCircleOutline,
  'plus': mdiPlus,
  'close': mdiClose,
  'chevron-down': mdiChevronDown,
  'chevron-right': mdiChevronRight,
  'arrow-right': mdiArrowRight,
  'eye': mdiEye,
  'eye-outline': mdiEyeOutline,
  'eye-check-outline': mdiEyeCheckOutline,
  'filter': mdiFilter,
  'filter-outline': mdiFilterOutline,
  'magnify': mdiMagnify,
  'dots-vertical': mdiDotsVertical,
  'information': mdiInformation,
  'information-outline': mdiInformationOutline,
  'alert': mdiAlert,
  'alert-outline': mdiAlertOutline,
  'shield-check': mdiShieldCheck,
  'shield-check-outline': mdiShieldCheckOutline,
  'hammer': mdiHammer,
  'wrench': mdiWrench,
  'tools': mdiTools,
  'handshake': mdiHandshake,
  'handshake-outline': mdiHandshakeOutline,
  'folder-open': mdiFolderOpen,
  'folder-open-outline': mdiFolderOpenOutline,
  'currency-usd': mdiCurrencyUsd,
  'cash': mdiCash,
  'cash-multiple': mdiCashMultiple,
  'star': mdiStar,
  'star-outline': mdiStarOutline,
  'heart': mdiHeart,
  'heart-outline': mdiHeartOutline,
  'flag': mdiFlag,
  'flag-outline': mdiFlagOutline,
  'book': mdiBook,
  'book-outline': mdiBookOutline,
  'school': mdiSchool,
  'hard-hat': mdiHardHat,
  'fire-extinguisher': mdiFireExtinguisher,
  'security': mdiSecurity,
  'domain': mdiDomain,
  'office-building-outline': mdiOfficeBuildingOutline,
  'office-building': mdiOfficeBuilding,
  'truck': mdiTruck,
  'truck-outline': mdiTruckOutline,
  'phone': mdiPhone,
  'phone-outline': mdiPhoneOutline,
  'email': mdiEmail,
  'email-outline': mdiEmailOutline,
  'swap_horizontal_circle': mdiSwapHorizontalCircle,
  'calendar-range': mdiCalendarRange,
  'inventory_2': mdiPackageVariant,
}

const props = defineProps({
  /** Direct SVG path data string (takes priority over `name`) */
  path: { type: String, default: '' },
  /** Kebab-case icon name matching the API's service_icon field, e.g. "clock-outline" */
  name: { type: String, default: '' },
  /** Icon size in pixels */
  size: { type: [String, Number], default: 24 },
})

const resolvedPath = computed(() => {
  if (props.path) return props.path
  if (props.name && iconMap[props.name]) return iconMap[props.name]
  if (props.name) {
    console.warn(`[MdiIcon] Unknown icon name: "${props.name}". Add it to the iconMap in MdiIcon.vue.`)
  }
  return null
})
</script>

<style scoped>
.mdi-svg-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
.mdi-svg-icon--missing {
  display: inline-block;
}
</style>
