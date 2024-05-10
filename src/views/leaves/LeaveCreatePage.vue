<script setup>
import { IonContent, IonSelect, IonTextarea, IonPage, useIonRouter, IonInput, onIonViewWillEnter } from "@ionic/vue";
import LeavesHeader from "@/components/leaves/Header.vue";

import { chevronDownOutline } from "ionicons/icons";
import Datepicker from "@/components/base/Datepicker.vue";
import { useLangStore } from "@/store/lang.js";
import { ref, reactive, computed, shallowRef, watch } from "vue";
import useDateHelper from "@/composable/useDateHelper";
import { useCustomToast } from "@/composable/toast.js";
import leave from "@/api/leave";
import { useUserStore } from "@/store/user.js";

const userStore = useUserStore();
const { showErrorToast } = useCustomToast();
const router = useIonRouter();
const langStore = useLangStore();
const { formatDate, dayjs } = useDateHelper();

const triggerBack = () => {
  router.push("/leaves");
};

const selectedLeaveType = ref('')
watch(selectedLeaveType, () => {
	errors.leaveType = false
	fetchLeaveBalance()
})
const selectedReason = ref('')
watch(selectedReason, () => {
	errors.reason = false
})

const leaveOptions = ref([])
const fetchLeaveTypes = async () => {
	try {
		const { data } = await leave.types({
			employee_id: userStore.user?.employee_id,
		});
		
		leaveOptions.value = data.data || []
	} catch (error) {
		showErrorToast(error.data?.error?.message || error.data?.error);
	}
}

const EMPTY_LEAVE_BALANCE = {
	expired_leaves: null,
	leave_type: "",
	leaves_pending_approval: null,
	leaves_taken: null,
	remaining_leaves: null,
	total_leaves: null,
}
const leaveBalance = ref({ ...EMPTY_LEAVE_BALANCE })
const fetchLeaveBalance = async () => {
	try {
		const { data } = await leave.balance({
			employee_id: userStore.user?.employee_id,
			leave_type: selectedLeaveType.value,
		});
		
		leaveBalance.value = { ...data.data };
	} catch (error) {
		showErrorToast(error.data?.error?.message || error.data?.error);
	}
}
const clearLeaveBalance = () => {
	leaveBalance.value = { ...EMPTY_LEAVE_BALANCE }
}

const selectedDates = reactive({
	from_date: null,
	to_date: null,
})
const selectedDateDifference = computed(() => {
	if (!selectedDates.from_date || !selectedDates.to_date) {
		return null
	}
	
	const startDate = dayjs(selectedDates.from_date)
	const endDate = dayjs(selectedDates.to_date)
	
	return endDate.diff(startDate, "day")
})

const formattedCurrentDate = formatDate(new Date(), "DD MMM, YYYY")

const datePickerRange = ref({
	start: null,
	end: null,
});
const isDatePickerOpen = shallowRef(false)
const setDatePickerOpen = (isOpen) => {
	isDatePickerOpen.value = isOpen
}
const onDatePickerOk = () => {
	selectedDates.from_date = datePickerRange.value.start
	selectedDates.to_date = datePickerRange.value.end
	
	errors.fromDate = false
	errors.toDate = false
	
	setDatePickerOpen(false)
}

const fileInput = ref()
const toBase64 = file => new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.readAsDataURL(file);
	reader.onload = () => resolve(reader.result.split(',')[1]);
	reader.onerror = reject;
});

const attachment = ref({
	name: null,
	base64: null
})
const onFileUpload = async (event) => {
	try {
		const file = event.target.files[0]
		
		attachment.value.base64 = await toBase64(file)
		attachment.value.name = file.name
		
		errors.proofDocument = false
	} catch (e) {
		console.error(e);
		showErrorToast("Failed to upload a file");
	}
}

const errors = reactive({
	leaveType: false,
	fromDate: false,
	toDate: false,
	reason: false,
	proofDocument: false,
})
const validateForm = () => {
	errors.leaveType = !selectedLeaveType.value;
	errors.fromDate = !selectedDates.from_date;
	errors.toDate = !selectedDates.to_date;
	errors.reason = !selectedReason.value;
	errors.proofDocument = !attachment.value.base64;
	
	return !errors.leaveType && !errors.fromDate && !errors.toDate && !errors.reason && !errors.proofDocument
}
const clearForm = () => {
	selectedLeaveType.value = ''
	selectedDates.from_date = null
	selectedDates.to_date = null
	selectedReason.value = ''
	attachment.value.name = null
	attachment.value.base64 = null
}
const onSubmit = async () => {
	const isValidForm = validateForm()
	if (!isValidForm) {
		return
	}
	
	try {
		await leave.createLeave({
			employee_id: userStore.user?.employee_id,
			from_date: dayjs(selectedDates.from_date).format("YYYY-MM-DD"),
			leave_type: selectedLeaveType.value,
			proof_document: JSON.stringify({
				attachment_name: attachment.value.name,
				attachment: attachment.value.base64,
			}),
			reason: selectedReason.value,
			to_date: dayjs(selectedDates.to_date).format("YYYY-MM-DD"),
		})
		
		clearForm();
		triggerBack();
	} catch (error) {
		console.error(error);
		showErrorToast(error.data?.error?.message || error.data?.error);
	}
}

