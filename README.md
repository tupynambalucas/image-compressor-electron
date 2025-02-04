# Image Compressor

Made with:
[Electron](https://www.electronjs.org)

> [!WARNING]
> You probably gonna have problems with the follow engines that come in ***package.json*** depending in winch system you are:<br/>
> <br/>
> pngquant<br/>
> mozjpeg<br/>
> <br/>
> In that case be sure to install them globaly in your environment.

### This image compressor was made for compressing 3D models textures, making them lighter for Web use purposes.

>[!NOTE]
> This project is just a first version, but it do work.<br/>
> Feel free to Clone this repository and make your own changes.

In your CLI, in the project root run:
```
npm install
```

## How it work?
In the renderer process(web page/ipcRenderer) the images that you upload (drag and dropping or selecting with upload button) are converted to base64(because electron ipcMain can't handle files)

Function called from drag and drop or file button (base64 is defined as the callback function):
```
loadImage(file, base64)
```

Here is the loadImage function:
```
function loadImage(file, callback) {
  var reader = new FileReader();
  reader.onload = function(){
    let dataURL = this.result;
    callback(dataURL, file);
  };
  reader.readAsDataURL(file);
}
```

Here is the callback as it follow:
```
async function base64(dataUrl, file) {

  let image = {
    name:file.name,
    dataurl:dataUrl
  }
  var result = await ipcRenderer.invoke("get-images", image)
  imageQueryList.innerHTML += `
  <div class="image-query-item">
    <img src="${result.dataurl}" name="${result.name}">
    <div class="image-query-item-display">
        <p>${result.name}</p>
    </div>
  </div>`
  count += 1
  circle.value += 1
  console.log(count)
}
```

Then it is sended to ipcMain with ***ipcRenderer.invoke("get-images", image)***, at this point ipcMain will run the follow code using fs:
```
fs.writeFileSync(`./img/${image.name}`, Buffer.from(image.dataurl.split(',')[1], 'base64'));
```

Simplifing, fs will write a file in(./img/) folder using the base64 buffer that it received from the renderer process, after that the button to compress the images that you upload will be shown, clicking it will run the convertFiles function in ipcRenderer:
```
async function convertFiles(event) {
  event.preventDefault()
  let quality = 101 - qualityRange.value
  let response = await ipcRenderer.invoke("convert-images", quality)
  console.log(response)
  while (completedCheck==false) {
      let response = await ipcRenderer.invoke("compress-completed")
      if (response==true) {
        completedCheck = true
        compressed.style.display = 'block'
        compressed.classList.add('animate__animated', 'animate__fadeIn');
        imageQueryList.innerHTML = ''
        toolsConfig.style.display = 'none'
        toolsUpload.style.display = 'block'
      }
  } 
}
```

And then in the ipcMain it will compress and write the files in (./compress/) folder:
```
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
```

## And thats it, the images are compressed by the percentage that you chose.
