const { withAndroidManifest } = require('@expo/config-plugins');
module.exports = function withMapRenderer(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const rendererMetaData = {$: {'android:name': 'com.google.android.gms.maps.renderer', 'android:value': 'LATEST'}};
    if (!androidManifest.manifest.application) {return config;}
    const app = androidManifest.manifest.application[0];
    app['meta-data'] = app['meta-data'] || [];
    app['meta-data'] = app['meta-data'].filter((item) => item.$['android:name'] !== 'com.google.android.gms.maps.renderer');
    app['meta-data'].push(rendererMetaData);
    return config;
  });
};