const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Set custom port for development server
  if (config.devServer) {
    config.devServer.port = 8090;
  } else {
    config.devServer = {
      port: 8090
    };
  }
  
  return config;
};