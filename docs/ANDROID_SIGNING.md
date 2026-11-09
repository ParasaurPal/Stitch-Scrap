# Android release signing

The Android APK must always be signed with the same private key for Android to accept upgrades over an installed copy. Do not commit the keystore or its Base64 contents to this public repository.

In GitHub, open **Settings → Secrets and variables → Actions → New repository secret** and add these four secrets:

- `STITCH_KEYSTORE_BASE64`: paste the entire contents of `STITCH_KEYSTORE_BASE64.txt` from the key package supplied privately to the repository owner.
- `STITCH_STORE_PASSWORD`: the keystore password supplied with that key package.
- `STITCH_KEY_ALIAS`: `stitchandscrap`
- `STITCH_KEY_PASSWORD`: the key password supplied with that key package.

After all four secrets are saved, rerun **Build Full Stitch & Scrap Android APK** from the Actions tab or push a new commit.

Keep a secure backup of the keystore and passwords. Losing them means future APKs cannot update this signed app. Do not share them or put them in source control.

The app ID remains `com.stitchandscrap.app`. Because earlier APKs were signed with a different temporary debug key, uninstall the old Stitch & Scrap app before installing the first APK signed with this permanent key. Uninstalling may erase locally stored app data; export or back up anything important first. After installing the permanently signed build, later APK updates can install over it without uninstalling.
