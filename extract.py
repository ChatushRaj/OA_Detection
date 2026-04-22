import json
with open('new-efficientnetv2-s-msscm.ipynb', encoding='utf-8') as f:
    nb = json.load(f)
cells = [c['source'] for c in nb['cells'] if c['cell_type'] == 'code']
with open('notebook_code.py', 'w', encoding='utf-8') as f:
    for cell in cells:
        f.write(''.join(cell) + '\n\n')
