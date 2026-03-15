let siteWindow = false; // больше не используется, но оставим для совместимости
let payloadWait = '';
let resumed = false;

document.addEventListener("resume", onResume, false);

function onResume() {
    resumed = true;
}

let errorWithFirstConnectOrOpenUrl = () => {
    document.body.className = 'mode-offline';
    
    // Скрываем iframe
    document.getElementById('site-frame').style.display = 'none';
    
    setTimeout(() => {
        openAppWindow();
    }, 5000);
};

let openAppWindow = () => {
    if (navigator.onLine) {
        document.body.className = 'mode-online';
        
        var url = 'https://kultura-doma.ru/?source=app&version=1.0.4&version_app=' + cordova.platformId;
        console.log('URL', url);
        
        // Загружаем сайт в iframe
        var iframe = document.getElementById('site-frame');
        iframe.src = url;
        iframe.style.display = 'block';
        
        // Слушаем сообщения от сайта (для открытия ссылок)
        window.addEventListener('message', function(event) {
            // Проверяем, что сообщение от нашего iframe
            if (event.source === iframe.contentWindow) {
                var data = event.data;
                console.log(data);
                if (data.type === 'openUrlInBrowser') {
                    console.log('open system browser:', data.url);
                    window.open(data.url, '_system');
                }
            }
        });
        
    } else {
        errorWithFirstConnectOrOpenUrl();
    }
};

document.addEventListener("deviceready", onDeviceReady, false);

document.addEventListener("offline", () => {
    document.body.className = 'mode-offline';
    document.getElementById('site-frame').style.display = 'none';
}, false);

document.addEventListener("online", () => {
    document.body.className = 'mode-online';
    if (navigator.onLine) {
        setTimeout(openAppWindow, 1000);
    }
}, false);

function onDeviceReady() {
    document.body.className = 'mode-offline'; // начинаем с офлайн-режима
    
    if (cordova.platformId === 'ios') {
        openAppWindow();
    } else {
        // Для Android запрашиваем микрофон
        requestMicrophonePermission()
            .then(() => {
                console.log('✅ Разрешение получено, открываем сайт');
                openAppWindow();
            })
            .catch((err) => {
                console.warn('Нет разрешения на микрофон:', err);
                openAppWindow();
            });
    }
}

function requestMicrophonePermission() {
    return new Promise((resolve, reject) => {
        var permissions = cordova.plugins.permissions;
        permissions.requestPermission(
            permissions.RECORD_AUDIO,
            function(status) {
                if (status.hasPermission) {
                    console.log('Микрофон разрешён пользователем');
                    resolve(true);
                } else {
                    console.log('Пользователь отклонил микрофон');
                    reject(new Error('Permission denied'));
                }
            },
            function(error) {
                console.error('Ошибка запроса разрешения:', error);
                reject(error);
            }
        );
    });
}