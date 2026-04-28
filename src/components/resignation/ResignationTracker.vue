<template>
  <div v-if="resignation" class="resignation-tracker">
    <div class="tracker-header">
      <ion-icon :icon="documentTextOutline" class="tracker-icon"></ion-icon>
      <h3>{{ $t('resignation.trackerTitle', 'Active Resignation Track') }}</h3>
    </div>
    <p v-if="description" class="tracker-info">{{ description }}</p>
    <div class="tracker-body">
      <div class="status-row">
        <span class="label">{{ $t('resignation.status', 'Status:') }}</span>
        <span class="badge" :class="getStateClass(resignation.workflow_state)">
          {{ resignation.workflow_state }}
        </span>
      </div>
      <div class="date-row" v-if="resignation.relieving_date">
        <span class="label">{{ $t('resignation.relievingDate', 'Relieving Date:') }}</span>
        <span class="value">{{ resignation.relieving_date }}</span>
      </div>
      <div class="date-row" v-if="resignation.resignation_date && showInitiated">
        <span class="label">{{ $t('resignation.initiatedDate', 'Initiated:') }}</span>
        <span class="value">{{ resignation.resignation_date }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IonIcon } from '@ionic/vue';
import { documentTextOutline } from 'ionicons/icons';

const props = defineProps({
  resignation: {
    type: Object,
    default: null
  },
  description: {
    type: String,
    default: ""
  },
  showInitiated: {
    type: Boolean,
    default: false
  }
});

const STATE_CLASSES = {
  'Approved': 'approved',
  'Pending Supervisor': 'pending-supervisor',
  'Pending Operations Manager': 'pending-operations-manager',
  'Requires Adjustment': 'requires-adjustment',
  'Pending Employee Update': 'pending-employee-update',
  'Rejected': 'rejected',
  'Cancelled': 'cancelled',
  'Withdrawn': 'withdrawn'
};

const getStateClass = (state) => {
  return STATE_CLASSES[state] || 'default-state';
};
</script>

<style scoped lang="scss">
.resignation-tracker {
  background: var(--ion-color-step-850, #2a2d32);
  border-radius: 16px;
  padding: 20px;
  margin-block-start: 10px;
  margin-block-end: 5px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  
  .tracker-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-block-end: 8px;
    color: var(--ion-color-primary, #62c3e2);
    
    .tracker-icon {
      width: 24px;
      height: 24px;
    }
    h3 { 
      margin: 0; 
      font-size: 18px; 
      font-weight: 500; 
      letter-spacing: 0.3px; 
    }
  }

  .tracker-info {
    font-size: 13px;
    color: var(--ion-color-step-600, #a0a4a8);
    margin-block-start: 0;
    margin-block-end: 16px;
    line-height: 1.4;
  }
  
  .tracker-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    
    .status-row, .date-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-block: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .date-row:last-child { border-bottom: none; }
    
    .label { color: #ffffff; font-size: 15px; }
    .value { color: var(--ion-color-primary, #62c3e2); font-size: 15px; font-weight: 500; }
    
    .badge {
      padding-block: 6px;
      padding-inline: 14px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      
      &.approved { background: rgba(45, 211, 111, 0.2); color: #2dd36f; }
      &.pending-supervisor, &.pending-operations-manager { background: rgba(255, 196, 9, 0.2); color: #ffc409; }
      &.requires-adjustment, &.pending-employee-update { background: rgba(235, 68, 90, 0.2); color: #eb445a; }
    }
  }
}
</style>
