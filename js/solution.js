'use strict';
let connection;

const currentUrl = window.location.href,
      urlSplit = currentUrl.split(/\?id=/),
      app = document.querySelector('.app'),
      error = app.querySelector('.error'),
      errorMessage = error.querySelector('.error__message'),
      img = app.querySelector('img');

// меню
const menu = app.querySelector('.menu'),
      dragMenu = menu.querySelector('.drag'),
      burger = menu.querySelector('.burger'),
      uploadButton = menu.querySelector('.new'),
      menuComments = menu.querySelector('.comments'),
      menuToggle = menu.querySelectorAll('.menu__toggle'),
      menuDraw = menu.querySelector('.draw'),
      drawTools = menu.querySelector('.draw-tools'),
      share = menu.querySelector('.share');

// плавающее меню
let isMoved = false;
let minY, minX, maxX, maxY;
let shiftX = 0;
let shiftY = 0;

function getMenuWidth() {
  const menuBorderWidth = menu.offsetWidth - menu.clientWidth;
  let width = dragMenu.offsetWidth + menu.clientLeft * 2;
  if(menu.getAttribute('data-state') === 'default') {
    width += uploadButton.offsetWidth + menuComments.offsetWidth + menuDraw.offsetWidth + share.offsetWidth;
  } else if (menu.getAttribute('data-state') === 'selected') {
    const selected = menu.querySelector('[data-state="selected"]'),
          selectedToolsWidth = selected.nextElementSibling.classList.contains('tool') ? selected.nextElementSibling.offsetWidth : 0;
    width += burger.offsetWidth + selected.offsetWidth + selectedToolsWidth;
  } else {
    width += uploadButton.offsetWidth;
  }
  return width;
}

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
    menu.style.left = x - 1 + 'px';
    menu.style.top = y - 1 + 'px';
  }
});

const drop = event => {
  if (isMoved) {
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
  return function () {
      callback.apply(this, arguments);
  };
}

// Установка режима меню
function setMenuState(setMenuState = 'selected') {
  menu.setAttribute('data-state', setMenuState);
  Array.from(menu.children).forEach(el => el.removeAttribute('data-state'));
}

// выбор пункта меню
function selectMode() {
  setMenuState();
  event.currentTarget.setAttribute('data-state', 'selected');
  changePos(menu.getBoundingClientRect().x, menu.getBoundingClientRect().y);
}

// чтобы меню не разваливалось при измении размеров
function changePos(x, y) {
  maxX = app.offsetLeft + app.offsetWidth - getMenuWidth();
  maxY = app.offsetTop + app.offsetHeight - menu.offsetHeight;
  x = Math.min(x, maxX);
  y = Math.min(y, maxX);
  menu.style.left = Math.floor(x) + 'px';
  menu.style.top = Math.floor(y) + 'px';
  console.log(menu.offsetWidth);
  console.log(getMenuWidth());
}

burger.addEventListener('click', () => {
  setMenuState('default');
  changePos(menu.getBoundingClientRect().x, menu.getBoundingClientRect().y);
});

Array.from(menu.children).forEach(el => {
  if(el.classList.contains('mode')) {
    el.addEventListener('click', selectMode);
  }
});

// Установка режима меню при загрузке старницы

function setMode() {
  if(!urlSplit[1]) {
    setMenuState('initial');
    burger.style.display = 'none';
  }
  else if(sessionStorage.flag === 'true') {
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
}

// режим публикации
const menuUrl = menu.querySelector('.menu__url'),
      btnCopy = menu.querySelector('.menu_copy'),
      imageLoader = app.querySelector('.image-loader');

// назнаение обработчиков

uploadButton.addEventListener('click', upload);
app.addEventListener('drop', upload);
app.addEventListener('dragover', event => event.preventDefault());
btnCopy.addEventListener('click', () => navigator.clipboard.writeText(menuUrl.value));

// функции

function upload() {
  event.preventDefault();
  const imgSrcRegExp = /\.jpeg$|\.png$/;

  if(event.type !== 'drop') {
    createInput();
    return;
  }

  console.log(img.src);
// проверить в демо режиме
  if(img.src === urlSplit[0]) { // imgSrcRegExp.test(img.src) старое условие
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
    })
    .catch(err => {
      imageLoader.setAttribute('style', 'display: none');
      error.setAttribute('style', 'display: inline-block');
      errorMessage.textContent = err;
    });
}

function onLoad(response) {
  imageLoader.setAttribute('style', 'display: none');
  response.text().then(text => {
    if(!response.ok) {
      error.setAttribute('style', 'display: inline-block');
      errorMessage.innerHTML = text;
      return;
    }
    const data = JSON.parse(text);
    sessionStorage.id = data.id;
    sessionStorage.flag = 'true'; // с булевым значением не работает
    window.location.href = `${urlSplit[0]}?id=${data.id}`
  });
}

// веб сокет

function startWebSocket() {
  if(!urlSplit[1]) {
    return;
  }
  connection = new WebSocket(`wss://neto-api.herokuapp.com/pic/${urlSplit[1]}`);

  connection.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    // console.log(data);
    insertData(data);
  });

}

