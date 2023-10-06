# Manual I18N Checklist

The following file lists most of the Ui visible Text with pre-conditions how to make
them visible on the screen.
For
* Whole screens
* Menues
* Dialogs
* Error/Warning/Info Messages

The idea is: when a new language is introduced to I18N / NLS then the
below preconditions can be created, and then the user interface can be checked if the
expexted content now shows up in the new translated language.


<hr>

## 001-Screen.Login

Precondition:

* No user logged in

![](screenshots-en/001-Screen.Login.png)



<hr>

## 001.1-Dlg.About.png

Precondition:

* Clicked main menu 'About'

![](screenshots-en/001.1-Dlg.About.png)



<hr>

## 001.1-Dlg.About-Stats.png

Precondition:

* Clicked main menu 'About'
* Clicked on 4Minitz icon to open statistics

![](screenshots-en/001.1-Dlg.About-Stats.png)



<hr>

## 001.2-Msg.LoginError.png

Precondition:

* No user logged in
* Wrong login credentials

![](screenshots-en/001.2-Msg.LoginError.png)



<hr>

## 001.2-Screen.CreateAccount.png

Precondition:

* No user logged in
* Click 'Register' new user

![](screenshots-en/001.2-Screen.CreateAccount.png)



<hr>

## 001.2-Screen.ResendVerification.png

Precondition:

* No user logged in
* Click 'Resend' Verification Mail

![](screenshots-en/001.2-Screen.ResendVerification.png)



<hr>

## 001.2-Screen.ResetPassword.png

Precondition:

* No user logged in
* Click 'Forgot Your Password'

![](screenshots-en/001.2-Screen.ResetPassword.png)



<hr>

## 001.3-Screen.LegalNotice.png

Precondition:

* Click 'Impressum / Legal Notice'
* Hint: Only OK-Button needs translation. Legal Notice is controlled via settings.json by admin

![](screenshots-en/001.3-Screen.LegalNotice.png)



<hr>

## 002.1-Dlg.ChangePassword.png

Precondition:

* User menu: Change Password

![](screenshots-en/002.1-Dlg.ChangePassword.png)



<hr>

## 002.1-Dlg.EditProfile.png

Precondition:

* User Menu: Edit Profile

![](screenshots-en/002.1-Dlg.EditProfile.png)



<hr>

## 002.1-Msg.EditProfileFlashmessage.png

Precondition:

* User Menu: Edit Profile
* Make some changes
* Press OK

![](screenshots-en/002.1-Msg.EditProfileFlashmessage.png)



<hr>

## 002.1-Msg.EditProfileConfirmReverifyEMail.png

Precondition:

* Ensure, settings.json has EMail verifiation set
* User Menu: Edit Profile
* Change mail address
* Press OK

![](screenshots-en/002.1-Msg.EditProfileConfirmReverifyEMail.png)



<hr>

## 002.1-Dlg.SetLanguage.png

Precondition:

* User menu: Set Language

![](screenshots-en/002.1-Dlg.SetLanguage.png)




<hr>

## 002.1-Menu.Usermenu.png

Precondition:

* User is not admin
* Open user menu

![](screenshots-en/002.1-Menu.Usermenu.png)



<hr>

## 002.1-Menu.Adminmenu.png

Precondition:

* User is admin User
* Open User menu

![](screenshots-en/002.1-Menu.Adminmenu.png)



<hr>

## 003.0-Dlg.NewMeetingSeries.png

Precondition:

* On main screen
* Click Button 'New Meeting Series'

![](screenshots-en/003.0-Dlg.NewMeetingSeries.png)



<hr>

## 003.1-Dlg.EditMeetingSeries-Base.png

Precondition:

* Just created new meeting series
* Click on tab 'Base Configuration'

![](screenshots-en/003.1-Dlg.EditMeetingSeries-Base.png)



<hr>

## 003.1-Dlg.EditMeetingSeries-Labels.png

Precondition:

* Just created new meeting series
* Click on tab 'Labels'

![](screenshots-en/003.1-Dlg.EditMeetingSeries-Labels.png)



<hr>

## 003.1-Dlg.EditMeetingSeries-Users.png

