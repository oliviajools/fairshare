#!/bin/sh

# Xcode Cloud post-clone script
# Installs CocoaPods dependencies

echo "Installing CocoaPods..."
cd "$CI_PRIMARY_REPOSITORY_PATH/ios/App"
pod install

echo "CocoaPods installation complete!"