function insertData(data) {
  if(data.event === 'pic') {
    img.src = data.pic.url;
    sessionStorage.id = data.pic.id;
    addMask(data.pic.mask);
    for (const key in data.pic.comments){
      insertComment(data.pic.comments[key]);
    }
  } else if(data.event === 'comment') {
    insertComment(data.comment);
  } else if(data.event === 'mask') {
    mask.src = data.url;
  } else if(data.event === 'error') {
    console.error(data.message);
  }
}

// режим комментирования

const commentsForm = {
  tag: 'form',
  cls: 'comments__form',
  content: [{
    tag: 'span',
    cls: 'comments__marker',
  },
  {
    tag: 'input',
    cls: 'comments__marker-checkbox',
    attrs: { type: 'checkbox' }
  },
  {
    tag: 'div',
    cls: 'comments__body',
    content: [{
      tag: 'div',
      cls: 'comment',
      content: {
        tag: 'div',
        cls: 'loader',
        attrs: { hidden: true },
        content: [{tag: 'span'}, {tag: 'span'}, {tag: 'span'}, {tag: 'span'}, {tag: 'span'}]
      }
    },
    {
      tag: 'textarea',
      cls: 'comments__input',
      attrs: { typy: 'text', placeholder: 'Напишите ответ...' }
    },
    {
      tag: 'input',
      cls: 'comments__close',
      attrs: { type: 'button', value: 'Закрыть' }
    },
    {
      tag: 'input',
      cls: 'comments__submit',
      attrs: { type: 'submit', value: 'Отправить' }
    }
    ]
  }]
}

class Comment {
  constructor(time, message) {
    this.tag = 'div';
    this.cls = 'comment',
    this.content = [{
      tag: 'p',
      cls: 'comment__time',
      content: time
    },
    {
      tag: 'p',
      cls: 'comment__message',
      content: message
    }]
  }
}


// назначение обработчиков

Array.from(menuToggle).forEach(el => el.addEventListener('click', toggleComments));
app.addEventListener('click',() =>{
  if(event.target.tagName !== 'CANVAS') {
    return;
  }
  if(menuComments.getAttribute('data-state') !== 'selected') {
    return;
  }
  createCommentsForm();
});

// переключение отображения комментариев на холсте
function toggleComments() {
  const value = event.currentTarget.value,
  comments = app.querySelectorAll('.comments__form');

  Array.from(comments).forEach(el => {
    if(value === 'off') {
      el.hidden = true;
    } else {
      el.hidden = false;
    }
  });
}

