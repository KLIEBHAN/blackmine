import re

with open('full_content.txt', 'r') as f:
    lines = f.readlines()

issues = []
current_issue = None
in_rowgroup = False

date_pattern = re.compile(r'\d{2}\.\d{2}\.\d{4}')

for i, line in enumerate(lines):
    if 'rowgroup [ref=e108]' in line: in_rowgroup = True
    if not in_rowgroup: continue
    
    row_match = re.search(r'^\s+- (?:row |\'row )"([^"]+)"', line)
    if row_match:
        if current_issue: issues.append(current_issue)
        row_content = row_match.group(1)
        # Extract due date from row summary as fallback
        dates_in_row = date_pattern.findall(row_content)
        fallback_date = dates_in_row[-1] if dates_in_row else ""
        current_issue = {'iid': row_content.split(' ')[0], 'cells': [], 'fallback_date': fallback_date}
        continue

    if '- cell' in line or '- \'cell' in line:
        content_match = re.search(r'cell\s+"([^"]*)"', line)
        if content_match:
            content = content_match.group(1)
        else:
            content = ""
            look_ahead = 1
            while look_ahead < 5 and i + look_ahead < len(lines):
                next_line = lines[i + look_ahead]
                if '- cell' in next_line or '- row' in next_line or '- \'row' in next_line: break
                text_match = re.search(r'^\s+- (?:link|text) "([^"]+)"', next_line)
                if text_match:
                    content = text_match.group(1)
                    break
                look_ahead += 1
        
        indent = len(re.match(r'^\s*', line).group(0))
        if indent == 12:
            current_issue['cells'].append(content)

if current_issue: issues.append(current_issue)

print(f"{'ID':<5} | {'Subject':<60} | {'Project':<15} | {'Tracker':<12} | {'Status':<10} | {'Priority':<8} | {'Assignee':<15} | {'Due Date':<10}")
print("-" * 155)

for issue in issues:
    cells = issue['cells']
    if len(cells) < 8: continue
    
    iid = cells[1]
    project = cells[2]
    tracker = cells[3]
    status = cells[4]
    priority = cells[5]
    subject = cells[6]
    assignee = cells[7]
    
    due_date = ""
    for c in cells:
        if date_pattern.fullmatch(c):
            due_date = c
    
    if not due_date:
        due_date = issue['fallback_date']

    print(f"{iid:<5} | {subject[:60]:<60} | {project[:15]:<15} | {tracker[:12]:<12} | {status[:10]:<10} | {priority[:8]:<8} | {assignee[:15]:<15} | {due_date:<10}")

