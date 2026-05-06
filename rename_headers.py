import os
import glob

files = glob.glob('src/views/resignation/*.vue') + glob.glob('src/views/leaves/*.vue')

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    # M1 Rename LeavesHeader
    content = content.replace('import LeavesHeader from "@/components/leaves/Header.vue";', 'import PageHeader from "@/components/common/PageHeader.vue";')
    content = content.replace('<LeavesHeader', '<PageHeader')
    
    with open(file, 'w') as f:
        f.write(content)