function createCommentsForm(data = '') {

  // если при создании новой формы включен режим скрыть комментарии
  if(menuToggle[1].checked && !data) {
    return;
  }

  closeAllForms();

  const newConmmentsForm = createElement(commentsForm),
        commentsBody = newConmmentsForm.querySelector('.comments__body'),
        submitBtn = newConmmentsForm.querySelector('.comments__submit'),
        closeBtn = newConmmentsForm.querySelector('.comments__close'),
        input = newConmmentsForm.querySelector('.comments__input'),
        markerCheck = newConmmentsForm.querySelector('.comments__marker-checkbox'),
        loader = newConmmentsForm.querySelector('.loader');

  // обраточки формы комментариев

  app.appendChild(newConmmentsForm);
  const x = data ? data.left : event.pageX - markerCheck.getBoundingClientRect().width/2 + pageXOffset,
        y = data ? data.top : event.pageY + pageYOffset;

  submitBtn.addEventListener('click', sendComment);
  closeBtn.addEventListener('click', () => markerCheck.checked = false);
  input.addEventListener('input', showLoader);
  markerCheck.addEventListener('click', openForm);

  newConmmentsForm.setAttribute('style', `top: ${y}px; left: ${x}px; z-index: 15`);

  markerCheck.checked = true;

  // функции обраточиков
  function sendComment() {
    event.preventDefault();
    const curTime = new Date(Date.now());
    let message = `message=${commentsBody.querySelector('.comments__input').value}&left=${x}&top=${y}`;
    fetch(`https://neto-api.herokuapp.com/pic/${urlSplit[1]}/comments`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/x-www-form-urlencoded'
      },
      body: message
    })
    .catch(err => {
      imageLoader.setAttribute('style', 'display: none');
      error.setAttribute('style', 'display: inline-block');
      errorMessage.textContent = err;
    });

    loader.hidden = true;
    input.value = '';
  }

  function showLoader() {
    const mes = event.currentTarget.value;
    loader.hidden = false;
    setTimeout(() => {
      if(mes === input.value) {
        loader.hidden = true;
      }
    }, 5000); // скрываем лоадер, если пользователь не печатает более 5 секунды
  }

  function openForm() {
    closeAllForms();
    if(!event.currentTarget.checked) {
      event.currentTarget.checked = true;
    }
  }

  return newConmmentsForm;
}

function insertComment(comment) {
  const date = new Date(comment.timestamp).toLocaleString('ru-Ru'),
        sendComment = createElement(new Comment(date, comment.message)),
        elemXY = document.elementFromPoint(comment.left, comment.top),
        elem = app.querySelector(`[style="top: ${comment.top}px; left: ${comment.left}px; z-index: 15"]`), // узкое место
        form = elem ? elem : createCommentsForm(comment),
        commentsBody = form.querySelector('.comments__body'),
        loader = form.querySelector('.loader'),
        marker = form.querySelector('.comments__marker-checkbox');
  commentsBody.insertBefore(sendComment, loader.parentElement);
  form.hidden = menuToggle[1].checked ? true : false;
}


function createElement(block) {
 if ((block === undefined) || (block === null) || (block === false)) {
      return document.createTextNode('');
  }
  if ((typeof block === 'number') || (typeof block === 'string') || (block === true)) {
      return document.createTextNode(block.toString());
  }

  if (Array.isArray(block)) {
    return block.reduce((f, item) => {
      f.appendChild(
          createElement(item)
      );

      return f;
    }, document.createDocumentFragment());
  }

  const element = document.createElement(block.tag);

  if (block.cls) {
    element.classList.add(...[].concat(block.cls));
  }

  if (block.attrs) {
    Object.keys(block.attrs).forEach(key => {
      element.setAttribute(key, block.attrs[key]);
    });
  }

  if (block.content) {
      element.appendChild(createElement(block.content));
  }

  return element;
}

