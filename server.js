const { app, ipcMain, BrowserWindow } = require('electron')
const { compress } = require('compress-images/promise');
const fs = require('fs');
const fsExtra = require('fs-extra');
const archiver = require('archiver');
const path = require('path')
var completedCheck =  false

fsExtra.emptyDirSync('img');
fsExtra.emptyDirSync('compress');
fsExtra.emptyDirSync('zip');

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  })
  win.maximize()

  win.loadFile('app.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle("get-images", async (event, image) => {
  fs.writeFileSync(`./img/${image.name}`, Buffer.from(image.dataurl.split(',')[1], 'base64'));
  return image
});

ipcMain.handle("convert-images", async (event, quality) => {
  const processImages = async (onProgress) => {
    const result = await compress({
        source: 'img/**/*.{jpg,JPG,jpeg,JPEG,png}',
        destination: 'compress/',
        onProgress,
        enginesSetup: {
            jpg: { engine: 'mozjpeg', command: ['-quality', `${quality}`]},
            png: { engine: 'pngquant', command: ['--quality', `${quality}`, '-o']},
        }
    });

    const { statistics, errors } = result;
    // statistics - all processed images list
    // errors - all errros happened list
  };

  processImages((error, statistic, completed) => {
      if (error) {
          console.log('Error happen while processing file');
          console.log(error);
          return;
      }
      console.log(statistic)
      
      if (completed) {
        var output = fs.createWriteStream('zip/compress.zip');
        var archive = archiver('zip');
  
        fsExtra.emptyDirSync('img');
  
        archive.pipe(output);
  
        // append files from a sub-directory, putting its contents at the root of archive
        archive.directory('compress/', false);
  
        archive.finalize();
  
        output.on('close', function () {
          console.log(archive.pointer() + ' total bytes');
          console.log('archiver has been finalized and the output file descriptor has closed.');
        });
  
        archive.on('error', function(err){
          throw err;
        });
  
        completedCheck = true
  
        console.log('Sucefully processed file');
      }
      return statistic
  });
})

ipcMain.handle("app-reset", async (event) => {
  fsExtra.emptyDirSync('img');
  fsExtra.emptyDirSync('compress');
  fsExtra.emptyDirSync('zip');
  completedCheck = false
  console.log('app resetado')
  return 'app resetado'
});

ipcMain.handle("compress-completed", async (event) => {
  return completedCheck
});