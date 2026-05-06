import os

pages = [
    "src/views/resignation/ExtensionCreatePage.vue",
    "src/views/resignation/WithdrawalCreatePage.vue"
]

for page in pages:
    if os.path.exists(page):
        with open(page, 'r') as f:
            content = f.read()
        
        # S7: Guard Submit
        if "supervisorLoading" not in content:
            content = content.replace('const isLoading = ref(false);', 'const isLoading = ref(false);\nconst supervisorLoading = ref(false);')
            content = content.replace('const fetchSupervisor = async (empId) => {', 'const fetchSupervisor = async (empId) => {\n  supervisorLoading.value = true;')
            content = content.replace('console.error("Failed to load supervisor", error);\n  }', 'console.error("Failed to load supervisor", error);\n  } finally {\n    supervisorLoading.value = false;\n  }')
            content = content.replace('<ion-button\n          shape="round"\n          class="submit-btn"\n          expand="block"\n          @click="onSubmit"\n        >', '<ion-button\n          shape="round"\n          class="submit-btn"\n          expand="block"\n          @click="onSubmit"\n          :disabled="isLoading || supervisorLoading"\n        >')
            content = content.replace('<ion-button \n          class="submit-btn" \n          expand="block" \n          shape="round"\n          @click="submitData" \n        >', '<ion-button \n          class="submit-btn" \n          expand="block" \n          shape="round"\n          @click="submitData"\n          :disabled="isLoading || supervisorLoading"\n        >')
        
        # M7
        content = content.replace('router.push("/service");', 'router.canGoBack() ? router.back() : router.push("/resignation");')
        
        with open(page, 'w') as f:
            f.write(content)
