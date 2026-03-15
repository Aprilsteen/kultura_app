let siteWindow = false
let payloadWait = ''

let resumed = false

document.addEventListener("resume", onResume, false);

function onResume() {
    resumed = true
}

let errorWithFirstConnectOrOpenUrl = () => {
    document.body.className = 'mode-offline';

    setTimeout(() => {
        openAppWindow()
    }, 5000)

    if (siteWindow === false) {
        return
    }

    siteWindow.hide()
}

let openAppWindow = () => {
    if (siteWindow === false) {
        if (navigator.onLine/* && navigator.connection.type !== Connection.CELL_2G*/) {
            document.body.className = 'mode-online';

            //const options = 'location=no,toolbar=no,hideurlbar=yes,hidenavigationbuttons=yes,lefttoright=yes,zoom=no,mediaPlaybackRequiresUserAction=no';
            //siteWindow = cordova.InAppBrowser.open('https://kultura-doma.ru/?source=app&version=1.0.4&version_app='+cordova.platformId, '_target', options)

            const options = 'location=yes';
            var url = 'https://kultura-doma.ru/?source=app&version=1.0.4&version_app='+cordova.platformId;
            console.log('URL', url);

            window.location.href = url;
            document.body.classList.add('site-loaded');

            //siteWindow = cordova.InAppBrowser.open(url, '_target', options);
            //window.open(url, '_system');
            //window.location.href = url;

            /*
            siteWindow.addEventListener('loaderror', function (params) {
                console.log('ERROR', params.message)
                errorWithFirstConnectOrOpenUrl()
                siteWindow.close()
                siteWindow = false
            })

            siteWindow.addEventListener('loadstop', function () {
                console.log('loadstop');

                // ПОЛНОСТЬЮ ПРЯЧЕМ ИНТЕРФЕЙС ПРИЛОЖЕНИЯ
                document.body.style.display = 'none';
                document.documentElement.style.overflow = 'hidden';
                
                // Если есть какие-то контейнеры с вашим дизайном — тоже прячем
                var wrapper = document.querySelector('.wrapper-offline');
                if (wrapper) wrapper.style.display = 'none';
                
                // Принудительно показываем браузер
                setTimeout(function() {
                    if (siteWindow) {
                        siteWindow.show();
                        console.log('Browser shown after delay');
                    }
                }, 300);
            })

            siteWindow.addEventListener('message', (params) => {
                if (typeof params.data.type === 'undefined') {
                    return
                }

                if (params.data.type === 'openUrlInBrowser') {
                    console.log('open system browser:')
                    console.log(params.data.url)

                    window.open(params.data.url, '_system')
                }

                console.log(params.data.type)
            })*/

        } else {
            errorWithFirstConnectOrOpenUrl()
        }
    } else {
        siteWindow.show()
    }
}

document.addEventListener("deviceready", onDeviceReady, false);
document.addEventListener("offline", () => {
    document.body.className = 'mode-offline';

    if (siteWindow === false) {
        return
    }

    siteWindow.hide()
}, false);
document.addEventListener("online", () => {
    document.body.className = 'mode-online';
    // openAppWindow()
}, false);

function onDeviceReady() {
    document.body.className = 'mode-online';

    if (cordova.platformId === 'ios') {
        openAppWindow();
    }
    else {
        // Сначала запрашиваем разрешение на микрофон
        requestMicrophonePermission()
            .then(() => {
                console.log('✅ Разрешение получено, открываем сайт');
                openAppWindow();
            })
            .catch((err) => {
                console.warn('Нет разрешения на микрофон:', err);
                // Всё равно открываем сайт, но микрофон работать не будет
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
