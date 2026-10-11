with open(r'C:\Users\Muhammad Ashrafz\.gemini\antigravity\brain\14a44973-70b7-4f41-a9a0-bfcfa9435f85\.system_generated\steps\152\content.md', 'r', encoding='utf-8') as f:
    text = f.read()

pos = text.find('Beware of phishing')
if pos != -1:
    print('Found banner at:', pos)
    print(text[max(0, pos-300):pos+600])
