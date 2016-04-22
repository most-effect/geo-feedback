ymaps.ready(function () {
    var myPlacemark,
        serverResponse,
        myMap = new ymaps.Map('map', {
            center: [55.755381, 37.619044],
            zoom: 12,
            behaviors: ['default', 'scrollZoom'],
            controls: ['smallMapDefaultSet']
        }, {
            searchControlProvider: 'yandex#search'
        });
    
    showAllPlaceMarks()
    
    function showAllPlaceMarks() {
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open('post', 'http://localhost:3000/', true)
        xhr.onload = function() {
            clusterer.removeAll();
            serverResponse = xhr.response;
            for (var address in xhr.response) {
                var reviews = xhr.response[address];

                reviews.forEach(function(review) {
                    placeMarkToMap([review.coords.x, review.coords.y], address, review.name, review.place, review.text, review.date);
                });
            }
        console.log(xhr.response);
        };
        xhr.send(JSON.stringify({op: 'all'}));
        function placeMarkToMap (coords, address, name, place, text, date) {
            myPlacemark = createPlacemark(coords);
            myPlacemark.properties.set({
                balloonContentHeader: place,
                balloonContentBody: text,
                balloonContentFooter: name + ' ' + date,
            });
            clusterer.add(myPlacemark);
        }
        
        // Создаём метки
        function createPlacemark(coords) {
            return new ymaps.Placemark(coords);
        }
    };

    // Создаем собственный макет с информацией о выбранном геообъекте.
    customItemContentLayout = ymaps.templateLayoutFactory.createClass(
        // Флаг "raw" означает, что данные вставляют "как есть" без экранирования html.
        '<h2 class=ballon_header>{{ properties.balloonContentHeader|raw }}</h2>' +
        '<div class=ballon_body>{{ properties.balloonContentBody|raw }}</div>' +
        '<div class=ballon_footer>{{ properties.balloonContentFooter|raw }}</div>'
    ),

    clusterer = new ymaps.Clusterer({
        clusterDisableClickZoom: true,
        clusterOpenBalloonOnClick: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonItemContentLayout: customItemContentLayout,
        clusterBalloonPanelMaxMapArea: 0,
        clusterBalloonContentLayoutWidth: 200,
        clusterBalloonContentLayoutHeight: 130,
        clusterBalloonPagerSize: 5
    }),

        getPointData = function (index) {
        return document.querySelector('.review').classList.remove('hide') && document.querySelector('.review').outerHTML
    },

        getPointOptions = function () {
        return {
            preset: 'islands#violetIcon'
        };
    },
    points = [],

    geoObjects = [];

    for(var i = 0, len = points.length; i < len; i++) {
        geoObjects[i] = new ymaps.Placemark(points[i], getPointData(i), getPointOptions());
    }

    clusterer.options.set({
        gridSize: 80,
        clusterDisableClickZoom: true
    });

    clusterer.add(geoObjects);
    myMap.geoObjects.add(clusterer);

// Слушаем клик на карте
    var coords = [],
        address = ''
    
    myMap.events.add('click', function (e) {
        var clickCoords = e.get('coords');
            click = e.get('pagePixels'),
            review = document.querySelector('.review'),
            
            //Определяем положение попапа
            review.style.left = click[0] + 'px';
            review.style.top  = click[1] + 'px';
            review.classList.remove('hide');
        
        //Получаем строку с адресом клика
        getAddress(clickCoords).then(function(gotAddress) {
            address = gotAddress.properties.get('description').split(', ').pop() + ',' + ' ' + gotAddress.properties.get('name');
        
            //Определяем геообъект и его центр
            coords = ymaps.geocode(address, {
                results: 1
            }).then(function (res) {
                var firstGeoObject = res.geoObjects.get(0);
                return coords = firstGeoObject.geometry.getCoordinates();
            });
        });
        
        // Определяем адрес по координатам (обратное геокодирование)
        function getAddress(clickCoords) {
            return ymaps.geocode(clickCoords).then(function (res) {
                return res.geoObjects.get(0);
            });
        }
        
        console.log(coords, address)
        document.querySelector('.address').innerText = address;
        getReviews ();
    });
    
    function getReviews () {
        /*--------------------ПОЛУЧАЕМ ОТВЕТ ОТ СЕРВЕРА--------------------*/
        var reviewsOnAddres = [],
            newAddress = address,

        coords = coords.filter(function (reviews) {
            if (newAddress) {
                if (newAddress.indexOf(reviews.address) > -1) {
                    reviewsOnAddres.push(reviews);
                    return false; 
                }   
            }
            return true;
        });

        /*--------------------ВСТАВЛЯЕМ ДАННЫЕ В ШАБЛОН ОТЗЫВА--------------------*/
        var rewiews = rewiewsListTemplate.innerHTML,
            templateFn = Handlebars.compile(rewiews),
            template = templateFn({list: reviewsOnAddres});
        rewiewsList.innerHTML = template;
    }
    
    document.getElementById('button-save').addEventListener('click', function (){
        yourname = document.getElementById('yourname'),
        place = document.getElementById('place'),
        text = document.getElementById('text')
        
        if ( yourname.value === '' ) {
            yourname.style.border = '1px solid #ff0000'
        } else {
            yourname.style.border = '1px solid #c4c4c4'
        };
        
        if ( place.value === '' ) {
            place.style.border = '1px solid #ff0000'
        } else {
            place.style.border = '1px solid #c4c4c4'
        };
        
        if ( text.value === '' ) {
            text.style.border = '1px solid #ff0000'
        } else {
            text.style.border = '1px solid #c4c4c4'
        };
        
        if ( yourname.value !== '' && place.value !== '' && text.value !== '') {
            var xhr = new XMLHttpRequest();
            xhr.open('post', 'http://localhost:3000/', true)
            xhr.send(JSON.stringify({
            op: 'add',
            review: {
                coords: {
                    x: coords[0],
                    y: coords[1]
                },
                address: address,
                name: yourname.value,
                place: place.value,
                text: text.value,
            }
            }))
            
            clearInuts();
            showAllPlaceMarks ();  
        };
    });

    document.querySelector('.close').addEventListener('click', function (){
        clearInuts();
    });
    
    // Очищаем форму при закрытии
    function clearInuts() {
        document.querySelector('.review').classList.add('hide');
        yourname.value = '';
        yourname.style.border = '1px solid #c4c4c4';
        place.value = '';
        place.style.border = '1px solid #c4c4c4';
        text.value = '';
        text.style.border = '1px solid #c4c4c4';
    }
    


});
