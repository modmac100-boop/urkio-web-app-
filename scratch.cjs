const fs = require('fs');
const file = '/Users/sameralhalaki/Desktop/urkio-web-test/src/pages/Home.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const startIdx = 655; // line 656
const endIdx = 901;   // line 901 (inclusive)

const newLines = [
  '          {recentPosts.map((post) => (',
  '            <FeedPost ',
  '              key={post.id} ',
  '              post={post} ',
  '              user={userData} ',
  '              isRTL={isRTL} ',
  '              currentUserId={user?.uid} ',
  '            />',
  '          ))}'
];

lines.splice(startIdx, endIdx - startIdx, ...newLines);

fs.writeFileSync(file, lines.join('\n'));
console.log('Done');
