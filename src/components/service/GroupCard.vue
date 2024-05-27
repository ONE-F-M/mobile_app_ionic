<script setup>
import BaseCollapse from "@/components/base/Collapse.vue";
import { ref, watch } from "vue";
import {
  IonCard,
  IonCardContent,
  IonRow,
  IonButton,
  IonText,
} from "@ionic/vue";
import IconChevronDown from "@/components/icon/ChevronDown.vue";

const props = defineProps({
  serviceGroup: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: String,
    required: true,
  },
});

const emit = defineEmits([
  "update:model-value",
  "remove-service",
  "add-service",
  "open-service",
]);

const showContent = ref(false);

const updateService = (added, service) => {
  if (!added) {
    emit("add-service", service);
  } else {
    emit("remove-service", service);
  }
};

watch(
  () => showContent.value,
  (newValue) => {
    if (newValue) {
      emit("update:model-value", props.serviceGroup.name);
    }
  },
);

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== props.serviceGroup.name) {
      showContent.value = false;
    }
  },
);
</script>

<template>
  <ion-card class="group-card" :class="{ 'active-card': showContent }">
    <ion-card-content>
      <ion-row
        class="ion-align-items-center ion-justify-content-between group-card-header-wrapper"
        @click="showContent = !showContent"
      >
        <div class="group-card-title-wrapper">
          <span
            class="mdi group-card-title-icon"
            :class="`mdi-${serviceGroup.icon}`"
          ></span>
          <ion-text>
            <p class="group-card-title">{{ serviceGroup.name }}</p>
          </ion-text>
        </div>
        <IconChevronDown class="group-card-title-collapse-icon" />
      </ion-row>
      <BaseCollapse v-model="showContent">
        <div class="group-card-collapse-content">
          <ion-row
            v-for="service in serviceGroup.services"
            :key="service.name"
            class="ion-align-items-center ion-justify-content-between group-card-service-item"
          >
            <ion-row
              class="ion-align-items-center"
              @click="$emit('open-service', service.name)"
            >
              <div class="services-item-icon-wrapper">
                <span class="mdi" :class="`mdi-${service.icon}`" />
              </div>
              <p class="services-item-label">
                {{ service.name }}
              </p>
            </ion-row>
            <ion-button
              class="services-item-button"
              shape="round"
              size="small"
              @click="updateService(service.added, service)"
            >
              {{
                service.added
                  ? $t("user.service.remove")
                  : $t("user.service.get")
              }}
            </ion-button>
          </ion-row>
        </div>
      </BaseCollapse>
    </ion-card-content>
  </ion-card>
</template>

<style scoped lang="scss">
.group-card {
  margin: 0;
  background: #202b2f;
  border-radius: 12px;
  transition: background-color 0.3s ease;

  .card-content-md {
    padding: 16px;
  }

  &.active-card {
    background: #233036;
  }

  &-collapse-content {
    padding-top: 16px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &.active-card &-collapse-content {
    opacity: 1;
  }

  &-header-wrapper {
    color: white;
    transition: color 0.5s ease;
  }

  &.active-card &-header-wrapper {
    color: #76d1ff;
  }

  &-title-wrapper {
    margin: 0;
    display: flex;
    align-items: center;
  }
  &-title-icon {
    font-size: 24px;
  }

  &.active-card &-title-collapse-icon {
    transform: rotate(180deg);
  }

  &-title-collapse-icon {
    transition: transform 0.5s ease;
  }

  &-title {
    margin: 4px 0 0 8px;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.25rem;
  }

  &-service-item:not(:last-child) {
    margin-bottom: 12px;
  }
}

.services {
  display: flex;
  flex-wrap: wrap;
  margin-left: -4px;
  width: calc(100% + 8px);

  &-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 25%;
    padding: 0 2.5px;
    margin-bottom: 22px;

    &-icon {
      width: 24px;
      height: 24px;
      object-fit: contain;

      &-wrapper {
        width: 55px;
        height: 52px;
        border-radius: 10px;
        font-size: 24px;
        color: #003549;
        background-color: var(--ion-color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    &-button {
      --background: #004b68;
      --color: #c1e8ff;
      --box-shadow: none;
      margin: 0;
      --padding-top: 4px;
      --padding-start: 20px;
      --padding-end: 20px;
      --padding-bottom: 4px;
    }

    &-label {
      color: #e0e3e3;
      margin-left: 8px;
      text-align: center;
      font-weight: 500;
      font-size: 14px;
      line-height: 20px;
    }
  }
}
</style>