onIonViewWillEnter(async () => {
	clearForm()
	clearLeaveBalance()
	await fetchLeaveTypes()
})
</script>

<template>
  <ion-page>
    <ion-content class="ion-padding leaves-page">
      <LeavesHeader
        :title="$t('user.leaves.new_leave_application')"
        class="leaves-page-header"
        @click-back="triggerBack"
      />

      <div class="leaves-create">
        <p class="leaves-create-label leaves-create-label__required">
          {{ $t("user.leaves.create_leave.type") }}
        </p>
        <ion-select
	        v-model="selectedLeaveType"
          placeholder="Select Leave Type"
          interface="action-sheet"
	        :interface-options="{
						buttons: [],
						cssClass: 'ion-select__hidden-cancel'
	        }"
	        class="ion-select__hidden-cancel"
	        :class="{
						'ion-touched ion-invalid': errors.leaveType,
	        }"
          :toggleIcon="chevronDownOutline"
          fill="outline"
        >
          <ion-select-option
	          v-for="leaveOption in leaveOptions"
	          :key="leaveOption"
	          :value="leaveOption"
          >
	          {{ leaveOption }}
          </ion-select-option>
        </ion-select>
        <span
	        class="leaves-create-label-required leaves-create-label__required"
	        :class="{
						'text-danger leaves-create-label__required-danger': errors.leaveType,
					}"
        >
          {{ $t("utils.required") }}
        </span>

        <div
	        v-if="leaveBalance.leave_type"
	        class="ion-margin-top"
        >
          <p class="leaves-create-label">
            {{ $t("user.leaves.create_leave.details") }}
          </p>
          <div class="leaves-create-detail-card">
            <ion-row
              class="leaves-create-detail-card-total-leaves leaves-create-detail-card-stats ion-align-items-center ion-justify-content-between"
            >
              <p>{{ $t("user.leaves.create_leave.total_leaves") }}</p>
              <span>{{ leaveBalance.total_leaves }}</span>
            </ion-row>
            <ion-row
              class="leaves-create-detail-card-stats ion-align-items-center ion-justify-content-between"
            >
              <p>{{ $t("user.leaves.create_leave.expired_leaves") }}</p>
	            <span>{{ leaveBalance.expired_leaves }}</span>
            </ion-row>
            <ion-row
              class="leaves-create-detail-card-stats ion-align-items-center ion-justify-content-between"
            >
              <p>{{ $t("user.leaves.create_leave.pending_leaves") }}</p>
	            <span>{{ leaveBalance.leaves_pending_approval }}</span>
            </ion-row>
            <ion-row
              class="leaves-create-detail-card-stats ion-align-items-center ion-justify-content-between"
            >
              <p>{{ $t("user.leaves.create_leave.leaves_taken") }}</p>
	            <span>{{ leaveBalance.leaves_taken }}</span>
            </ion-row>
            <ion-row
              class="leaves-create-detail-card-available-leaves leaves-create-detail-card-stats ion-align-items-center ion-justify-content-between"
            >
              <p>{{ $t("user.leaves.create_leave.available_leaves") }}</p>
	            <span>{{ leaveBalance.remaining_leaves }}</span>
            </ion-row>
          </div>
        </div>

        <ion-row class="ion-margin-top">
          <ion-col size="6">
            <p class="leaves-create-label leaves-create-label__required">
              {{ $t("user.leaves.detail.from") }}
            </p>
            <ion-input
	            fill="outline"
	            placeholder="From Date"
	            readonly
	            :class="{
	              'ion-touched ion-invalid': errors.fromDate,
	            }"
	            :value="formatDate(selectedDates.from_date, 'DD-MM-YYYY')"
	            @ion-focus="setDatePickerOpen(true)"
            />
            <span
	            class="leaves-create-label-required leaves-create-label__required"
	            :class="{
								'text-danger leaves-create-label__required-danger': errors.fromDate,
							}"
            >
	            {{ $t("utils.required") }}
            </span>
          </ion-col>
          <ion-col size="6">
            <p class="leaves-create-label leaves-create-label__required">
              {{ $t("user.leaves.detail.till") }}
            </p>
            <ion-input
	            fill="outline"
	            placeholder="Till Date"
	            readonly
	            :class="{
	              'ion-touched ion-invalid': errors.toDate,
	            }"
	            :value="formatDate(selectedDates.to_date, 'DD-MM-YYYY')"
	            @ion-focus="setDatePickerOpen(true)"
            />
            <span
	            class="leaves-create-label-required leaves-create-label__required"
	            :class="{
								'text-danger leaves-create-label__required-danger': errors.toDate,
							}"
            >
	            {{ $t("utils.required") }}
            </span>
          </ion-col>
        </ion-row>
	      <Datepicker
		      :lang="langStore.lang"
		      :is-open="isDatePickerOpen"
		      v-model="datePickerRange"
		      @cancel="setDatePickerOpen(false)"
		      @ok="onDatePickerOk"
	      />
	      
	      <div class="ion-margin-top">
          <p class="leaves-create-label leaves-create-label__required">
            {{ $t("user.leaves.detail.reason") }}
          </p>
          <ion-textarea
	          v-model="selectedReason"
	          :class="{
              'ion-touched ion-invalid': errors.reason,
            }"
            fill="outline"
            rows="6"
            placeholder="Enter reason here"
          />
          <span
	          class="leaves-create-label-required leaves-create-label__required"
	          :class="{
							'text-danger leaves-create-label__required-danger': errors.reason,
						}"
          >
	          {{ $t("utils.required") }}
          </span>
        </div>
	      
        <div class="ion-margin-top">
          <p
	          class="leaves-create-label leaves-create-label__required"
	          :class="{
							'text-danger leaves-create-label__required-danger': errors.proofDocument,
						}"
          >
            {{ $t("user.leaves.create_leave.proof_document") }}
          </p>
	        <span
		        v-if="attachment.name"
		        class="title-medium leaves-create-proof-document-name"
	        >
		        {{ attachment.name }}
	        </span>
          <ion-button
            shape="round"
            class="leaves-create-upload-button"
            expand="block"
            @click="fileInput?.click()"
          >
            {{ $t("user.leaves.create_leave.upload_proof_document") }}
          </ion-button>
	        <input
		        ref="fileInput"
		        class="ion-hide"
		        type="file"
		        @change="onFileUpload"
	        />
        </div>

        <div class="ion-margin-top leaves-create-summary-card">
          <div>
            <p class="leaves-create-summary-card-label">
              {{ $t("user.leaves.create_leave.posting_date") }}
            </p>
            <span class="leaves-create-summary-card-value">{{ formattedCurrentDate }}</span>
          </div>

          <div
	          v-if="typeof selectedDateDifference === 'number'"
	          class="leaves-create-summary-card-value-wrapper"
          >
            <p class="leaves-create-summary-card-label">
              {{ $t("user.leaves.create_leave.total_leaves_days") }}
            </p>
            <span class="leaves-create-summary-card-value">{{ selectedDateDifference }}</span>
          </div>
        </div>

        <ion-button shape="round" class="ion-margin-top" expand="block" @click="onSubmit">
          {{ $t("user.leaves.create_leave.save_leaves_application") }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped lang="scss">
.leaves-page {
  --padding-top: 0;
  --padding-bottom: 24px;
  --padding-start: 0;
  --padding-end: 0;

  &-header {
    position: sticky;
    top: 0;
    padding: 0 15px;
    z-index: 5;
    background: #191c1d;
  }
}

.leaves-create {
  padding: 0 16px 0;

  &-label-required {
    margin: 4px 16px;
    font-size: 0.75rem;
    line-height: 1rem;
    color: #8b9298;
  }

  &-label {
    color: #c0c7cd;
    font-size: 0.875rem;
    line-height: 1.25rem;
    margin: 0 0 8px;

    &__required {
      &:after {
        content: "*";
        color: #8b9298;
      }
	    
	    &-danger {
		    &:after {
			    content: "*";
			    color: #FFB4A9;
		    }
	    }
    }
  }

  &-detail-card {
    padding: 16px;
    border-radius: 16px;
    background: #1e2529;

    p {
      margin: 0;
    }

    &-stats {
      &:not(:first-child) {
        margin-top: 20px;
      }

      font-size: 1rem;
      line-height: 1.5rem;
      color: #8b9298;
    }

    &-total-leaves {
      color: #c0c7cd;
    }

    &-available-leaves {
      color: #76d1ff;
    }
  }
	
	&-proof-document {
		&-name {
			color: #e0e3e3;
		}
	}

  &-summary-card {
    padding: 16px;
    border-radius: 16px;
    background: #1e2529;

    p {
      margin: 0;
    }

    &-label {
      margin-bottom: 4px;
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: #8b9298;
    }

    &-value {
      font-size: 1rem;
      line-height: 1.5rem;
      color: #e0e3e3;
    }

    &-value-wrapper {
      margin-top: 8px;
    }
  }

  &-upload-button {
    --background: #004c69;
    --color: #c1e8ff;
  }
}
</style>
