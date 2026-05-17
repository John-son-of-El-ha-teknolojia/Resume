const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  remotes: {
  pdfEditor: 'pdfEditor@http://localhost:2000/remoteEntry.js',
  coverLetter: 'coverLetter@http://localhost:3000/remoteEntry.js',
},
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
});
