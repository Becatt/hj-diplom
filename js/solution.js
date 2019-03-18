'use strict';
let connection;

const currentUrl = window.location.href,
      urlSplit = currentUrl.split(/\?id=/),
      app = document.querySelector('.app'),
      menu = app.querySelector('.menu'),
      uploadButton = menu.querySelector('.new'),
      error = app.querySelector('.error'),
      errorMessage = error.querySelector('.error__message'),
      img = app.querySelector('img'),
      imageLoader = app.querySelector('.image-loader'),
      share = menu.querySelector('.share'),
      menuUrl = menu.querySelector('.menu__url'),
      btnCopy = menu.querySelector('.menu_copy'),
      menuComments = menu.querySelector('.comments'),
      burger = menu.querySelector('.burger');

// меню
const dragMenu = menu.querySelector('.drag');

let isMoved = false;
let minY, minX, maxX, maxY;
let shiftX = 0;
let shiftY = 0;

const dragStart = event => {
  isMoved = true;
    minY = app.offsetTop;
    minX = app.offsetLeft;
    maxX = app.offsetLeft + app.offsetWidth - menu.offsetWidth;
    maxY = app.offsetTop + app.offsetHeight - menu.offsetHeight;
    shiftX = event.pageX - event.target.getBoundingClientRect().left - window.pageXOffset;
    shiftY = event.pageY - event.target.getBoundingClientRect().top - window.pageYOffset;

};

const drag = throttle((x, y) => {
  if (isMoved) {
    x = x - shiftX;
    y = y - shiftY;
    x = Math.min(x, maxX);
    y = Math.min(y, maxY);
    x = Math.max(x, minX);
    y = Math.max(y, minY);
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
  }
});
const drop = event => {
  if (isMoved) {
    const check = document.elementFromPoint(event.clientX, event.clientY);
    isMoved = false;
  }
};

dragMenu.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', event => drag(event.pageX, event.pageY));
document.addEventListener('mouseup', drop);

dragMenu.addEventListener('touchstart', event => dragStart(event.touches[0]));
document.addEventListener('touchmove', event => drag(event.touches[0].pageX, event.touches[0].pageY));
document.addEventListener('touchend', event => drop(event.changedTouches[0]));

function throttle(callback) {
  let isWaiting = false;
  return function () {
    if (!isWaiting) {
      callback.apply(this, arguments);
      isWaiting = true;
      requestAnimationFrame(() => {
        isWaiting = false;
      });
    }
  };
}

function setMenuState(setMenuState = 'selected') {
  menu.setAttribute('data-state', setMenuState);
  Array.from(menu.children).forEach(el => el.removeAttribute('data-state'));
}

// выбор пункта меню
function selectMode() {
  setMenuState();
  event.currentTarget.setAttribute('data-state', 'selected');
}

burger.addEventListener('click', () => setMenuState('default'));

// выбор пункта меню
Array.from(menu.children).forEach(el => {
  if(el.classList.contains('mode')) {
    el.addEventListener('click', selectMode);
  }
});

// инициализация

function initial() {
  img.src = '';
  img.draggable = false;
  setMenuState('initial');
  app.removeChild(app.querySelector('.comments__form'));
  console.log(urlSplit[1]);
  console.log(sessionStorage.id);
  menuUrl.value = currentUrl;
  console.log(sessionStorage.flag);

  // если загрузили картинку
  if(sessionStorage.flag === 'true') {
     menu.setAttribute('data-state', 'selected');
      share.setAttribute('data-state', 'selected');
      sessionStorage.flag = 'false';
  // если нажали обновить
  } else if(urlSplit[1] === sessionStorage.id) {
      setMenuState('default');
  // если перешли по ссылке
  } else {
      menu.setAttribute('data-state', 'selected');
      menuComments.setAttribute('data-state', 'selected');
  }

loadShare();
  // везде вызов loadShare, как-то криво
}

initial();

// режим публикации
// назнаение обработчиков

uploadButton.addEventListener('click', upload);
app.addEventListener('drop', upload);
app.addEventListener('dragover', event => event.preventDefault());
btnCopy.addEventListener('click', () => navigator.clipboard.writeText(menuUrl.value));

// функции

function upload() {

  event.preventDefault();
  const imgSrcRegExp = /^file/;

  if(event.type !== 'drop') {
    createInput();
    return;
  }

  if(imgSrcRegExp.test(img.src)) {
    const file = event.dataTransfer.files[0];
    loadImg(file);
    return;
  }
  error.setAttribute('style', 'display: inline-block');
  errorMessage.textContent = 'Чтобы загрузить новое  изображение, пожалуйста воспользуйтесь пунктом "Загрузить новое" в меню';
}

// создаем input и вешаем обработчик
function createInput() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg, image/png';
  input.click();
  input.addEventListener('change', () => loadImg());
}

// проверяем файл, загружаем картинку и отправляем на сервер
function loadImg(myFile = '') {
  const file = myFile ? myFile : event.target.files[0],
        fileTypeRegExp = /image\/jpeg|image\/png/;

  if (!fileTypeRegExp.test(file.type)) {
    error.setAttribute('style', 'display: inline-block');
    errorMessage.textContent = 'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.';
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
    .then((responce) => {
      onLoad(responce);
      setMenuState();
      menu.setAttribute('data-state', 'selected');
      share.setAttribute('data-state', 'selected');
    })
    .catch(err => {
      imageLoader.setAttribute('style', 'display: none');
      error.setAttribute('style', 'display: inline-block');
      errorMessage.textContent = err;
    });
}

// загружаем данные с севрвера с id из url
function loadShare() {
  if(urlSplit[1]) {
    fetch(`https://neto-api.herokuapp.com/pic/${urlSplit[1]}`)
    .then(onLoad)
    .catch(err => {
      console.log(err);
    });
  }
}

function onLoad(response) {
  imageLoader.setAttribute('style', 'display: none');
  response.text().then(text => {
    console.log(window.history.state);

    if(response.ok) {
      const data = JSON.parse(text);
      sessionStorage.id = data.id;

      if(window.location.href === `${urlSplit[0]}?id=${data.id}`) {
        img.src = data.url;
      } else {
        sessionStorage.flag = 'true'; // с булевым значением не работает
        window.location.href = `${urlSplit[0]}?id=${data.id}`
      }
    } else {
      error.setAttribute('style', 'display: inline-block');
      errorMessage.innerHTML = text;
    }
  });
}

