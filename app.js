const {ipcRenderer} = require('electron')

const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const circle = document.getElementById('circle')
const toolsUpload = document.getElementById('toolsUpload')
const toolsConfig = document.getElementById('toolsConfig')
const loadingFiles = document.getElementById('loadingFiles')
const imageQueryList = document.getElementById("imageQueryList");
const rangeDisplay = document.getElementById('range-display')
const qualityRange = document.getElementById('quality-range')
const compressed = document.getElementById('compressed')
const appResetClose = document.getElementById('app-reset-close')
const appResetClick = document.getElementById('app-reset-click')
var completedCheck = false
fileInput.addEventListener("change", uploadFiles);
uploadButton.addEventListener("click", convertFiles);
appResetClose.addEventListener("click", appReset);
appResetClick.addEventListener("click", appReset);
qualityRange.addEventListener("input", (e) => {
  rangeDisplay.innerText = `Comprimir: ${qualityRange.value}%`
});
loadingFiles.addEventListener("click", (e) => {
  toolsUpload.style.display = 'none'
  toolsConfig.style.display = 'flex'
});

async function appReset(e) {
  e.preventDefault()
  var result = await ipcRenderer.invoke("app-reset")
  compressed.style.display = 'none'
  completedCheck = false
  count = 0
  console.log(result)
}

var count = 0
var length = 0

const animateCSS = (element, animation, prefix = 'animate__') =>
  // We create a Promise and return it
  new Promise((resolve, reject) => {
    const animationName = `${prefix}${animation}`;
    const node = document.querySelector(element);

    node.classList.add(`${prefix}animated`, animationName);

    // When the animation ends, we clean the classes and resolve the Promise
    function handleAnimationEnd(event) {
      event.stopPropagation();
      node.classList.remove(`${prefix}animated`, animationName);
      resolve('Animation ended');
    }

    node.addEventListener('animationend', handleAnimationEnd, {once: true});
});

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

function dragOverHandler(ev) {
  console.log("File(s) in drop zone");

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
}

function dropHandler(ev) {
  console.log("File(s) dropped");

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
  length += ev.dataTransfer.files.length
  circle.max = length 
  
  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    [...ev.dataTransfer.items].forEach((item, i) => {
      // If dropped items aren't files, reject them
      if (item.kind === "file") {
        const file = item.getAsFile();
        loadImage(file, base64)
      }
    });
  } else {
    // Use DataTransfer interface to access the file(s)
    [...ev.dataTransfer.files].forEach((file, i) => {
      loadImage(file, base64)
    });
  }
}

async function uploadFiles(event) {
  event.preventDefault();

  const selectedFiles = fileInput.files;
  // Check if any files are selected
  if (selectedFiles.length === 0) {
    alert("Please select at least one file to upload.");
    return;
  }
  length += selectedFiles.length
  circle.max = length 

  for (let i = 0; i < selectedFiles.length; i++) {
    let file = selectedFiles[i];
    loadImage(file, base64)
  }
}
function loadImage(file, callback) {
  var reader = new FileReader();
  reader.onload = function(){
    let dataURL = this.result;
    callback(dataURL, file);
  };
  reader.readAsDataURL(file);
}
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

  // console.log(responseText)


