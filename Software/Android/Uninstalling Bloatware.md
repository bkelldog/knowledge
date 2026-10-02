Is your phone filled with manufacturer or carrier apps that you'll never use, but which you can't remove? Like "Samsung Checkout", "Samsung Cloud", "Galaxy Themes", "AR Zone", or "Sprint Worldwide"? (Yes my phone is old enough to have Sprint carrier apps). For some reason, companies don't think we're capable of deciding to opt out of these services, despite the fact that we never use them.

Let's surgically insert ourselves into Android and remove these packages by force. No root access needed.

CAVEAT: Since there is no root access needed in this method, it will only uninstall an app for the main user of the phone. It will not remove the APK from the system, and will not free up memory which is taken up by APKs. Root access is required to do that.

# Step 1: Enable Developer Options
[Enable Developer Options](https://developer.android.com/studio/debug/dev-options)
# Step 2: Enable WiFi Debugging
[Enable WiFi Debugging](https://developer.android.com/tools/adb#connect-to-a-device-over-wi-fi)
# Step 3: Install ADB on Your Computer
[ADB](https://developer.android.com/tools/adb), or Android Debug Bridge, is a tool that allows a developer (you!) to communicate with an Android device over the terminal / command line. It gives the developer much greater powers than the regular phone user, yet it does not constitute root access and does not void the warranty or whatever (as far as I know). ADB feels like putting your phone back into developer mode by halfway, but you can also screw things up quickly, so beware.

From your computer (I assume Windows), download the Android SDK from [here](https://developer.android.com/tools/releases/platform-tools), ADB is included. You will download a .zip, and since ADB is a useful tool, I extracted the contents to `C:\adb`.
# Step 4: Pair and Connect
ADB, like Bluetooth, requires a pairing between server and client device. Make sure that these two devices are on the same wifi network.
## Pair Device
On mobile device:
1. Go into wifi debug menu by tapping on the "Wireless Debugging" card.
2. You will see an IP address and port specified, you'll need these later. For example, `192.168.1.145:36109`
3. Tap on "Pair Device with Pairing Code". You will receive a 6-digit code as well as the device's IP address and a **new** port to connect to. For example, `192.168.1.145:34147`. (Note that this code will timeout if you aren't quick enough).

On computer:
1. Open the command line and navigate to wherever you extracted the platform tools (in my case, `C:\adb`).
2. Run `adb pair IP_ADDRESS:PORT`, inserting the IP address and the *pairing* port. Using the earlier example, you would run `adb pair 192.168.1.145:34147`.
3. ADB will prompt you for the 6-digit pairing code, enter it.
4. ADB should now be paired with your computer, and you should be able to see your computer's user listed on your phone's wifi debug screen.
## Connect to Device
Pairing is not enough to connect over ADB. If you are paired, you must now connect. This process should be simple and easy: on your computer in the terminal / CMD enter `adb connect IP_ADDRESS:PORT`, using the IP and port from the general wifi debug menu, not the pairing code menu. Following the earlier example, you would run `adb connect 192.168.1.145:36109`.

If successful, you will see an ADB daemon running in the background, though this doesn't mean you are within the target device. You can either directly enter the device's command line by running `adb shell`, or you can prepend `adb shell` to the beginning of every command given after this point. I will assume you enter using `adb shell` directly.

It should be noted that if you run `adb shell` and get in response the `more than one device/emulator` error, it means you have to specify which device or device emulator you want to shell into. See available devices with `adb devices`, and choose the one you want with `adb -s IP_ADDRESS:PORT shell`. You can tell a device is right because either all other devices will say `status: offline`, and/or the correct device's port number will match the one you connected to before, e.g. `36109`.

# Step 5: Find Your Packages
Once in the ADB shell, you can find all packages on your device using `pm` (package manager):
```sh
pm list packages
```
This will list every piece of software on the device which isn't part of the OS, so you will see some core programs that should never be touched carelessly. You'll also see that what's listed here are package names, not app names, and it can be hard or impossible to find the apps you want to delete listed here.

It is possible to remove all of a service just by package names. For example, I wanted to lobotomize my phone of [Bixby](https://www.samsung.com/us/apps/bixby/), Samsung's failed version of Siri, so I ran this command,
```sh
pm list packages | grep "bixby"
```
This gave me every package that had "bixby" somewhere in the name, all of which I wanted to delete.
## Finding Package Names Through the Phone
You can install [this app](https://play.google.com/store/apps/details?id=a9.ivps.packagemanager&hl=en-US), or any of a number of apps which do the same thing. These list all the apps on your phone together with each app's package name, so you can search for a useless app like "Samsung AR Emojis" and see its package name directly.
# Step 6: Delete
The command to delete is,
```sh
pm uninstall --user 0 com.package.name
```
where `--user 0` specifies the user to delete the package *for*, in this case the main user (you!) with ID = 0. As a safety feature we can also preserve the app's cache and data with the `-k` flag: if this is done and the app is reinstalled later, all the app data will reappear,
```
pm uninstall -k --user 0 com.package.name
```
If you delete a package for an app and then check back on your phone screen, you'll see the app disappeared immediately when the command completed.