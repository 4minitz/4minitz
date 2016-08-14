count=$(($1*10))
text="{
  \"username\": \"user3\",
  \"meetingName\": \"Test #$1\",
  \"minutesCount\": 1,
  \"topicsCount\": $count,
  \"infoItemsCount\": 1,
  \"actionItemsCount\": 1
}"
echo "$text" > tmp.json

node createMinutesData.js -m mongodb://localhost:3101/meteor -c tmp.json

rm tmp.json

