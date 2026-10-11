with open(r'C:\Users\Muhammad Ashrafz\.gemini\antigravity\brain\14a44973-70b7-4f41-a9a0-bfcfa9435f85\.system_generated\steps\152\content.md', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('navbar')
if pos != -1:
    print('Found navbar at:', pos)
    print(text[max(0, pos-200):pos+1800])
else:
    print('navbar not found, searching nav')
    p2 = text.find('<nav')
    print(text[p2:p2+1500])