Precondition:

* Just created new meeting series
* Click on tab 'Invited and Informed Users'

![](screenshots-en/003.1-Dlg.EditMeetingSeries-Users.png)



<hr>

## 003.1-Dlg.EditMeetingSeries-UsersRole.png

Precondition:

* Just created new meeting series
* Click on tab 'Invited and Informed Users'
* Add a new user
* Change role of user

![](screenshots-en/003.1-Dlg.EditMeetingSeries-UsersRole.png)



<hr>

## 003.1-Msg.EditSoftLock.png

Precondition:

* Open 4Minitz in two different browsers
* In each browser login as different user
* User#1 'Edit Meeting Series'
* User#2 try to 'Edit Meeting Series'

![](screenshots-en/003.1-Msg.EditSoftLock.png)



<hr>

## 003.1-Screen.Meetings.png

Precondition:

* Create a meeting series with one meeting

![](screenshots-en/003.1-Screen.Meetings.png)



<hr>

## 003.2-Screen.MyActionItems.png

Precondition:

* Create meeting series with one meeting minute
* Inside meeting minute create one action item for current user

![](screenshots-en/003.2-Screen.MyActionItems.png)



<hr>

## 003.2-Screen.MyActionItemsFilter.png

Precondition:

* On 'My Action Item' tab open item filters

![](screenshots-en/003.2-Screen.MyActionItemsFilter.png)



<hr>

## 004.1-Screen.Minutes.png

Precondition:

* Create meeting series
* Create two meeting minutes

![](screenshots-en/004.1-Screen.Minutes.png)



<hr>

## 004.1-Screen.MinutesNonModerator.png

Precondition:

* Non moderator is invited to meeting series
* Button 'Leave Meeting Series' should show up

![](screenshots-en/004.1-Screen.MinutesNonModerator.png)



<hr>

## 004.1-Msg.MinutesNonModeratorLeaveConfirmation.png

Precondition:

* Non moderator is invited to meeting series
* Button 'Leave Meeting Series' should show up

![](screenshots-en/004.1-Msg.MinutesNonModeratorLeaveConfirmation.png)



<hr>

## 004.2-Screen.Minutes.Topics.png

Precondition:

* On Meeting Series Topic list
* A closed topic has menu 'Reopen Topic'

![](screenshots-en/004.2-Screen.Minutes.Topics.png)



<hr>

## 004.2-Dlg.Minutes.TopicsFilter.png

Precondition:

* On Meeting Series Topic list
* Open topic filters
* Click '?' question mark for help

![](screenshots-en/004.2-Dlg.Minutes.TopicsFilter.png)



<hr>

## 004.2-Menu.Minutes.Topics-Reopen.png

Precondition:

* On Meeting Series Topic list
* A closed topic shows 'Reopen Topic' menu

![](screenshots-en/004.2-Menu.Minutes.Topics-Reopen.png)



<hr>

## 004.2-Msg.Minutes.Topics-ReopenConfirmation.png

Precondition:

* On Meeting Series goto Topic list
* On a closed toipic from three-dot menu select 'Reopen Topic'

![](screenshots-en/004.2-Msg.Minutes.Topics-ReopenConfirmation.png)



<hr>

## 004.3-Dlg.Minutes-ItemsFilter.png

Precondition:

* On Meeting Series Item List
* Item filter
* Click '?' question mark for help

![](screenshots-en/004.3-Dlg.Minutes-ItemsFilter.png)



<hr>

## 004.3-Screen.Minutes-Items.png

Precondition:

* On Meeting Series Item List

![](screenshots-en/004.3-Screen.Minutes-Items.png)



<hr>

## 004.3-Dlg.Minutes-ItemsFilter.png

Precondition:

* On Meeting Series Item List
* Item filter
* Click '?' question mark for help

![](screenshots-en/004.3-Dlg.Minutes-ItemsFilter.png)



<hr>

## 004.4-Screen.OneTopic.png

Precondition:

* On Meeting Series Item List
* Click on 'Show Topic'

![](screenshots-en/004.4-Screen.OneTopic.png)



<hr>

## 005.1-Screen.MinutesEdit.png

