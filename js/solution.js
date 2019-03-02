'use strict';

const currentUrl = window.location.href,
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
      burger = menu.querySelector('.burger'),
      currentUrlRegExp = /\?id=/;

// инициализация

function initial() {
  // burger.setAttribute('style', 'display: none');
  img.src = '';
  cancelSelect('initial');

  // если перешли по ссылке поделиться
  if(currentUrlRegExp.test(currentUrl)) {
    menu.setAttribute('data-state', 'selected');
    menuComments.setAttribute('data-state', 'selected');
    menuUrl.value = currentUrl;
    loadShare();

  // если перезагрузили страницу
  } else if(sessionStorage.img) {
    img.src = sessionStorage.img
    menu.setAttribute('data-state', 'selected');
    menuUrl.value = currentUrl.split(/\?id=/)[0] + '?id=' + sessionStorage.id;
    share.setAttribute('data-state', 'selected');
  }
}

initial();

// назначение обработчиков

uploadButton.addEventListener('click', upload);
app.addEventListener('drop', upload);
app.addEventListener('dragover', event => event.preventDefault());
btnCopy.addEventListener('click', () => navigator.clipboard.writeText(menuUrl.value));
burger.addEventListener('click', () => cancelSelect('default'));

Array.from(menu.children).forEach(el => {
  if(el.classList.contains('mode')) {
    el.addEventListener('click', selectMode);
  }
});

// загрузка изображений
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

// создаем инпут и вешаем обработчик
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
      cancelSelect();
      menu.setAttribute('data-state', 'selected');
      share.setAttribute('data-state', 'selected');
    })
    .catch(err => {
      console.log(err);
    });
  }

// загаржаем данные с севрвера, если перешли по ссылке поделиться
function loadShare() {
  if(currentUrlRegExp.test(currentUrl)) {
    const id = currentUrl.match(/(?<=id=).*$/)[0];
    fetch(`https://neto-api.herokuapp.com/pic/${id}`)
    .then(onLoad)
    .catch(err => {
      console.log(err);
    });
  }
}

// проверяем данные с сервера и отображаем на холсте
function onLoad(response) {
  imageLoader.setAttribute('style', 'display: none');
  response.text().then(text => {
    // console.log(text);

    if(response.ok) {
      const data = JSON.parse(text);
      img.src = data.url;
      sessionStorage.img = data.url;
      sessionStorage.id = data.id;
      menuUrl.value = currentUrl.split(/\?id=/)[0] + '?id=' + data.id;
    } else {
      error.setAttribute('style', 'display: inline-block');
      errorMessage.innerHTML = text;
    }
  });
}

// отмена выбора пункта меню
function cancelSelect(menuState = 'selected') {
  menu.setAttribute('data-state', menuState);
  Array.from(menu.children).forEach(el => el.removeAttribute('data-state'));
}

// выбор пункта меню
function selectMode() {
  cancelSelect();
  event.currentTarget.setAttribute('data-state', 'selected');
}

// комментарии

const menuToggle = menu.querySelectorAll('.menu__toggle'),
      comments = document.querySelectorAll('.comments__form');

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
          attrs: { style: 'display: none' },
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
app.addEventListener('click', createCommentsForm);

// переключение отображения комментариев на холсте
function toggleComments() {
  const value = event.currentTarget.value;

  Array.from(comments).forEach(el => {
    if(value === 'off') {
      el.setAttribute('style', 'display: none');
    } else {
      el.removeAttribute('style');
    }
  });
}

function createCommentsForm() {

  if(!event.target.classList.contains('current-image') && !event.target.classList.contains('app')) {
    return;
  }
  const x = event.pageX,
        y = event.pageY;

  const newConmmentsForm = createElement(commentsForm),
        commentsBody = newConmmentsForm.querySelector('.comments__body'),
        submitBtn = newConmmentsForm.querySelector('.comments__submit'),
        closeBtn = newConmmentsForm.querySelector('.comments__close'),
        input = newConmmentsForm.querySelector('.comments__input'),
        markerCheck = newConmmentsForm.querySelector('.comments__marker-checkbox');

  // обраточки формы комментариев

  submitBtn.addEventListener('click', newComment);
  closeBtn.addEventListener('click', () => markerCheck.checked = false);
  markerCheck.addEventListener('click', () => {
    if(!event.currentTarget.checked) {
      event.currentTarget.checked = true
    }
  });



  // функции обраточиков
  function newComment() {
    event.preventDefault();
    const curTime = new Date(Date.now());
    let message = commentsBody.querySelector('.comments__input').value;
    insertComment(curTime, message);
    commentsBody.querySelector('.comments__input').value = '';
  }

  function insertComment(date, message) {
    date = date.toLocaleString('ru-Ru');
    const newComment = createElement(new Comment(date, message));
    const loaderWrap = commentsBody.querySelector('.loader').parentElement;
    commentsBody.insertBefore(newComment, loaderWrap);
  }

  newConmmentsForm.setAttribute('style', `top: ${y}px; left: ${x}px`)

  app.appendChild(newConmmentsForm);

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


  // const canvas = document.createElement('canvas');
  // const ctx = canvas.getContext('2d');
  // canvas.width = img.width;
  // canvas.height = img.height;
  // ctx.drawImage(img, 0, 0, img.width, img.height);

