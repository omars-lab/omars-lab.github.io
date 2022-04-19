#!/usr/bin/env python3

# Show how I can print a calendar over terminal with the proper xcallbacks to open files regarding my todos across the different days ...!
# https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda

# https://unix.stackexchange.com/questions/180783/sed-e-and-g-flags-not-working-together
cal -h | gsed -E 's#([0-9]+)#print-link "\1"; printf " "; #ge'

# https://unix.stackexchange.com/questions/230795/sed-how-to-use-b-word-boundary-correctly  
cal -h | gsed -E 's#([ ]*)\b([0-9]{1,2}) #printf "\1"; resolve noteplan "\2"; printf " "; #ge'