Precondition:

* Create Meeting Series
* Create new Meeting Minutes

![](screenshots-en/005.1-Screen.MinutesEdit.png)




<hr>

## 005.1-Dlg.MinutesEdit-DateTimePicker.png

Precondition:

* On Minutes Edit click calandar icon
* **Hint: Currently the date picker is NOT translated!!!**

![](screenshots-en/005.1-Dlg.MinutesEdit-DateTimePicker.png)



<hr>

## 005.1-Msg.MinutesEdit.UploadError.png

Precondition:

* Create new Meeting Minutes
* Try to upload a file that is bigger than settings.json allows

![](screenshots-en/005.1-Msg.MinutesEdit.UploadError.png)




<hr>

## 005.1-Msg.MinutesEdit.UploadDeleteConfirmation.png

Precondition:

* Create new Meeting Minutes
* Upload a file attachment
* Click red "X" next to attachment file to delete it

![](screenshots-en/005.1-Msg.MinutesEdit.UploadDeleteConfirmation.png)




<hr>

## 005.1-Menu.MinutesEdit.Topic.png

Precondition:

* In Minutes Edit
* Create Topic
* Open Tree-Dot-Menu on Topic Item

![](screenshots-en/005.1-Menu.MinutesEdit.Topic.png)



<hr>

## 005.1-Menu.MinutesEdit.ActionItem.png

Precondition:

* In Minutes Edit
* Create Topic
* Add Action Item to Topic
* Open Tree-Dot-Menu on Action Item

![](screenshots-en/005.1-Menu.MinutesEdit.ActionItem.png)



<hr>

## 005.1-Menu.MinutesEdit.InfoItem.png

Precondition:

* In Minutes Edit
* Create Topic
* Add Info Item to Topic
* Open Three-Dot-Menu on Info Item

![](screenshots-en/005.1-Menu.MinutesEdit.InfoItem.png)



<hr>

## 005.1-Dlg.MinutesEdit.ItemConvert.png

Precondition:

* In Minutes Edit
* Create Topic
* Add Action Item to Topic
* Finalize Minutes, create new Minutes
* Open Three-Dot-Menu on Action Item
* Click 'Convert'

![](screenshots-en/005.1-Dlg.MinutesEdit.ItemConvert.png)



<hr>

## 005.1-Msg.MinutesEdit.AgendaResend.png

Precondition:

* In Minutes Edit
* Click "Send Agenda" once
* Click "Send Agenda" second time

![](screenshots-en/005.1-Msg.MinutesEdit.AgendaResend.png)



<hr>

## 005.2-Dlg.MinutesEdit.TopicEdit.png

Precondition:

* In Minutes Edit
* Add Topic

![](screenshots-en/005.2-Dlg.MinutesEdit.TopicEdit.png)



<hr>

## 005.2-Dlg.MinutesEdit.InfoItemEdit.png

Precondition:

* In Minutes Edit
* Add Topic
* Add Info Item to topic

![](screenshots-en/005.2-Dlg.MinutesEdit.InfoItemEdit.png)




<hr>

## 005.2-Dlg.MinutesEdit.ActionItemEdit.png

Precondition:

* In Minutes Edit
* Add Topic
* Add Action Item to topic

![](screenshots-en/005.2-Dlg.MinutesEdit.ActionItemEdit.png)



<hr>

## 005.4-Msg.MinutesEdit-ConfirmDeleteAction.png

Precondition:

* In Minutes Edit
* Create topic / actionitem
* Delete action item

![](screenshots-en/005.4-Msg.MinutesEdit-ConfirmDeleteAction.png)



<hr>

## 005.4-Msg.MinutesEdit-ConfirmDeleteDetails.png

Precondition:

* In Minutes Edit
* Create topic / actionitem / details
* Delete all text in details
* click outside to remove focus of details

![](screenshots-en/005.4-Msg.MinutesEdit-ConfirmDeleteDetails.png)



<hr>

## 005.4-Msg.MinutesEdit-ConfirmDeleteInfo.png

Precondition:

* In Minutes Edit
* Create topic / info item
* Delete info item

