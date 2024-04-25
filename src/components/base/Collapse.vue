<script setup>
import { nextTick, onMounted, ref, watch } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const height = ref(props.modelValue ? "auto" : 0);
const hideContent = ref(!props.modelValue);
const slotContent = ref();

const onTransitionEnd = () => {
  if (props.modelValue) {
    height.value = "auto";
    hideContent.value = false;
  }
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) {
      hideContent.value = true;
    }

    nextTick(() => {
      if (height.value === "auto") {
        height.value = slotContent.value.scrollHeight + "px";
      }
    });

    setTimeout(() => {
      height.value = (newValue ? slotContent.value.scrollHeight : 0) + "px";
    });
  },
);

onMounted(() => {
  height.value = (props.modelValue ? slotContent.value.scrollHeight : 0) + "px";
});
</script>

<template>
  <div
    ref="content"
    class="collapse-content"
    :class="{
      'overflow-hidden': hideContent,
    }"
    :style="{
      height: height,
    }"
    @transitionend="onTransitionEnd"
  >
    <div ref="slotContent">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.collapse-content {
  transition: height 0.3s ease-in-out;
}

.overflow-hidden {
  overflow: hidden;
}
</style>
