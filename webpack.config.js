const { withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: 'resume',
  expose: {
    './login': './src/app/components/login/login.ts',
  },
  remotes: {
    pdfEditor: 'pdfEditor@https://resumebuilder-pdfeditor.onrender.com/remoteEntry.js',
    coverLetter: 'coverLetter@https://coverletter-1-sbiz.onrender.com/remoteEntry.js',
    jobSearch: "jobSearch@https://your-jobsearch-app.vercel.app/remoteEntry.js"
  },
  shared: {
    '@angular/core': { singleton: true, strictVersion: true },
    '@angular/common': { singleton: true, strictVersion: true },
    '@angular/router': { singleton: true, strictVersion: true }
  }
});