![](screenshots-en/005.4-Msg.MinutesEdit-ConfirmDeleteInfo.png)



<hr>

## 005.4-Msg.MinutesEdit-ConfirmDeleteTopic.png

Precondition:

* In Minutes Edit
* Create topic
* Delete topic

![](screenshots-en/005.4-Msg.MinutesEdit-ConfirmDeleteTopic.png)




<hr>

## 005.4-Msg.MinutesEdit-ConfirmDeleteMinutes.png

Precondition:

* In Minutes Edit
* Create topic
* Finalize Minutes, create new Minutes
* Tick 1st topic as discussed
* Create 2nd topic
* Click "Delete Minutes"

![](screenshots-en/005.4-Msg.MinutesEdit-ConfirmDeleteMinutes.png)




<hr>

## 005.3-Msg.MinutesEdit.FinalizeWarning.png

Precondition:

* In Minutes Edit
* Create topic with Action Item (without responsible!)
* Make sure no participants are marked
* Make sure no topics marked as discussed
* Click Finalize button

![](screenshots-en/005.3-Msg.MinutesEdit.FinalizeWarning.png)



<hr>

## 005.3-Msg.MinutesEdit.FinalizeWarning2.png

Precondition:

* In Minutes Edit
* Create topic with Action Item (without responsible!)
* Make sure no participants are marked
* Make sure one topics marked as discussed - but topic has no embedded item
* Click Finalize button

![](screenshots-en/005.3-Msg.MinutesEdit.FinalizeWarning2.png)



<hr>

## 005.3-Dlg.MinutesEdit.Finalize.png

Precondition:

* Create Meeting Minutes
* Create one topic with one action item
* Click Finalize button

![](screenshots-en/005.3-Dlg.MinutesEdit.Finalize.png)



<hr>

## 005.3-Msg.MinutesEdit.Finalize.png

Precondition:

* In Minutes Edit
* Click Finalize button
* Splash message after successful Minutes Finalize

![](screenshots-en/005.3-Msg.MinutesEdit.Finalize.png)




<hr>

## 006.1-Screen.Admin.Users.png

Precondition:

* Login admin user
* In user menu select 'Admin Tasks'

![](screenshots-en/006.1-Screen.Admin.Users.png)



<hr>

## 006.1-Dlg.Admin.NewUser.png

Precondition:

* Login admin user
* In user menu select 'Admin Tasks'
* Click 'Register New User'

![](screenshots-en/006.1-Dlg.Admin.NewUser.png)



<hr>

## 006.2-Screen.Admin.Messages.png

Precondition:

* Login admin user
* In user menu select 'Admin Tasks'
* Click tab 'Messages'

![](screenshots-en/006.2-Screen.Admin.Messages.png)



<hr>

## 007.1-Mail.Agenda.png

Precondition:

* Set email.enableMailDelivery = true in ./settings.json and configure accordingly
* Create new Meeting Minutes
* Create one topic
* Click "Send Agenda"

![](screenshots-en/007.1-Mail.Agenda.png)



<hr>

## 007.2-Mail.ActionItems.png

Precondition:

* Set email.enableMailDelivery = true in ./settings.json and configure accordingly
* Create new Meeting Minutes
* Create one topic with one action item and assign it yourself
* Click Finalize button

![](screenshots-en/007.2-Mail.ActionItems.png)



<hr>

## 007.3-Mail.FinishedAgenda.png

Precondition:

* Set email.enableMailDelivery = true in ./settings.json and configure accordingly
* Create new Meeting Minutes
* Create one topic
* Click Finalize button

![](screenshots-en/007.3-Mail.FinishedAgenda.png)



<hr>

## 007.4-Mail.ResetPassword.png

Precondition:

* No user logged in
* Click 'Forgot Your Password' and enter your email address

![](screenshots-en/007.4-Mail.ResetPassword.png)



<hr>

## 007.5-Mail.RoleChange.png

Precondition:

* Set email.enableMailDelivery = true in ./settings.json and configure accordingly
* Make sure second user with Mail address exists
* Create a new Meeting Series
* Invite second user to meeting series

![](screenshots-en/007.5-Mail.RoleChange.png)
