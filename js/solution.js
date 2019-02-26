'use strict';

const app = document.querySelector('.app'),
      menu = app.querySelector('.menu'),
      uploadButton = menu.querySelector('.new'),
      error = app.querySelector('.error'),
      img = app.querySelector('img'),
      imageLoader = app.querySelector('.image-loader');

// инициализация

setMenuState('initial');
img.src = '';

// загрузка изображений

function setMenuState(state) {
  switch(state){
    case 'initial':
      menu.setAttribute('data-state', 'initial');
      break;
    case 'default':
      menu.setAttribute('data-state', 'default');
      break;
    case 'selected':
      menu.setAttribute('data-state', 'selected');
      break;
  }
}


uploadButton.addEventListener('click', loadFile);
app.addEventListener('drop', loadImg);
app.addEventListener('dragover', event => event.preventDefault());


function loadFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg, image/png';
  input.click();
  input.addEventListener('change', loadImg);

}

function loadImg() {
  event.preventDefault();
  const file = event.type === 'drop' ? event.dataTransfer.files[0] : event.target.files[0];

  const fileTypeRegExp = /image\/jpeg|image\/png/;
  if (!fileTypeRegExp.test( file.type )) {
    error.setAttribute('style', 'display: inline-block');
    return;
  }
  error.setAttribute('style', 'display: none');
  imageLoader.setAttribute('style', 'display: inline-block');

  const formData = new FormData(),
        title = file.name.match(/\w*(?=.\w*$)/)[0],
        fileUrl = URL.createObjectURL(file);
  formData.append('title', title);
  formData.append('image', file);

  fetch('https://neto-api.herokuapp.com/pic', {
      method: 'POST',
      body: formData,
    })
    .then(onLoad)
    .catch(err => {
      console.error(err);
    });

  function onLoad(response) {
    imageLoader.setAttribute('style', 'display: none');
    response.text().then(text => {
      console.log(text);

      if(response.ok) {
        const data = JSON.parse(text);
        img.src = data.url;
        setMenuState('default');
      }
    });
  }


  // const canvas = document.createElement('canvas');
  // const ctx = canvas.getContext('2d');
  // canvas.width = img.width;
  // canvas.height = img.height;
  // ctx.drawImage(img, 0, 0, img.width, img.height);

}


