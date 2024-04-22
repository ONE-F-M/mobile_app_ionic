<script setup>
import { IonButton, IonContent, IonPage, useIonRouter } from "@ionic/vue";
import { useUserStore } from "@/store/user.js";

const router = useIonRouter();
const userStore = useUserStore();

const logout = () => {
  userStore.logout();
  router.push("/");
};

if (!userStore.user || !userStore.token) {
  logout();
}
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding">
      <h3 class="home-title ion-text-center">
        {{ $t("user.home.title") }}
      </h3>
      <div class="services">
        <div class="services-item">
          <div class="services-item-icon-wrapper">
            <img
              src="/image/icon/home/check-in-checkout.svg"
              alt="services-item-icon"
              class="services-item-icon"
            />
          </div>
          <div class="services-item-label">Checkin Checkout</div>
        </div>
        <div class="services-item">
          <div class="services-item-icon-wrapper">
            <img
              src="/image/icon/home/penalty.svg"
              alt="services-item-icon"
              class="services-item-icon"
            />
          </div>
          <div class="services-item-label">Penalties</div>
        </div>
        <div class="services-item">
          <div class="services-item-icon-wrapper">
            <img
              src="/image/icon/home/new_penalty.svg"
              alt="services-item-icon"
              class="services-item-icon"
            />
          </div>
          <div class="services-item-label">Penalty Issuance</div>
        </div>
        <div class="services-item">
          <div class="services-item-icon-wrapper">
            <img
              src="/image/icon/home/leave.svg"
              alt="services-item-icon"
              class="services-item-icon"
            />
          </div>
          <div class="services-item-label">Leaves</div>
        </div>
        <div class="services-item">
          <div class="services-item-icon-wrapper">
            <img
              src="/image/icon/home/new_application.svg"
              alt="services-item-icon"
              class="services-item-icon"
            />
          </div>
          <div class="services-item-label">New Leave Application</div>
        </div>
      </div>
      <ion-button expand="block" shape="round" @click="logout">
        {{ $t("user.home.logout") }}
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<style lang="scss" scoped>
.home {
  &-title {
    margin-top: 2px;
    margin-bottom: 35px;
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
        width: 66px;
        height: 62px;
        border-radius: 13px;
        background-color: var(--ion-color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    &-label {
      margin-top: 8px;
      text-align: center;
      font-size: 14px;
      line-height: 20px;
    }
  }
}
</style>
