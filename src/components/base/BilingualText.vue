<script setup>
import { useI18n } from "vue-i18n";
import { useSecondaryLanguage } from "@/composable/useSecondaryLanguage";

const props = defineProps({
  tKey: {
    type: String,
    required: true,
  },
  fallback: {
    type: String,
    required: true,
  },
  tag: {
    type: String,
    default: "span",
  },
});

const { t } = useI18n();
const { secondaryText } = useSecondaryLanguage();
</script>

<template>
  <component :is="props.tag">
    {{ t(props.tKey, props.fallback) }}
    <span v-if="secondaryText(props.tKey)" class="bilingual-secondary" dir="auto">
      {{ secondaryText(props.tKey) }}
    </span>
  </component>
</template>

<style scoped lang="scss">
.bilingual-secondary {
  display: block;
  font-size: 0.85em;
  opacity: 0.75;
  font-weight: 400;
}
</style>
