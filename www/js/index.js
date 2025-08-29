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

            const options = 'location=no,toolbar=no,hideurlbar=yes,hidenavigationbuttons=yes,lefttoright=yes,zoom=no';
            siteWindow = cordova.InAppBrowser.open('https://kultura-doma.ru/?source=app&version=1.0.0&version_app=android', '_blank', options)

            siteWindow.addEventListener('loaderror', function (params) {
                console.log('ERROR', params.message)
                errorWithFirstConnectOrOpenUrl()
                siteWindow.close()
                siteWindow = false
            })

            siteWindow.addEventListener('loadstop', function () {
                if (payloadWait !== '') {
                    let tmp = payloadWait
                    payloadWait = ''

                    /*siteWindow.executeScript({
                            code: "loadPushId('" + tmp + "')"
                        }
                    );*/
                }
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
            })
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
    openAppWindow()
}
