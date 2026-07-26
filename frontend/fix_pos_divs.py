import sys

file_path = 'd:/SUTANA/frontend/src/pages/sales/POSPage.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if '</div>' in line and i > 0 and 'placeholder="Phone"' in lines[i-1] and 'payerPhone' in lines[i-2]:
        new_lines.append('                          </div>\n')

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Done!')
