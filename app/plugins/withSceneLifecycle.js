const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

/**
 * iOS 27 stops apps at launch unless they use the scene-based life cycle. Expo SDK 57 ships
 * `ExpoAppSceneDelegate` for this, but its project template still starts React Native from the
 * app delegate. This plugin switches over: the app delegate only creates the React Native factory
 * (and hands it out through `ExpoReactNativeFactoryProvider`), and the scene delegate creates the
 * window and starts React Native in it. Remove once Expo's template does this itself.
 */
const START_IN_APP_DELEGATE = /#if os\(iOS\) \|\| os\(tvOS\)\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\s*factory\.startReactNative\([\s\S]*?\)\s*#endif\s*/;

module.exports = function withSceneLifecycle(config) {
  config = withAppDelegate(config, (c) => {
    if (c.modResults.language !== 'swift') throw new Error('withSceneLifecycle expects a Swift AppDelegate');
    let src = c.modResults.contents;
    if (!src.includes('ExpoReactNativeFactoryProvider')) {
      src = src.replace('class AppDelegate: ExpoAppDelegate {', 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {');
      if (!START_IN_APP_DELEGATE.test(src)) throw new Error('withSceneLifecycle: AppDelegate template changed; update the plugin');
      src = src.replace(START_IN_APP_DELEGATE, '    // The scene delegate (EXExpoAppSceneDelegate) creates the window and starts React Native.\n\n    ');
    }
    c.modResults.contents = src;
    return c;
  });

  return withInfoPlist(config, (c) => {
    c.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          { UISceneConfigurationName: 'Default Configuration', UISceneDelegateClassName: 'EXExpoAppSceneDelegate' },
        ],
      },
    };
    return c;
  });
};