function closeAllForms() {
  const forms = app.querySelectorAll('.comments__form');
  Array.from(forms).forEach((el) => {
    el.querySelector('.comments__marker-checkbox').checked = false;
    removeEmptyForm(el);
  });
}

function removeEmptyForm(form) {
  if(!form.querySelector('.comment__message')) {
    app.removeChild(form);
  }
}

// режим рисования

const canvas = document.createElement('canvas'),
      mask = document.createElement('img'),
      ctx = canvas.getContext('2d'),
      colors = drawTools.querySelectorAll('.menu__color'),
      brushRadius = 4;

let curve = [],
    drawing = false,
    needsRepaint = false;

function getHue() {
  let color;
  Array.from(colors).forEach(el => {
    if(el.checked) {
      switch(el.value) {
        case 'red':
          color = '#ea5d56';
          break;
        case 'yellow':
          color = '#f3d135';
          break;
        case 'green':
          color = '#6cbe47';
          break;
        case 'blue':
          color = '#53a7f5';
          break;
        case 'purple':
          color = '#b36ade';
          break;
      }
    }
  })
  return color;
}

function addCanvas() {
  app.appendChild(canvas);
  canvas.setAttribute('style', `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: block; z-index: 10`);
  canvas.width = img.width;
  canvas.height = img.height;
}

function addMask(url) {
  mask.src = url ? url : '';
  mask.setAttribute('style', `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: block; z-index: 9`);
  mask.draggable = false;
  app.appendChild(mask);
}

// Сглаживание точки
function circle(point) {
  ctx.fillStyle = getHue();
  ctx.beginPath();
  ctx.arc(...point, brushRadius / 2, 0, 2 * Math.PI);
  ctx.fill();
}

function smoothCurveBetween (p1, p2) {
  const cp = p1.map((coord, idx) => (coord + p2[idx]) / 2);
  ctx.quadraticCurveTo(...p1, ...cp);
}

function smoothCurve(points) {
  ctx.beginPath();
  ctx.lineWidth = brushRadius;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.moveTo(...points[0]);

  for(let i = 1; i < points.length - 1; i++) {
    smoothCurveBetween(points[i], points[i + 1]);
  }
  ctx.strokeStyle = getHue();
  ctx.stroke();
  ctx.closePath();
}

// Назначение обработчиков

canvas.addEventListener("mousedown", (evt) => {
  if(menuDraw.getAttribute('data-state') !== 'selected') {
    return;
  }
  drawing = true;
  curve.push([evt.offsetX, evt.offsetY]); // добавляем новую точку
  needsRepaint = true;
  sendMask();
});

canvas.addEventListener("mouseup", (evt) => {
  if(menuDraw.getAttribute('data-state') !== 'selected') {
    return;
  }
  drawing = false;
  curve = [];
  // canvas.toBlob(blob => connection.send(blob)); // веб сокет
});

canvas.addEventListener("mouseleave", (evt) => {
  drawing = false;
});

canvas.addEventListener("mousemove", (evt) => {
  if(menuDraw.getAttribute('data-state') !== 'selected') {
    return;
  }
  if (drawing) {
    const point = [evt.offsetX, evt.offsetY];
    curve.push(point);
    needsRepaint = true;
  }
});

function tick () {
  if(needsRepaint) {
    circle(curve[0]);
    smoothCurve(curve);
    needsRepaint = false;
  }
  window.requestAnimationFrame(tick);
}

tick();

function sendMask() {
  // if(!drawing) {
  //   return;
  // }
    // ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(blob => connection.send(blob));
  if(drawing) {
    setTimeout(() => {
      sendMask();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 1000);
  }
}


// инициализация

function initial() {
  img.src = '';
  img.draggable = false;
  app.removeChild(app.querySelector('.comments__form'));
  menuUrl.value = currentUrl;
  startWebSocket();
  setMode();
  setTimeout(addCanvas, 2000); // Очень ненадежнно, надо бы на промис переделать
}

initial();
