import pathlib
import re

f = pathlib.Path('/Users/sameralhalaki/Desktop/urkio-web-test/src/pages/HealingCenter.tsx')
content = f.read_text(encoding='utf-8')

# Search for the specific line
pattern = r'onClick=\{\(\) => navigate\(\`/user/\$\{expert\.id\}\`\)\}'
replacement = 'onClick={() => navigate(`/user/${expert.id}?resume=1`)}'

if re.search(pattern, content):
    content = re.sub(pattern, replacement, content)
    print('onClick replaced')
else:
    print('onClick pattern NOT FOUND')

f.write_text(content, encoding='utf-8')
