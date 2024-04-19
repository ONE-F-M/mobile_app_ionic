# Installation
- git clone https://github.com/ONE-F-M/mobile_app_ionic && cd mobile_app_ionic
- yarn install
- studio.sh, You can configure this with the CAPACITOR_ANDROID_STUDIO_PATH environment variable. e.g export CAPACITOR_ANDROID_STUDIO_PATH=/home/user1/Android/bin/studio.sh
- More: https://ionicframework.com/docs/vue/quickstart

# To Build
- ionic server # to run on browser.
- ionic build # produce static files.
- ionic cap add android|ios # to add platform if not exist. 
- ionic cap open android|ios # launch Android Studio or Xcode for Running the app