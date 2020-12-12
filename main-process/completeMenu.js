const { app, BrowserWindow, Menu, shell } = require('electron');
 const template = [
    //   { role: 'editMenu' },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ]
      },
    //   { role: 'viewMenu' },
      {
        label: 'View',
        submenu: [
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetzoom' },
          { role: 'zoomin' },
          { role: 'zoomout' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
    //   { role: 'windowMenu' },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          { role: 'close' }
        ]
      },
      {
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            icon: path.join(__dirname, '../static/assets/img/icons/help.png'),
            click: async () => {
              const { shell } = require('electron')
              await shell.openExternal('https://github.com/janjdev/SalesPoint')
            }
          },
          {
              label: 'Run Tour',
              id: 'help_manual',
              icon: path.join(__dirname, '../static/assets/img/icons/help.png'),
              click: () =>
             {
              win.loadURL(`file://${path.join(__dirname, "../help/Manual.html")}`);

              }
          },
          
        ]
      }
    ]
    module.exports = Menu.buildFromTemplate(template);